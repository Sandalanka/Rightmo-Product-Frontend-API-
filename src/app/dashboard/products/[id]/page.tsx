import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { ProductDetail } from "@/components/products/ProductDetail";
import { createQueryClient, queryKeys } from "@/lib/query-client";
import { getServerApi } from "@/lib/server/api";
import { parseIdParam, prefetch } from "@/lib/server/prefetch";
import { getProductOnServer } from "@/lib/server/product";

export async function generateMetadata({ params }: PageProps<"/dashboard/products/[id]">): Promise<Metadata> {
  const id = Number((await params).id);
  try {
    const product = await getProductOnServer(id);
    return {
      title: product.name,
      description: product.description?.slice(0, 160) || `${product.name} – ${product.category?.name ?? "Product"}`,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: PageProps<"/dashboard/products/[id]">) {
  const productId = parseIdParam((await params).id);
  const api = await getServerApi();
  const queryClient = createQueryClient();

  await Promise.all([
    prefetch(queryClient, queryKeys.products.detail(productId), () => getProductOnServer(productId), { notFoundOn404: true }),
    prefetch(queryClient, queryKeys.ratings.list(productId, 1), () => api.ratings.list(productId, 1)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetail productId={productId} />
    </HydrationBoundary>
  );
}
