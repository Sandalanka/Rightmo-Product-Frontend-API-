import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductDetail } from "@/components/products/ProductDetail";
import { pagination, product, rating, success, user } from "./fixtures";
import { nav, resetNav } from "./utils/navigation";
import { mockApi, renderWithProviders } from "./utils/render";
import { expectToast } from "./utils/toast";

vi.mock("next/navigation", () => import("./utils/navigation"));

describe("ProductDetail", () => {
  let api: MockAdapter;

  beforeEach(() => {
    resetNav("/dashboard/products/26");
    api = mockApi();
  });
  afterEach(() => api.restore());

  const replyRatings = (ratings = [rating()], meta = pagination(1, 1, ratings.length)) =>
    api.onGet("/products/26/ratings").reply(200, success({ ratings, pagination: meta }));

  it("shows every product detail", async () => {
    api.onGet("/products/26").reply(200, success(product));
    replyRatings();
    renderWithProviders(<ProductDetail productId={26} />, { user });

    expect(await screen.findByRole("heading", { level: 1, name: "Wireless Headphones" })).toBeInTheDocument();
    expect(screen.getByText("Rs. 1,999.50")).toBeInTheDocument();
    expect(screen.getByText("Noise cancelling over-ear headphones.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "3 Ratings" })).toHaveAttribute("href", "#reviews");
    expect(screen.getAllByRole("img", { name: "Rated 4.3 out of 5" }).length).toBeGreaterThan(0);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumb).getByRole("link", { name: "Electronics" })).toHaveAttribute("href", "/dashboard?category=1");
  });

  it("switches the main image from thumbnails", async () => {
    api.onGet("/products/26").reply(200, success(product));
    replyRatings();
    renderWithProviders(<ProductDetail productId={26} />, { user });

    const second = await screen.findByRole("button", { name: "Show image 2" });
    await userEvent.click(second);
    expect(second).toHaveAttribute("aria-current", "true");
    // Served through the Next image optimizer: /_next/image?url=<original>&w=...
    const src = screen.getByRole("img", { name: "Wireless Headphones" }).getAttribute("src")!;
    expect(new URL(src, "http://localhost").searchParams.get("url")).toBe(product.images[1].image_url);
  });

  it("lists reviews and marks the user's own", async () => {
    api.onGet("/products/26").reply(200, success(product));
    replyRatings([rating({ id: 1, comment: "Mine!", user: { id: user.id, name: user.name } }), rating()]);
    renderWithProviders(<ProductDetail productId={26} />, { user });

    const reviews = await screen.findByRole("list", { name: "Reviews" });
    expect(within(reviews).getByText("Great sound")).toBeInTheDocument();
    expect(within(reviews).getByText("You")).toBeInTheDocument();
  });

  it("shows a not-found state for a missing product", async () => {
    api.onGet("/products/26").reply(404, { status: "error", message: "Product not found." });
    renderWithProviders(<ProductDetail productId={26} />, { user });

    expect(await screen.findByText("Product not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Back to products" })).toHaveAttribute("href", "/dashboard");
  });

  it("links to the edit page", async () => {
    api.onGet("/products/26").reply(200, success(product));
    replyRatings();
    renderWithProviders(<ProductDetail productId={26} />, { user });

    expect(await screen.findByRole("link", { name: "Edit product" })).toHaveAttribute("href", "/dashboard/products/26/edit");
  });

  it("deletes the product after confirming and returns to the list", async () => {
    api.onGet("/products/26").reply(200, success(product));
    api.onDelete("/products/26").reply(200, success(undefined, "Product deleted."));
    replyRatings();
    renderWithProviders(<ProductDetail productId={26} />, { user });

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete this product?" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(api.history.delete).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete product" }));

    await vi.waitFor(() => expect(nav.push).toHaveBeenCalledWith("/dashboard"));
    await expectToast(/was deleted\./);
    expect(api.history.delete).toHaveLength(1);
  });

  it("keeps the dialog open with the error when delete fails", async () => {
    api.onGet("/products/26").reply(200, success(product));
    api.onDelete("/products/26").reply(500, { status: "error", message: "Something went wrong." });
    replyRatings();
    renderWithProviders(<ProductDetail productId={26} />, { user });

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete product" }));

    const dialog = screen.getByRole("alertdialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Something went wrong.");
    expect(nav.push).not.toHaveBeenCalled();
  });
});
