import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserCard } from "@/components/dashboard/UserCard";
import { user } from "./fixtures";
import { renderWithAuth } from "./utils/render";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

describe("UserCard", () => {
  it("shows the user's initial, name and email", async () => {
    renderWithAuth(<UserCard />, { user });

    expect(await screen.findByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
    expect(screen.getByText(/member since/i)).toBeInTheDocument();
  });

  it("renders nothing when signed out", async () => {
    const { container } = renderWithAuth(<UserCard />);
    // After the session check finishes the loading placeholder is removed.
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
