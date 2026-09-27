"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductFilters } from "@/lib/products/filters";
import { queryKeys } from "@/lib/query-client";
import { categoryService, productImageService, productService } from "@/services/product.service";
import { ratingService } from "@/services/rating.service";
import type { Product, ProductInput, RatingInput } from "@/types/product";

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: ({ signal }) => productService.list(filters, signal),
    // Keep showing the current page while the next one loads (no flash of empty grid).
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: ({ signal }) => productService.get(id, signal),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: ({ signal }) => categoryService.list(signal),
    staleTime: 10 * 60_000,
  });
}

export function useProductRatings(productId: number, page: number) {
  return useQuery({
    queryKey: queryKeys.ratings.list(productId, page),
    queryFn: ({ signal }) => ratingService.list(productId, page, undefined, signal),
    placeholderData: keepPreviousData,
  });
}

/** After a rating changes, the product's average and every list that shows it are stale. */
function useInvalidateAfterRating(productId: number) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all(productId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    ]);
}

export function useCreateRating(productId: number) {
  const invalidate = useInvalidateAfterRating(productId);
  return useMutation({
    mutationFn: (input: RatingInput) => ratingService.create(productId, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateRating(productId: number) {
  const invalidate = useInvalidateAfterRating(productId);
  return useMutation({
    mutationFn: ({ ratingId, input }: { ratingId: number; input: RatingInput }) => ratingService.update(productId, ratingId, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteRating(productId: number) {
  const invalidate = useInvalidateAfterRating(productId);
  return useMutation({
    mutationFn: (ratingId: number) => ratingService.remove(productId, ratingId),
    onSuccess: () => invalidate(),
  });
}

/* ---------- product create / update / delete ---------- */

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, images }: { input: ProductInput; images: File[] }) => productService.create(input, images),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.products.detail(product.id), product);
      return queryClient.invalidateQueries({ queryKey: queryKeys.products.all, refetchType: "none" });
    },
  });
}

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProductInput>) => productService.update(id, input),
    onSuccess: (product) => {
      queryClient.setQueryData(queryKeys.products.detail(id), product);
      return queryClient.invalidateQueries({ queryKey: queryKeys.products.all, refetchType: "none" });
    },
  });
}

export function useDeleteProduct(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => productService.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.removeQueries({ queryKey: queryKeys.ratings.all(id) });
      return queryClient.invalidateQueries({ queryKey: queryKeys.products.all, refetchType: "none" });
    },
  });
}

/** Image changes are applied immediately; each one patches the cached product so the UI updates without a refetch. */
export function useProductImages(productId: number) {
  const queryClient = useQueryClient();
  const key = queryKeys.products.detail(productId);
  const patch = (fn: (p: Product) => Product) => {
    queryClient.setQueryData<Product>(key, (p) => (p ? fn(p) : p));
    // List cards show the first image.
    return queryClient.invalidateQueries({ queryKey: ["products", "list"], refetchType: "none" });
  };

  const add = useMutation({
    mutationFn: (files: File[]) => productImageService.add(productId, files),
    onSuccess: (images) => patch((p) => ({ ...p, images: [...p.images, ...images] })),
  });
  const replace = useMutation({
    mutationFn: ({ imageId, file }: { imageId: number; file: File }) => productImageService.replace(productId, imageId, file),
    onSuccess: (image, { imageId }) => patch((p) => ({ ...p, images: p.images.map((i) => (i.id === imageId ? image : i)) })),
  });
  const remove = useMutation({
    mutationFn: (imageId: number) => productImageService.remove(productId, imageId),
    onSuccess: (_, imageId) => patch((p) => ({ ...p, images: p.images.filter((i) => i.id !== imageId) })),
  });

  return { add, replace, remove };
}
