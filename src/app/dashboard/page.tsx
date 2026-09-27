import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/products/ProductCard";
import { ProductListing } from "@/components/products/ProductListing";
import { parseFilters } from "@/lib/products/filters";
import { createQueryClient, queryKeys } from "@/lib/query-client";
import { getServerApi } from "@/lib/server/api";
import { prefetch, toURLSearchParams } from "@/lib/server/prefetch";

export const metadata: Metadata = { title: "Products" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  // Same parsing as the client, so the server-filled cache entry matches the key useProducts() asks for.
  const filters = parseFilters(toURLSearchParams(await searchParams));
  const api = await getServerApi();
  const queryClient = createQueryClient();

  await Promise.all([
    prefetch(queryClient, queryKeys.products.list(filters), () => api.products.list(filters)),
    prefetch(queryClient, queryKeys.categories, () => api.categories.list()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* ProductListing reads the URL with useSearchParams */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductListing />
      </Suspense>
    </HydrationBoundary>
  );
}
