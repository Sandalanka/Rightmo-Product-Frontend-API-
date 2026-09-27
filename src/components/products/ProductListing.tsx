"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/CloseButton";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { DEFAULT_FILTERS, hasActiveFilters, parseFilters, toSearchString, type ProductFilters as Filters } from "@/lib/products/filters";
import { ActiveFilters } from "./ActiveFilters";
import { PRODUCT_GRID, ProductCard, ProductGridSkeleton } from "./ProductCard";
import { ProductFilters } from "./ProductFilters";
import { SortSelect } from "./SortSelect";

const FILTER_DRAWER_ID = "product-filters";

export function ProductListing() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const closeFilters = useCallback(() => setIsFilterOpen(false), []);

  const { data, isPending, isFetching, isPlaceholderData, isError, error, refetch } = useProducts(filters);
  const categories = useCategories();

  /** Any filter change goes back to page 1; only pagination scrolls to the top. */
  const update = useCallback(
    (patch: Partial<Filters>, { scroll = false } = {}) => {
      const next = { ...filters, page: 1, ...patch };
      router.push(`${pathname}${toSearchString(next)}`, { scroll });
    },
    [filters, pathname, router],
  );
  const clearAll = () => update({ ...DEFAULT_FILTERS, sort: filters.sort });
  const applyFromDrawer = (patch: Partial<Filters>) => {
    update(patch);
    closeFilters();
  };

  const total = data?.pagination.total ?? 0;
  const categoryList = categories.data ?? [];

  return (
    <>
    {/* Mobile filter drawer */}
    <Drawer id={FILTER_DRAWER_ID} label="Filters" side="right" isOpen={isFilterOpen} onClose={closeFilters} className="md:hidden">
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        <CloseButton onClick={closeFilters} label="Close filters" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <ProductFilters filters={filters} categories={categoryList} isLoadingCategories={categories.isPending} onChange={applyFromDrawer} />
      </div>
    </Drawer>

    <div className="flex gap-6">
      {/* Desktop filter column */}
      <aside className="hidden w-56 shrink-0 md:block" aria-label="Filters">
        <div className="sticky top-24 rounded-md bg-white p-4 shadow-sm">
          <ProductFilters filters={filters} categories={categoryList} isLoadingCategories={categories.isPending} onChange={(patch) => update(patch)} />
        </div>
      </aside>


      <section className="min-w-0 flex-1 space-y-4" aria-label="Products">
        <div className="flex flex-col gap-3 rounded-md bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="text-sm whitespace-nowrap text-gray-600" aria-live="polite">
              {isPending || isPlaceholderData ? (
                "Searching…"
              ) : (
                <>
                  <span className="font-semibold text-gray-900">{total}</span> {total === 1 ? "item" : "items"} found
                  {filters.search && (
                    <>
                      {" "}
                      for <span className="font-semibold text-brand-600">&ldquo;{filters.search}&rdquo;</span>
                    </>
                  )}
                </>
              )}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                aria-expanded={isFilterOpen}
                aria-controls={FILTER_DRAWER_ID}
                className="flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-brand-500 hover:text-brand-500 md:hidden"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
                </svg>
                Filters
              </button>
              <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} />
              <Link
                href="/dashboard/products/new"
                aria-label="Add product"
                className="inline-flex items-center gap-1 rounded bg-brand-600 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white hover:bg-brand-700"
              >
                <span aria-hidden className="text-base leading-none">+</span>
                <span className="hidden sm:inline">Add product</span>
              </Link>
            </div>
          </div>
          <ActiveFilters filters={filters} categories={categoryList} onChange={(patch) => update(patch)} onClearAll={clearAll} />
        </div>

        {isError ? (
          <div className="space-y-3 rounded-md bg-white p-6">
            <Alert message={error.message} />
            <Button variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : isPending ? (
          <ProductGridSkeleton />
        ) : data.products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={hasActiveFilters(filters) ? "Try a different search or remove some filters." : "There are no products yet."}
            action={hasActiveFilters(filters) && <Button onClick={clearAll}>Clear all filters</Button>}
          />
        ) : (
          <>
            <div className={`${PRODUCT_GRID} transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-busy={isFetching}>
              {data.products.map((product, i) => (
                <ProductCard key={product.id} product={product} eager={i < 4} />
              ))}
            </div>
            <Pagination page={data.pagination.current_page} lastPage={data.pagination.last_page} onPageChange={(page) => update({ page }, { scroll: true })} />
          </>
        )}
      </section>
    </div>
    </>
  );
}
