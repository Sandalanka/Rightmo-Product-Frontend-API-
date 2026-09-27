import Link from "next/link";
import { StarRating } from "@/components/ui/StarRating";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/types/product";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product, eager = false }: { product: ProductSummary; eager?: boolean }) {
  return (
    <Link
      href={`/dashboard/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 sm:aspect-square">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          eager={eager}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 text-gray-800 group-hover:text-brand-600">
          {product.name}
        </h3>
        <p className="text-lg font-semibold text-brand-600">{formatPrice(product.price)}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <StarRating value={product.average_rating} />
          {product.category_name && (
            <span className="truncate rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{product.category_name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-gray-100" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-gray-200 sm:aspect-square" />
      <div className="space-y-2 p-3">
        <div className="h-4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

/** 1 card per row on phones, then 2 / 3 / 4 as the screen widens. */
export const PRODUCT_GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={PRODUCT_GRID} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
