import type MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { DEFAULT_FILTERS } from "@/lib/products/filters";
import { categoryService, productService } from "@/services/product.service";
import { ratingService } from "@/services/rating.service";
import { categories, pagination, product, productSummary, rating, success } from "./fixtures";
import { mockApi } from "./utils/render";

describe("product services", () => {
  let api: MockAdapter;
  beforeEach(() => (api = mockApi()));
  afterEach(() => api.restore());

  it("productService.list sends filters as query params", async () => {
    api.onGet("/products").reply((config) => {
      expect(config.params).toMatchObject({ search: "head", category_id: 1, sort_by: "price", sort_order: "asc", page: 2 });
      return [200, success({ products: [productSummary()], pagination: pagination(2, 3, 30) })];
    });

    const page = await productService.list({ ...DEFAULT_FILTERS, search: "head", categoryId: 1, sort: "price_asc", page: 2 });

    expect(page.products).toHaveLength(1);
    expect(page.pagination.total).toBe(30);
  });

  it("productService.get returns the product and maps 404 to ApiError", async () => {
    api.onGet("/products/26").reply(200, success(product));
    api.onGet("/products/9").reply(404, { status: "error", message: "Product not found." });

    await expect(productService.get(26)).resolves.toEqual(product);
    await expect(productService.get(9)).rejects.toMatchObject({ status: 404, message: "Product not found." });
  });

  it("categoryService.list unwraps categories", async () => {
    api.onGet("/categories").reply(200, success({ categories }));
    await expect(categoryService.list()).resolves.toEqual(categories);
  });

  it("ratingService.list sends paging params", async () => {
    api.onGet("/products/26/ratings").reply((config) => {
      expect(config.params).toEqual({ page: 2, per_page: 5 });
      return [200, success({ ratings: [rating()], pagination: pagination(2, 2, 6) })];
    });
    const page = await ratingService.list(26, 2);
    expect(page.ratings[0].comment).toBe("Great sound");
  });

  it("ratingService.create posts rating and trimmed comment (empty -> null)", async () => {
    api.onPost("/products/26/ratings").reply((config) => {
      const body = JSON.parse(config.data);
      return [201, success(rating({ rating: body.rating, comment: body.comment }))];
    });

    expect((await ratingService.create(26, { rating: 5, comment: "  Nice  " })).comment).toBe("Nice");
    expect((await ratingService.create(26, { rating: 5, comment: "   " })).comment).toBeNull();
    expect(api.history.post).toHaveLength(2);
  });

  it("ratingService.update sends PUT to the specific rating", async () => {
    api.onPut("/products/26/ratings/7").reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ rating: 3, comment: null });
      return [200, success(rating({ id: 7, rating: 3, comment: null }))];
    });
    expect((await ratingService.update(26, 7, { rating: 3, comment: "" })).rating).toBe(3);
  });

  it("ratingService.remove deletes the specific rating", async () => {
    api.onDelete("/products/26/ratings/7").reply(200, success(undefined, "Deleted"));
    await ratingService.remove(26, 7);
    expect(api.history.delete).toHaveLength(1);
  });

  it("surfaces 403 when changing someone else's rating", async () => {
    api.onPut("/products/26/ratings/8").reply(403, { status: "error", message: "You can only change your own ratings." });
    api.onDelete("/products/26/ratings/8").reply(403, { status: "error", message: "You can only change your own ratings." });

    await expect(ratingService.update(26, 8, { rating: 1 })).rejects.toMatchObject({ status: 403 });
    await expect(ratingService.remove(26, 8)).rejects.toBeInstanceOf(ApiError);
  });
});
