import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { nav, resetNav } from "./utils/navigation";

vi.mock("next/navigation", () => import("./utils/navigation"));

const input = () => screen.getByRole("searchbox", { name: "Search products" });

describe("SearchBar", () => {
  beforeEach(() => resetNav());

  it("searches and keeps current filters but resets the page", async () => {
    resetNav("/dashboard", "category=1&sort=price_asc&page=4");
    render(<SearchBar />);

    await userEvent.type(input(), "  headphones  {Enter}");

    expect(nav.push).toHaveBeenCalledWith("/dashboard?category=1&sort=price_asc&search=headphones");
  });

  it("starts a fresh listing when searching from another page", async () => {
    resetNav("/dashboard/products/26", "");
    render(<SearchBar />);

    await userEvent.type(input(), "shoe");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(nav.push).toHaveBeenCalledWith("/dashboard?search=shoe");
  });

  it("shows the current search and clears it when submitted empty", async () => {
    resetNav("/dashboard", "search=phone");
    render(<SearchBar />);

    expect(input()).toHaveValue("phone");
    await userEvent.clear(input());
    await userEvent.type(input(), "{Enter}");

    expect(nav.push).toHaveBeenCalledWith("/dashboard");
  });
});
