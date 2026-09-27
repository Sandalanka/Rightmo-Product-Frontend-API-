"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { useProduct } from "@/hooks/useProducts";
import { ProductForm } from "./ProductForm";

export function ProductEditor({ productId }: { productId: number }) {
  const { data: product, isPending, isError, error } = useProduct(productId);

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-gray-600">
        <Link href="/dashboard" className="hover:text-brand-500">
          Products
        </Link>{" "}
        ›{" "}
        <Link href={`/dashboard/products/${productId}`} className="hover:text-brand-500">
          {product?.name ?? "Product"}
        </Link>{" "}
        › <span className="text-gray-800">Edit</span>
      </nav>
      <PageHeader title="Edit product" />
      {isPending ? (
        <div className="h-96 animate-pulse rounded-md bg-white" role="status" aria-label="Loading product" />
      ) : isError ? (
        <Alert message={error.message} />
      ) : (
        // key: start the form fresh if a different product is loaded
        <ProductForm key={product.id} product={product} />
      )}
    </div>
  );
}
