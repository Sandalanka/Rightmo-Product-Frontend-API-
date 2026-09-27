import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { ProductEditor } from "@/components/products/ProductEditor";
import { createQueryClient, queryKeys } from "@/lib/query-client";
import { getServerApi } from "@/lib/server/api";
import { parseIdParam, prefetch } from "@/lib/server/prefetch";
import { getProductOnServer } from "@/lib/server/product";

export async function generateMetadata({ params }: PageProps<"/dashboard/products/[id]/edit">): Promise<Metadata> {
  try {
    return { title: `Edit ${(await getProductOnServer(Number((await params).id))).name}` };
  } catch {
    return { title: "Edit product" };
  }
}

export default async function EditProductPage({ params }: PageProps<"/dashboard/products/[id]/edit">) {
  const productId = parseIdParam((await params).id);
  const api = await getServerApi();
  const queryClient = createQueryClient();

  await Promise.all([
    prefetch(queryClient, queryKeys.products.detail(productId), () => getProductOnServer(productId), { notFoundOn404: true }),
    prefetch(queryClient, queryKeys.categories, () => api.categories.list()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductEditor productId={productId} />
    </HydrationBoundary>
  );
}
