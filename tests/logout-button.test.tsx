import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import { authService } from "@/services/auth.service";
import { user } from "./fixtures";
import { renderWithProviders } from "./utils/render";
import { expectToast } from "./utils/toast";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

describe("LogoutButton", () => {
  beforeEach(() => replace.mockClear());

  it("logs out, clears the session and goes to login", async () => {
    const logout = vi.spyOn(authService, "logout").mockResolvedValue();
    renderWithProviders(<LogoutButton />, { user });

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(logout).toHaveBeenCalledOnce();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    await expectToast("You have been logged out.");
    expect(getToken()).toBeNull();
  });

  it("still signs out locally when the API call fails", async () => {
    vi.spyOn(authService, "logout").mockRejectedValue(new ApiError("Server down", 500));
    renderWithProviders(<LogoutButton />, { user });

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(getToken()).toBeNull();
  });

  it("disables the button while logging out", async () => {
    vi.spyOn(authService, "logout").mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LogoutButton />, { user });

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByRole("button", { name: "Log out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Log out" })).toHaveAttribute("aria-busy", "true");
  });
});
