import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  getPageItems,
  hasActiveFilters,
  parseFilters,
  PER_PAGE,
  toApiParams,
  toSearchString,
} from "@/lib/products/filters";

const parse = (qs: string) => parseFilters(new URLSearchParams(qs));

describe("parseFilters", () => {
  it("returns defaults for an empty URL", () => {
    expect(parse("")).toEqual(DEFAULT_FILTERS);
  });

  it("reads every filter", () => {
    expect(parse("search=%20phone%20&category=3&min=10&max=99.5&sort=price_desc&page=2")).toEqual({
      search: "phone",
      categoryId: 3,
      minPrice: 10,
      maxPrice: 99.5,
      sort: "price_desc",
      page: 2,
    });
  });

  it.each([
    ["category=abc", "categoryId", null],
    ["category=1.5", "categoryId", null],
    ["category=0", "categoryId", null],
    ["min=-5", "minPrice", null],
    ["max=abc", "maxPrice", null],
    ["sort=hacker", "sort", "newest"],
    ["page=0", "page", 1],
    ["page=2.5", "page", 1],
  ] as const)("ignores invalid %s", (qs, key, expected) => {
    expect(parse(qs)[key]).toBe(expected);
  });
});

describe("toSearchString", () => {
  it("omits defaults", () => {
    expect(toSearchString(DEFAULT_FILTERS)).toBe("");
  });

  it("round-trips through parseFilters", () => {
    const filters = { search: "red shoe", categoryId: 2, minPrice: 0, maxPrice: 50, sort: "rating_desc" as const, page: 3 };
    const qs = toSearchString(filters);
    expect(qs).toBe("?search=red+shoe&category=2&min=0&max=50&sort=rating_desc&page=3");
    expect(parse(qs.slice(1))).toEqual(filters);
  });
});

describe("toApiParams", () => {
  it("maps to backend ProductIndexRequest params", () => {
    expect(toApiParams({ search: "tv", categoryId: 1, minPrice: 5, maxPrice: 10, sort: "price_asc", page: 2 })).toEqual({
      search: "tv",
      category_id: 1,
      min_price: 5,
      max_price: 10,
      sort_by: "price",
      sort_order: "asc",
      per_page: PER_PAGE,
      page: 2,
    });
  });

  it("sends only sort and paging when no filters are set", () => {
    expect(toApiParams(DEFAULT_FILTERS)).toEqual({ sort_by: "created_at", sort_order: "desc", per_page: PER_PAGE, page: 1 });
  });
});

describe("hasActiveFilters", () => {
  it("ignores sort and page", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: "price_asc", page: 4 })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, minPrice: 0 })).toBe(true);
  });
});

describe("getPageItems", () => {
  it.each([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [1, 10, [1, 2, "ellipsis", 10]],
    [5, 10, [1, "ellipsis", 4, 5, 6, "ellipsis", 10]],
    [10, 10, [1, "ellipsis", 9, 10]],
    [3, 5, [1, 2, 3, 4, 5]],
  ])("page %i of %i", (current, last, expected) => {
    expect(getPageItems(current, last)).toEqual(expected);
  });
});
