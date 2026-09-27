"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { ProductFilters as Filters } from "@/lib/products/filters";
import type { Category } from "@/types/product";

interface ProductFiltersProps {
  filters: Filters;
  categories: Category[];
  isLoadingCategories?: boolean;
  onChange: (patch: Partial<Filters>) => void;
}

function PriceRange({ minPrice, maxPrice, onApply }: { minPrice: number | null; maxPrice: number | null; onApply: (min: number | null, max: number | null) => void }) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const parse = (v: FormDataEntryValue | null) => (v === null || String(v).trim() === "" ? null : Number(v));
    const min = parse(data.get("min"));
    const max = parse(data.get("max"));

    if ((min !== null && (Number.isNaN(min) || min < 0)) || (max !== null && (Number.isNaN(max) || max < 0))) {
      return setError("Prices must be 0 or more.");
    }
    if (min !== null && max !== null && min > max) return setError("Min price can't be more than max price.");
    setError(null);
    onApply(min, max);
  };

  const input =
    "w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200";

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Price range">
      <div className="flex items-center gap-2">
        <input name="min" type="number" inputMode="decimal" min={0} placeholder="Min" aria-label="Minimum price" defaultValue={minPrice ?? ""} className={input} />
        <span className="text-gray-500">–</span>
        <input name="max" type="number" inputMode="decimal" min={0} placeholder="Max" aria-label="Maximum price" defaultValue={maxPrice ?? ""} className={input} />
        <Button type="submit" size="sm" aria-label="Apply price range" className="shrink-0 px-2.5">
          ▶
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

export function ProductFilters({ filters, categories, isLoadingCategories, onChange }: ProductFiltersProps) {
  const categoryButton = (active: boolean) =>
    `block w-full rounded px-2 py-1.5 text-left text-sm transition ${
      active ? "bg-brand-50 font-medium text-brand-600" : "text-gray-700 hover:bg-gray-50 hover:text-brand-500"
    }`;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Category</h3>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onChange({ categoryId: null })}
              aria-pressed={filters.categoryId === null}
              className={categoryButton(filters.categoryId === null)}
            >
              All categories
            </button>
          </li>
          {isLoadingCategories
            ? Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="mx-2 my-2 h-4 animate-pulse rounded bg-gray-200" aria-hidden />
              ))
            : categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onChange({ categoryId: c.id })}
                    aria-pressed={filters.categoryId === c.id}
                    className={categoryButton(filters.categoryId === c.id)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Price</h3>
        {/* key resets the inputs when the URL changes (e.g. "Clear all" or back button) */}
        <PriceRange
          key={`${filters.minPrice}-${filters.maxPrice}`}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      </section>
    </div>
  );
}
