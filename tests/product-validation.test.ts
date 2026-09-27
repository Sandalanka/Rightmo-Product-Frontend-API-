import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, validateImages, validateProduct } from "@/lib/validation/product";
import { imageFile } from "./fixtures";

const valid = { name: "Desk Lamp", category_id: "4", price: "1499.99", description: "" };

describe("validateProduct", () => {
  it("passes valid input", () => {
    expect(validateProduct(valid)).toEqual({});
  });

  it("requires name, category and price", () => {
    expect(validateProduct({ name: " ", category_id: "", price: "", description: "" })).toEqual({
      name: "Name is required.",
      category_id: "Please choose a category.",
      price: "Price is required.",
    });
  });

  it.each(["abc", "-1", "1.999", "1e5", "10."])("rejects price %s", (price) => {
    expect(validateProduct({ ...valid, price }).price).toBe("Enter a valid price with up to 2 decimals.");
  });

  it.each(["0", "10", "10.5", "99999999.99"])("accepts price %s", (price) => {
    expect(validateProduct({ ...valid, price }).price).toBeUndefined();
  });

  it("rejects too-large price and too-long text", () => {
    expect(validateProduct({ ...valid, price: "100000000" }).price).toBe("Price is too large.");
    expect(validateProduct({ ...valid, name: "x".repeat(256) }).name).toMatch(/255/);
    expect(validateProduct({ ...valid, description: "x".repeat(5001) }).description).toMatch(/5000/);
  });
});

describe("validateImages", () => {
  it("accepts jpg/png/webp under 2 MB", () => {
    expect(validateImages([imageFile("a.jpg", "image/jpeg"), imageFile("b.webp", "image/webp")])).toBeNull();
  });

  it("rejects other types, big files and more than 10 in total", () => {
    expect(validateImages([imageFile("a.gif", "image/gif")])).toMatch(/JPG, PNG or WEBP/);
    expect(validateImages([imageFile("big.png", "image/png", MAX_IMAGE_BYTES + 1)])).toMatch(/2 MB/);
    expect(validateImages([imageFile(), imageFile()], 9)).toMatch(/at most 10/);
  });
});
