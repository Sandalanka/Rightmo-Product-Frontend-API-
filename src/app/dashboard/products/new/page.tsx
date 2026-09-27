import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductForm } from "@/components/products/ProductForm";
import { createQueryClient, queryKeys } from "@/lib/query-client";
import { getServerApi } from "@/lib/server/api";
import { prefetch } from "@/lib/server/prefetch";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const api = await getServerApi();
  const queryClient = createQueryClient();
  await prefetch(queryClient, queryKeys.categories, () => api.categories.list());

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-gray-600">
        <Link href="/dashboard" className="hover:text-brand-500">
          Products
        </Link>{" "}
        › <span className="text-gray-800">Add product</span>
      </nav>
      <PageHeader title="Add product" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductForm />
      </HydrationBoundary>
    </div>
  );
}
