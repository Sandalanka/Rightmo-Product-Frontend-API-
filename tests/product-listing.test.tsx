import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductListing } from "@/components/products/ProductListing";
import { categories, pagination, productSummary, success } from "./fixtures";
import { nav, resetNav } from "./utils/navigation";
import { mockApi, renderWithProviders } from "./utils/render";

vi.mock("next/navigation", () => import("./utils/navigation"));

const products = [
  productSummary(),
  productSummary({ id: 27, name: "Cotton T-Shirt", price: "850", average_rating: 0, category_name: "Clothing", image_url: null }),
];

describe("ProductListing", () => {
  let api: MockAdapter;

  beforeEach(() => {
    resetNav("/dashboard");
    api = mockApi();
    api.onGet("/categories").reply(200, success({ categories }));
  });
  afterEach(() => api.restore());

  const replyProducts = (list = products, meta = pagination(1, 1, list.length)) =>
    api.onGet("/products").reply(200, success({ products: list, pagination: meta }));

  it("shows product cards with name, category, price, rating and a link to the detail page", async () => {
    replyProducts();
    renderWithProviders(<ProductListing />);

    const card = (await screen.findByText("Wireless Headphones")).closest("a")!;
    expect(card).toHaveAttribute("href", "/dashboard/products/26");
    expect(within(card).getByText("Rs. 1,999.50")).toBeInTheDocument();
    expect(within(card).getByText("Electronics")).toBeInTheDocument();
    expect(within(card).getByRole("img", { name: "Rated 4.5 out of 5" })).toBeInTheDocument();
    expect(await screen.findByText("items found", { exact: false })).toHaveTextContent("2 items found");
  });

  it("shows a placeholder when a product has no image", async () => {
    replyProducts();
    renderWithProviders(<ProductListing />);

    const card = (await screen.findByText("Cotton T-Shirt")).closest("a")!;
    expect(within(card).getByRole("img", { name: "Cotton T-Shirt" }).tagName).toBe("DIV");
  });

  it("sends URL filters to the API", async () => {
    resetNav("/dashboard", "search=head&category=1&min=10&max=500&sort=price_asc&page=2");
    api.onGet("/products").reply((config) => {
      expect(config.params).toEqual({
        search: "head",
        category_id: 1,
        min_price: 10,
        max_price: 500,
        sort_by: "price",
        sort_order: "asc",
        per_page: 12,
        page: 2,
      });
      return [200, success({ products, pagination: pagination(2, 3, 30) })];
    });
    renderWithProviders(<ProductListing />);

    expect(await screen.findByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText(/items found/).textContent).toContain("“head”");
  });

  it("changes sort via the URL and resets to page 1", async () => {
    resetNav("/dashboard", "page=3");
    replyProducts();
    renderWithProviders(<ProductListing />);

    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "Sort products" }), "price_desc");

    expect(nav.push).toHaveBeenCalledWith("/dashboard?sort=price_desc", { scroll: false });
  });

  it("filters by category", async () => {
    replyProducts();
    renderWithProviders(<ProductListing />);

    const desktopFilters = screen.getByRole("complementary", { name: "Filters" });
    await userEvent.click(await within(desktopFilters).findByRole("button", { name: "Books" }));

    expect(nav.push).toHaveBeenCalledWith("/dashboard?category=3", { scroll: false });
  });

  it("filters by price range and validates min <= max", async () => {
    replyProducts();
    renderWithProviders(<ProductListing />);
    const desktopFilters = screen.getByRole("complementary", { name: "Filters" });
    const min = within(desktopFilters).getByLabelText("Minimum price");
    const max = within(desktopFilters).getByLabelText("Maximum price");
    const apply = within(desktopFilters).getByRole("button", { name: "Apply price range" });

    await userEvent.type(min, "500");
    await userEvent.type(max, "100");
    await userEvent.click(apply);
    expect(within(desktopFilters).getByRole("alert")).toHaveTextContent("Min price can't be more than max price.");
    expect(nav.push).not.toHaveBeenCalled();

    await userEvent.clear(max);
    await userEvent.type(max, "900");
    await userEvent.click(apply);
    expect(nav.push).toHaveBeenCalledWith("/dashboard?min=500&max=900", { scroll: false });
  });

  it("paginates and scrolls to top", async () => {
    replyProducts(products, pagination(1, 5, 60));
    renderWithProviders(<ProductListing />);

    await userEvent.click(await screen.findByRole("button", { name: "Page 2" }));
    expect(nav.push).toHaveBeenCalledWith("/dashboard?page=2", { scroll: true });
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  });

  it("shows active filter chips that can be removed", async () => {
    resetNav("/dashboard", "search=head&category=1&sort=price_asc");
    replyProducts();
    renderWithProviders(<ProductListing />);

    await userEvent.click(await screen.findByRole("button", { name: "Remove filter Electronics" }));
    expect(nav.push).toHaveBeenLastCalledWith("/dashboard?search=head&sort=price_asc", { scroll: false });

    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(nav.push).toHaveBeenLastCalledWith("/dashboard?sort=price_asc", { scroll: false });
  });

  it("shows an empty state with a clear button when nothing matches", async () => {
    resetNav("/dashboard", "search=zzz");
    replyProducts([], pagination(1, 1, 0));
    renderWithProviders(<ProductListing />);

    expect(await screen.findByText("No products found")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(nav.push).toHaveBeenCalledWith("/dashboard", { scroll: false });
  });

  it("shows an error with retry when the request fails", async () => {
    api.onGet("/products").replyOnce(500, { status: "error", message: "Something went wrong." });
    renderWithProviders(<ProductListing />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");

    replyProducts();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Wireless Headphones")).toBeInTheDocument();
  });

  it("opens the mobile filter drawer and closes it after choosing a category", async () => {
    replyProducts();
    renderWithProviders(<ProductListing />);
    const drawer = document.getElementById("product-filters")!;
    const openButton = screen.getByRole("button", { name: "Filters" });

    await userEvent.click(openButton);
    expect(drawer).toHaveClass("translate-x-0");
    expect(openButton).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(await within(drawer).findByRole("button", { name: "Books" }));
    await waitFor(() => expect(drawer).not.toHaveClass("translate-x-0"));
    expect(nav.push).toHaveBeenCalledWith("/dashboard?category=3", { scroll: false });
  });

  it("links to the add product page", async () => {
    replyProducts();
    renderWithProviders(<ProductListing />);
    expect(screen.getByRole("link", { name: "Add product" })).toHaveAttribute("href", "/dashboard/products/new");
  });
});
