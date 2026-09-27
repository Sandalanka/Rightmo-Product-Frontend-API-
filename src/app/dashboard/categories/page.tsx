import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CategoryGrid } from "@/components/products/CategoryGrid";
import { createQueryClient, queryKeys } from "@/lib/query-client";
import { getServerApi } from "@/lib/server/api";
import { prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const api = await getServerApi();
  const queryClient = createQueryClient();
  await prefetch(queryClient, queryKeys.categories, () => api.categories.list());

  return (
    <>
      <PageHeader title="Categories" description="Browse products by category." />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CategoryGrid />
      </HydrationBoundary>
    </>
  );
}
