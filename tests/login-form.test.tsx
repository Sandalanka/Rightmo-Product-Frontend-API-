import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { authPayload } from "./fixtures";
import { expectToast } from "./utils/toast";

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => search,
}));

const renderForm = () =>
  render(
    <ToastProvider>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </ToastProvider>,
  );

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText("Email"), email);
  if (password) await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockClear();
    search = new URLSearchParams();
  });

  it("shows validation errors and does not call the API", async () => {
    const login = vi.spyOn(authService, "login");
    renderForm();

    await fillAndSubmit("", "");

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("logs in and redirects to the dashboard", async () => {
    const login = vi.spyOn(authService, "login").mockResolvedValue(authPayload);
    renderForm();

    await fillAndSubmit("jane@example.com", "Secret@123");

    expect(login).toHaveBeenCalledWith({ email: "jane@example.com", password: "Secret@123" });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    await expectToast("Welcome back, Jane Doe!");
  });

  it("redirects back to a safe ?redirect= path", async () => {
    search = new URLSearchParams({ redirect: "/dashboard/settings" });
    vi.spyOn(authService, "login").mockResolvedValue(authPayload);
    renderForm();

    await fillAndSubmit("jane@example.com", "Secret@123");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/settings"));
  });

  it("ignores external redirect targets", async () => {
    search = new URLSearchParams({ redirect: "//evil.com" });
    vi.spyOn(authService, "login").mockResolvedValue(authPayload);
    renderForm();

    await fillAndSubmit("jane@example.com", "Secret@123");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows the backend error for invalid credentials", async () => {
    vi.spyOn(authService, "login").mockRejectedValue(new ApiError("Invalid email or password.", 401));
    renderForm();

    await fillAndSubmit("jane@example.com", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
