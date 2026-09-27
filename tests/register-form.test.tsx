import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { authPayload } from "./fixtures";
import { expectToast } from "./utils/toast";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

async function fill(values: { name: string; email: string; password: string; confirm: string }) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Name"), values.name);
  await user.type(screen.getByLabelText("Email"), values.email);
  await user.type(screen.getByLabelText("Password"), values.password);
  await user.type(screen.getByLabelText("Confirm password"), values.confirm);
  await user.click(screen.getByRole("button", { name: /create account/i }));
}

describe("RegisterForm", () => {
  beforeEach(() => {
    replace.mockClear();
    render(
      <ToastProvider>
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      </ToastProvider>,
    );
  });

  it("validates password rules on the client", async () => {
    const register = vi.spyOn(authService, "register");

    await fill({ name: "Jane", email: "jane@example.com", password: "password", confirm: "different" });

    expect(screen.getByText(/uppercase, lowercase, number, and symbol/)).toBeInTheDocument();
    expect(screen.getByText("Password confirmation does not match.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("registers and redirects to the dashboard", async () => {
    const register = vi.spyOn(authService, "register").mockResolvedValue(authPayload);

    await fill({ name: "Jane", email: "jane@example.com", password: "Secret@123", confirm: "Secret@123" });

    expect(register).toHaveBeenCalledWith({
      name: "Jane",
      email: "jane@example.com",
      password: "Secret@123",
      password_confirmation: "Secret@123",
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    await expectToast("Account created. Welcome, Jane Doe!");
  });

  it("shows server-side field errors under the matching input", async () => {
    vi.spyOn(authService, "register").mockRejectedValue(
      new ApiError("Validation errors", 422, { email: ["The email has already been taken."] }),
    );

    await fill({ name: "Jane", email: "jane@example.com", password: "Secret@123", confirm: "Secret@123" });

    expect(await screen.findByText("The email has already been taken.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(replace).not.toHaveBeenCalled();
  });
});
