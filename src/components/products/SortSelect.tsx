import { SORT_OPTIONS, type SortValue } from "@/lib/products/filters";

export function SortSelect({ value, onChange }: { value: SortValue; onChange: (value: SortValue) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <span className="hidden sm:inline">Sort by:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        aria-label="Sort products"
        className="rounded border border-gray-300 bg-white py-1.5 pr-8 pl-2 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
