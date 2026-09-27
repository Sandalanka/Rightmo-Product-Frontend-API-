import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { user } from "./fixtures";
import { renderWithAuth } from "./utils/render";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const renderShell = (options?: Parameters<typeof renderWithAuth>[1]) =>
  renderWithAuth(
    <DashboardShell>
      <p>Page content</p>
    </DashboardShell>,
    options,
  );

describe("DashboardShell", () => {
  it("renders the page content inside main", () => {
    renderShell();
    expect(screen.getByRole("main")).toHaveTextContent("Page content");
  });

  it("links the logo to the dashboard", () => {
    renderShell();
    expect(screen.getByRole("link", { name: "Rightmo" })).toHaveAttribute("href", "/dashboard");
  });

  it("shows the signed-in user's name and a logout button", async () => {
    renderShell({ user });
    expect(await screen.findByText(user.name)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("shows no user name when signed out", () => {
    renderShell();
    expect(screen.queryByText(user.name)).not.toBeInTheDocument();
  });
});
