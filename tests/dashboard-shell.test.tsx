import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { isActive } from "@/components/dashboard/nav-items";
import { saveSession } from "@/lib/auth/session";
import { user } from "./fixtures";
import { resetNav } from "./utils/navigation";
import { renderWithProviders } from "./utils/render";

vi.mock("next/navigation", () => import("./utils/navigation"));

// jsdom has no matchMedia
const mediaListeners: ((e: { matches: boolean }) => void)[] = [];
window.matchMedia = vi.fn().mockImplementation(() => ({
  matches: false,
  addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => mediaListeners.push(cb),
  removeEventListener: vi.fn(),
}));

const renderShell = () =>
  renderWithProviders(
    <DashboardShell>
      <p>Page content</p>
    </DashboardShell>,
  );

// The drawer is aria-hidden while closed, so it is looked up by id rather than by role.
const sidebar = () => document.getElementById("dashboard-sidebar") as HTMLElement;
const topNav = () => screen.getByRole("navigation", { name: "Main" });
const hamburger = () => screen.getByRole("button", { name: "Open menu" });
const isDrawerOpen = () => sidebar().classList.contains("translate-x-0");

describe("DashboardShell", () => {
  beforeEach(() => {
    resetNav("/dashboard");
    document.body.style.overflow = "";
    mediaListeners.length = 0;
  });

  it("renders page content and the desktop top navbar links", () => {
    renderShell();
    expect(screen.getByText("Page content")).toBeInTheDocument();
    for (const label of ["Products", "Categories"]) {
      expect(within(topNav()).getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("hides the desktop navbar on mobile and the hamburger/sidebar on desktop", () => {
    renderShell();
    expect(topNav()).toHaveClass("hidden", "md:flex");
    expect(hamburger()).toHaveClass("md:hidden");
    expect(sidebar().parentElement).toHaveClass("md:hidden");
    expect(screen.getAllByRole("search")).toHaveLength(2); // header (desktop) + own row (mobile)
  });

  it("starts with the mobile drawer closed and inert", () => {
    renderShell();
    expect(isDrawerOpen()).toBe(false);
    expect(sidebar()).toHaveAttribute("aria-hidden", "true");
    expect(hamburger()).toHaveAttribute("aria-expanded", "false");
    expect(hamburger()).toHaveAttribute("aria-controls", sidebar().id);
  });

  it("opens with the hamburger and locks page scroll", async () => {
    renderShell();
    await userEvent.click(hamburger());

    expect(isDrawerOpen()).toBe(true);
    expect(sidebar()).toHaveAttribute("aria-hidden", "false");
    expect(hamburger()).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes with the close button and restores scroll", async () => {
    renderShell();
    await userEvent.click(hamburger());
    await userEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(isDrawerOpen()).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes when the backdrop is clicked", async () => {
    renderShell();
    await userEvent.click(hamburger());
    await userEvent.click(screen.getByTestId("dashboard-sidebar-backdrop"));

    expect(isDrawerOpen()).toBe(false);
  });

  it("closes on Escape", async () => {
    renderShell();
    await userEvent.click(hamburger());
    await userEvent.keyboard("{Escape}");

    expect(isDrawerOpen()).toBe(false);
  });

  it("closes after choosing a link in the drawer", async () => {
    renderShell();
    await userEvent.click(hamburger());
    await userEvent.click(within(sidebar()).getByRole("link", { name: "Categories" }));

    expect(isDrawerOpen()).toBe(false);
  });

  it("closes when the screen grows to desktop width", async () => {
    renderShell();
    await userEvent.click(hamburger());
    const { act } = await import("@testing-library/react");
    act(() => mediaListeners.forEach((cb) => cb({ matches: true })));

    expect(isDrawerOpen()).toBe(false);
  });

  it("marks the current page link as active in both menus", async () => {
    resetNav("/dashboard/categories");
    renderShell();
    await userEvent.click(hamburger());

    for (const menu of [topNav(), sidebar()]) {
      expect(within(menu).getByRole("link", { name: "Categories" })).toHaveAttribute("aria-current", "page");
      expect(within(menu).getByRole("link", { name: "Products" })).not.toHaveAttribute("aria-current");
    }
  });

  it("shows the signed-in user in the navbar and drawer", async () => {
    saveSession("1|abc", user);
    renderShell();

    expect(await screen.findAllByText(user.name)).toHaveLength(2);
    expect(within(sidebar()).getByText(user.email)).toBeInTheDocument();
  });
});

describe("isActive", () => {
  const products = { href: "/dashboard", alsoMatches: ["/dashboard/products"] };
  const categories = { href: "/dashboard/categories" };

  it.each([
    ["/dashboard", products, true],
    ["/dashboard/products/5", products, true],
    ["/dashboard/categories", products, false],
    ["/dashboard/products-archive", products, false],
    ["/dashboard/categories", categories, true],
    ["/dashboard/categories/2", categories, true],
    ["/dashboard", categories, false],
  ])("pathname %s, item %o -> %s", (path, item, expected) => {
    expect(isActive(path, item)).toBe(expected);
  });
});
