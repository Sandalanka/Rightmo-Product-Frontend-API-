import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductForm } from "@/components/products/ProductForm";
import { categories, formDataToObject, imageFile, product, success, user } from "./fixtures";
import { nav, resetNav } from "./utils/navigation";
import { mockApi, renderWithProviders } from "./utils/render";
import { expectToast } from "./utils/toast";

vi.mock("next/navigation", () => import("./utils/navigation"));

describe("ProductForm", () => {
  let api: MockAdapter;

  beforeEach(() => {
    resetNav("/dashboard/products/new");
    api = mockApi();
    api.onGet("/categories").reply(200, success({ categories }));
  });
  afterEach(() => api.restore());

  async function fillCreateForm() {
    await userEvent.type(screen.getByLabelText("Product name"), "Desk Lamp");
    await userEvent.selectOptions(await screen.findByLabelText("Category"), "Electronics");
    await userEvent.type(screen.getByLabelText("Price (Rs.)"), "1499.99");
    await userEvent.type(screen.getByLabelText("Description"), "Warm light");
  }

  describe("create", () => {
    it("shows validation errors without calling the API", async () => {
      renderWithProviders(<ProductForm />, { user });
      await userEvent.type(screen.getByLabelText("Price (Rs.)"), "12.345");
      await userEvent.click(screen.getByRole("button", { name: "Add product" }));

      expect(screen.getByText("Name is required.")).toBeInTheDocument();
      expect(screen.getByText("Please choose a category.")).toBeInTheDocument();
      expect(screen.getByText("Enter a valid price with up to 2 decimals.")).toBeInTheDocument();
      expect(api.history.post).toHaveLength(0);
    });

    it("uploads images with the product and opens the new product", async () => {
      api.onPost("/products").reply((config) => {
        expect(formDataToObject(config.data)).toEqual({
          name: "Desk Lamp",
          category_id: "1",
          price: "1499.99",
          description: "Warm light",
          "images[]": ["lamp.png", "lamp2.jpg"],
        });
        return [201, success({ ...product, id: 77 })];
      });
      renderWithProviders(<ProductForm />, { user });

      await fillCreateForm();
      await userEvent.upload(screen.getByLabelText("Add images"), [imageFile("lamp.png"), imageFile("lamp2.jpg", "image/jpeg")]);
      const selected = screen.getByRole("list", { name: "Selected images" });
      expect(within(selected).getAllByRole("img")).toHaveLength(2);

      await userEvent.click(screen.getByRole("button", { name: "Add product" }));
      await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard/products/77"));
      await expectToast("Product added successfully.");
    });

    it("lets you remove a selected image before saving", async () => {
      renderWithProviders(<ProductForm />, { user });
      await userEvent.upload(screen.getByLabelText("Add images"), [imageFile("a.png"), imageFile("b.png")]);
      await userEvent.click(screen.getByRole("button", { name: "Remove a.png" }));

      expect(screen.queryByRole("img", { name: "a.png" })).not.toBeInTheDocument();
      expect(screen.getByRole("img", { name: "b.png" })).toBeInTheDocument();
    });

    it("rejects images that are too big", async () => {
      renderWithProviders(<ProductForm />, { user });
      await userEvent.upload(screen.getByLabelText("Add images"), imageFile("huge.png", "image/png", 3 * 1024 * 1024));

      expect(screen.getByRole("alert")).toHaveTextContent('"huge.png" is larger than 2 MB.');
      expect(screen.queryByRole("img", { name: "huge.png" })).not.toBeInTheDocument();
    });

    it("shows server errors under the matching field", async () => {
      api.onPost("/products").reply(422, {
        status: "failed",
        message: "Validation errors",
        errors: { name: ["The name has already been taken."] },
      });
      renderWithProviders(<ProductForm />, { user });

      await fillCreateForm();
      await userEvent.click(screen.getByRole("button", { name: "Add product" }));

      expect(await screen.findByText("The name has already been taken.")).toBeInTheDocument();
      expect(screen.getByLabelText("Product name")).toHaveAttribute("aria-invalid", "true");
      expect(nav.push).not.toHaveBeenCalled();
    });
  });

  describe("edit", () => {
    beforeEach(() => resetNav("/dashboard/products/26/edit"));

    it("is prefilled and saves with PUT", async () => {
      api.onPut("/products/26").reply((config) => {
        expect(JSON.parse(config.data)).toEqual({
          name: "Wireless Headphones v2",
          category_id: 1,
          price: "1999.50",
          description: "Noise cancelling over-ear headphones.",
        });
        return [200, success({ ...product, name: "Wireless Headphones v2" })];
      });
      renderWithProviders(<ProductForm product={product} />, { user });

      expect(screen.getByLabelText("Product name")).toHaveValue("Wireless Headphones");
      expect(await screen.findByRole("option", { name: "Electronics" })).toHaveProperty("selected", true);
      expect(screen.getByLabelText("Price (Rs.)")).toHaveValue("1999.50");

      await userEvent.type(screen.getByLabelText("Product name"), " v2");
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

      await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard/products/26"));
      await expectToast("Product updated successfully.");
      expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/dashboard/products/26");
    });

    it("removes, replaces and adds images immediately", async () => {
      api.onDelete("/products/26/images/1").reply(200, success(undefined, "Deleted"));
      api.onPost("/products/26/images/2").reply(200, success({ id: 2, image_url: "http://localhost:8089/storage/products/swap.jpg" }));
      api.onPost("/products/26/images").reply(201, success({ images: [{ id: 3, image_url: "http://localhost:8089/storage/products/c.jpg" }] }));
      const { queryClient } = renderWithProviders(<ProductForm product={product} />, { user });
      queryClient.setQueryData(["products", "detail", 26], product);

      const current = screen.getByRole("list", { name: "Current images" });
      expect(within(current).getAllByRole("listitem")).toHaveLength(2);

      await userEvent.click(screen.getByRole("button", { name: "Remove image 1" }));
      await waitFor(() => expect(api.history.delete).toHaveLength(1));
      await expectToast("Image removed.");
      expect(queryClient.getQueryData<typeof product>(["products", "detail", 26])?.images.map((i) => i.id)).toEqual([2]);

      // A replacement file with no image chosen via "Replace" is ignored.
      await userEvent.upload(screen.getByLabelText("Replacement image"), imageFile("swap.png"));
      expect(api.history.post.filter((r) => r.url === "/products/26/images/2")).toHaveLength(0);

      await userEvent.upload(screen.getByLabelText("Add images"), imageFile("c.png"));
      await userEvent.click(screen.getByRole("button", { name: "Upload 1 image" }));
      await waitFor(() =>
        expect(queryClient.getQueryData<typeof product>(["products", "detail", 26])?.images.map((i) => i.id)).toEqual([2, 3]),
      );
      expect(screen.queryByRole("button", { name: /Upload/ })).not.toBeInTheDocument();
      await expectToast("1 image uploaded.");
    });

    it("shows a spinner on an image while it is being removed", async () => {
      let finish!: () => void;
      api.onDelete("/products/26/images/1").reply(() => new Promise((resolve) => (finish = () => resolve([200, success(undefined, "Deleted")]))));
      const { queryClient } = renderWithProviders(<ProductForm product={product} />, { user });
      queryClient.setQueryData(["products", "detail", 26], product);

      await userEvent.click(screen.getByRole("button", { name: "Remove image 1" }));

      expect(await screen.findByRole("status", { name: "Updating image 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Replace image 2" })).toBeDisabled();
      finish();
      await waitFor(() => expect(screen.queryByRole("status", { name: "Updating image 1" })).not.toBeInTheDocument());
    });

    it("replaces an image after choosing Replace", async () => {
      api.onPost("/products/26/images/1").reply((config) => {
        expect(formDataToObject(config.data)).toEqual({ _method: "PUT", image: "swap.png" });
        return [200, success({ id: 1, image_url: "http://localhost:8089/storage/products/swap.jpg" })];
      });
      const { queryClient } = renderWithProviders(<ProductForm product={product} />, { user });
      queryClient.setQueryData(["products", "detail", 26], product);

      const input = screen.getByLabelText("Replacement image") as HTMLInputElement;
      const click = vi.spyOn(input, "click").mockImplementation(() => {});
      await userEvent.click(screen.getByRole("button", { name: "Replace image 1" }));
      expect(click).toHaveBeenCalled();
      await userEvent.upload(input, imageFile("swap.png"));

      await waitFor(() =>
        expect(queryClient.getQueryData<typeof product>(["products", "detail", 26])?.images[0].image_url).toContain("swap.jpg"),
      );
      await expectToast("Image replaced.");
    });
  });
});
