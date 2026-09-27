"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WriteReview } from "@/components/ratings/WriteReview";
import { RatingList } from "@/components/ratings/RatingList";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StarRating } from "@/components/ui/StarRating";
import { useToast } from "@/components/ui/Toast";
import { useDeleteProduct, useProduct } from "@/hooks/useProducts";
import { ApiError, toApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ProductGallery } from "./ProductGallery";

function Breadcrumb({ category, name }: { category?: { id: number; name: string }; name?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/dashboard" className="hover:text-brand-500">
            Products
          </Link>
        </li>
        {category && (
          <>
            <li aria-hidden>›</li>
            <li>
              <Link href={`/dashboard?category=${category.id}`} className="hover:text-brand-500">
                {category.name}
              </Link>
            </li>
          </>
        )}
        {name && (
          <>
            <li aria-hidden>›</li>
            <li aria-current="page" className="max-w-[16rem] truncate text-gray-800">
              {name}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 rounded-md bg-white p-4 shadow-sm md:grid-cols-2 md:p-6" role="status" aria-label="Loading product">
      <div className="aspect-square animate-pulse rounded-md bg-gray-200" />
      <div className="space-y-4">
        <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="h-9 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-24 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

function ProductActions({ productId, name }: { productId: number; name: string }) {
  const router = useRouter();
  const remove = useDeleteProduct(productId);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();
  const [isNavigating, startTransition] = useTransition();

  const handleDelete = async () => {
    try {
      await remove.mutateAsync();
      toast.success(`"${name}" was deleted.`);
      startTransition(() => router.push("/dashboard"));
    } catch {
      // shown in the dialog
    }
  };

  return (
    <div className="mt-6 flex gap-2">
      <Link
        href={`/dashboard/products/${productId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Edit product
      </Link>
      <button
        type="button"
        onClick={() => {
          remove.reset();
          setConfirming(true);
        }}
        className="rounded-md px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
      <ConfirmDialog
        open={confirming}
        title="Delete this product?"
        confirmLabel="Delete product"
        isLoading={remove.isPending || isNavigating}
        error={remove.error ? toApiError(remove.error).message : null}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      >
        <strong className="text-gray-900">{name}</strong> and all of its images and reviews will be removed. This can&apos;t be undone.
      </ConfirmDialog>
    </div>
  );
}

export function ProductDetail({ productId }: { productId: number }) {
  const { data: product, isPending, isError, error } = useProduct(productId);

  if (isPending) {
    return (
      <>
        <Breadcrumb />
        <DetailSkeleton />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Breadcrumb />
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            title="Product not found"
            description="It may have been removed or the link is wrong."
            action={
              <Link href="/dashboard" className="font-medium text-brand-600 hover:underline">
                ← Back to products
              </Link>
            }
          />
        ) : (
          <Alert message={error.message} />
        )}
      </>
    );
  }

  return (
    <>
      <Breadcrumb category={product.category} name={product.name} />

      <article className="grid gap-6 rounded-md bg-white p-4 shadow-sm md:grid-cols-2 md:p-6">
        <ProductGallery images={product.images} name={product.name} />

        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">{product.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <StarRating value={product.average_rating} size="md" />
            <a href="#reviews" className="text-brand-600 hover:underline">
              {product.ratings_count} {product.ratings_count === 1 ? "Rating" : "Ratings"}
            </a>
            {product.category && (
              <>
                <span className="text-gray-300" aria-hidden>
                  |
                </span>
                <span className="text-gray-500">
                  Category:{" "}
                  <Link href={`/dashboard?category=${product.category.id}`} className="text-brand-600 hover:underline">
                    {product.category.name}
                  </Link>
                </span>
              </>
            )}
          </div>

          <div className="my-4 border-y border-gray-100 py-4">
            <p className="text-3xl font-semibold text-brand-500">{formatPrice(product.price)}</p>
          </div>

          <h2 className="mb-2 text-sm font-semibold text-gray-900">Description</h2>
          <p className="text-sm leading-6 whitespace-pre-line text-gray-700">{product.description || "No description provided."}</p>

          <ProductActions productId={product.id} name={product.name} />
        </div>
      </article>

      <section id="reviews" className="mt-4 scroll-mt-24 rounded-md bg-white p-4 shadow-sm md:p-6" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="mb-4 text-lg font-semibold text-gray-900">
          Ratings &amp; Reviews
        </h2>

        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <p className="text-5xl font-semibold text-gray-900">
                {product.average_rating.toFixed(1)}
                <span className="text-xl text-gray-500">/5</span>
              </p>
              <div>
                <StarRating value={product.average_rating} size="lg" />
                <p className="mt-1 text-sm text-gray-500">
                  {product.ratings_count} {product.ratings_count === 1 ? "rating" : "ratings"}
                </p>
              </div>
            </div>
            <WriteReview productId={product.id} />
          </div>

          <RatingList productId={product.id} />
        </div>
      </section>
    </>
  );
}
