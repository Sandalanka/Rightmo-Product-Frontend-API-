import { formatPrice } from "@/lib/format";
import { hasActiveFilters, type ProductFilters } from "@/lib/products/filters";
import type { Category } from "@/types/product";

interface ActiveFiltersProps {
  filters: ProductFilters;
  categories: Category[];
  onChange: (patch: Partial<ProductFilters>) => void;
  onClearAll: () => void;
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-0.5 pr-1 pl-3 text-xs text-brand-700">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove filter ${label}`} className="rounded-full px-1.5 text-sm leading-none hover:bg-brand-100">
        ×
      </button>
    </span>
  );
}

export function ActiveFilters({ filters, categories, onChange, onClearAll }: ActiveFiltersProps) {
  if (!hasActiveFilters(filters)) return null;

  const category = categories.find((c) => c.id === filters.categoryId);
  const { minPrice, maxPrice } = filters;
  const priceLabel =
    minPrice !== null && maxPrice !== null
      ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
      : minPrice !== null
        ? `From ${formatPrice(minPrice)}`
        : maxPrice !== null
          ? `Up to ${formatPrice(maxPrice)}`
          : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => onChange({ search: "" })} />}
      {filters.categoryId !== null && <Chip label={category?.name ?? "Category"} onRemove={() => onChange({ categoryId: null })} />}
      {priceLabel && <Chip label={priceLabel} onRemove={() => onChange({ minPrice: null, maxPrice: null })} />}
      <button type="button" onClick={onClearAll} className="text-xs font-medium text-brand-600 hover:underline">
        Clear all
      </button>
    </div>
  );
}
