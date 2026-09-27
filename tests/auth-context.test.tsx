import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { getStoredUser, getToken, saveSession } from "@/lib/auth/session";
import { authService } from "@/services/auth.service";
import { authPayload, user } from "./fixtures";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthProvider / useAuth", () => {
  beforeEach(() => replace.mockClear());

  it("throws when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });

  it("starts signed out", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("restores an existing session", async () => {
    saveSession("1|abc", user);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(user));
  });

  it("login stores the session and sets the user", async () => {
    vi.spyOn(authService, "login").mockResolvedValue(authPayload);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(() => result.current.login({ email: user.email, password: "Secret@123" }));

    expect(result.current.isAuthenticated).toBe(true);
    expect(getToken()).toBe(authPayload.token);
    expect(getStoredUser()).toEqual(user);
  });

  it("register stores the session and sets the user", async () => {
    vi.spyOn(authService, "register").mockResolvedValue(authPayload);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(() =>
      result.current.register({ name: "Jane", email: user.email, password: "Secret@123", password_confirmation: "Secret@123" }),
    );

    expect(result.current.user).toEqual(user);
    expect(getToken()).toBe(authPayload.token);
  });

  it("logout clears the session", async () => {
    saveSession("1|abc", user);
    vi.spyOn(authService, "logout").mockResolvedValue();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(() => result.current.logout());

    expect(result.current.isAuthenticated).toBe(false);
    expect(getToken()).toBeNull();
  });

  it("logout clears the session even when the API call fails", async () => {
    saveSession("1|abc", user);
    vi.spyOn(authService, "logout").mockRejectedValue(new ApiError("Server down", 500));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(() => expect(result.current.logout()).rejects.toThrow("Server down"));

    expect(result.current.isAuthenticated).toBe(false);
    expect(getToken()).toBeNull();
  });
});

describe("AuthProvider on an expired token", () => {
  beforeEach(() => replace.mockClear());

  it("signs out and goes to login when an authenticated request gets 401", async () => {
    const { apiClient } = await import("@/lib/api");
    const MockAdapter = (await import("axios-mock-adapter")).default;
    const mock = new MockAdapter(apiClient);
    mock.onPost("/auth/logout").reply(401, { status: "error", message: "Unauthenticated." });
    saveSession("1|expired", user);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(() => apiClient.post("/auth/logout").catch(() => {}));

    expect(result.current.isAuthenticated).toBe(false);
    expect(getToken()).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
    mock.restore();
  });
});
