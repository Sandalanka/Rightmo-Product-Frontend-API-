/**
 * Product listing state lives in the URL (?search=&category=&min=&max=&sort=&page=),
 * so results are shareable and the back button works. These helpers convert between
 * the URL, a typed filters object and the backend's ProductIndexRequest params.
 */
export const PER_PAGE = 12;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest", sort_by: "created_at", sort_order: "desc" },
  { value: "price_asc", label: "Price: Low to High", sort_by: "price", sort_order: "asc" },
  { value: "price_desc", label: "Price: High to Low", sort_by: "price", sort_order: "desc" },
  { value: "rating_desc", label: "Top Rated", sort_by: "rating", sort_order: "desc" },
  { value: "name_asc", label: "Name: A to Z", sort_by: "name", sort_order: "asc" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
export const DEFAULT_SORT: SortValue = "newest";

export interface ProductFilters {
  search: string;
  categoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortValue;
  page: number;
}

export const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  categoryId: null,
  minPrice: null,
  maxPrice: null,
  sort: DEFAULT_SORT,
  page: 1,
};

type ParamsLike = Pick<URLSearchParams, "get">;

function toNumber(value: string | null, { integer = false, min = 0 } = {}): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || (integer && !Number.isInteger(n))) return null;
  return n;
}

export function parseFilters(params: ParamsLike): ProductFilters {
  const sort = params.get("sort");
  return {
    search: params.get("search")?.trim() ?? "",
    categoryId: toNumber(params.get("category"), { integer: true, min: 1 }),
    minPrice: toNumber(params.get("min")),
    maxPrice: toNumber(params.get("max")),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortValue) : DEFAULT_SORT,
    page: toNumber(params.get("page"), { integer: true, min: 1 }) ?? 1,
  };
}

/** Filters -> "?search=phone&sort=price_asc" (defaults are left out to keep URLs short). */
export function toSearchString(filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId !== null) params.set("category", String(filters.categoryId));
  if (filters.minPrice !== null) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("max", String(filters.maxPrice));
  if (filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Filters -> query params for GET /products */
export function toApiParams(filters: ProductFilters): Record<string, string | number> {
  const sort = SORT_OPTIONS.find((o) => o.value === filters.sort) ?? SORT_OPTIONS[0];
  const params: Record<string, string | number> = {
    sort_by: sort.sort_by,
    sort_order: sort.sort_order,
    per_page: PER_PAGE,
    page: filters.page,
  };
  if (filters.search) params.search = filters.search;
  if (filters.categoryId !== null) params.category_id = filters.categoryId;
  if (filters.minPrice !== null) params.min_price = filters.minPrice;
  if (filters.maxPrice !== null) params.max_price = filters.maxPrice;
  return params;
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return Boolean(filters.search) || filters.categoryId !== null || filters.minPrice !== null || filters.maxPrice !== null;
}

/**
 * Page numbers to render, with "…" gaps: getPageItems(5, 10) -> [1, "…", 4, 5, 6, "…", 10]
 */
export function getPageItems(current: number, last: number, siblings = 1): (number | "ellipsis")[] {
  if (last <= 1) return [1];
  const start = Math.max(2, current - siblings);
  const end = Math.min(last - 1, current + siblings);
  const items: (number | "ellipsis")[] = [1];
  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < last - 1) items.push("ellipsis");
  items.push(last);
  return items;
}
