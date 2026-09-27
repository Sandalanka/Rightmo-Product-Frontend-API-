import type MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { productImageService, productService } from "@/services/product.service";
import { formDataToObject, imageFile, product, success } from "./fixtures";
import { mockApi } from "./utils/render";

describe("product create/update/delete services", () => {
  let api: MockAdapter;
  beforeEach(() => (api = mockApi()));
  afterEach(() => api.restore());

  it("create sends a multipart request with fields and images[]", async () => {
    api.onPost("/products").reply((config) => {
      expect(config.data).toBeInstanceOf(FormData);
      expect(formDataToObject(config.data)).toEqual({
        name: "Lamp",
        category_id: "4",
        price: "10.50",
        description: "Bright",
        "images[]": ["a.png", "b.png"],
      });
      return [201, success(product)];
    });

    const created = await productService.create(
      { name: "Lamp", category_id: 4, price: "10.50", description: "Bright" },
      [imageFile("a.png"), imageFile("b.png")],
    );
    expect(created).toEqual(product);
  });

  it("create leaves out an empty description", async () => {
    api.onPost("/products").reply((config) => {
      expect(formDataToObject(config.data)).not.toHaveProperty("description");
      return [201, success(product)];
    });
    await productService.create({ name: "Lamp", category_id: 4, price: "1", description: null });
  });

  it("update sends JSON with PUT", async () => {
    api.onPut("/products/26").reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ name: "New", price: "5.00" });
      return [200, success({ ...product, name: "New" })];
    });
    expect((await productService.update(26, { name: "New", price: "5.00" })).name).toBe("New");
  });

  it("remove sends DELETE", async () => {
    api.onDelete("/products/26").reply(200, success(undefined, "Deleted"));
    await productService.remove(26);
    expect(api.history.delete[0].url).toBe("/products/26");
  });

  it("images: add, replace (POST + _method=PUT) and remove", async () => {
    api.onPost("/products/26/images").reply((config) => {
      expect(formDataToObject(config.data)).toEqual({ "images[]": "new.png" });
      return [201, success({ images: [{ id: 9, image_url: "u9" }] })];
    });
    api.onPost("/products/26/images/1").reply((config) => {
      expect(formDataToObject(config.data)).toEqual({ _method: "PUT", image: "swap.png" });
      return [200, success({ id: 1, image_url: "u1b" })];
    });
    api.onDelete("/products/26/images/2").reply(200, success(undefined, "Deleted"));

    await expect(productImageService.add(26, [imageFile("new.png")])).resolves.toEqual([{ id: 9, image_url: "u9" }]);
    await expect(productImageService.replace(26, 1, imageFile("swap.png"))).resolves.toEqual({ id: 1, image_url: "u1b" });
    await productImageService.remove(26, 2);
    expect(api.history.delete).toHaveLength(1);
  });
});
