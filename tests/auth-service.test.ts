import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError, apiClient, ENDPOINTS } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { authPayload, success } from "./fixtures";

describe("authService", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => mock.restore());

  it("login posts credentials and returns the auth payload", async () => {
    mock.onPost(ENDPOINTS.auth.login).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ email: "jane@example.com", password: "Secret@123" });
      return [200, success(authPayload, "User login successfully.")];
    });

    await expect(authService.login({ email: "jane@example.com", password: "Secret@123" })).resolves.toEqual(authPayload);
  });

  it("login rejects with the backend message on invalid credentials", async () => {
    mock.onPost(ENDPOINTS.auth.login).reply(401, { status: "error", message: "Invalid email or password." });

    await expect(authService.login({ email: "a@b.co", password: "x" })).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password.",
    });
  });

  it("register posts the form and returns the auth payload", async () => {
    const payload = { name: "Jane", email: "jane@example.com", password: "Secret@123", password_confirmation: "Secret@123" };
    mock.onPost(ENDPOINTS.auth.register).reply((config) => {
      expect(JSON.parse(config.data)).toEqual(payload);
      return [201, success(authPayload, "User registered successfully.")];
    });

    await expect(authService.register(payload)).resolves.toEqual(authPayload);
  });

  it("throws when the response has no token", async () => {
    mock.onPost(ENDPOINTS.auth.login).reply(200, success({ user: authPayload.user }));

    await expect(authService.login({ email: "a@b.co", password: "x" })).rejects.toBeInstanceOf(ApiError);
  });

  it("logout calls the logout endpoint", async () => {
    mock.onPost(ENDPOINTS.auth.logout).reply(200, success(undefined, "User logout successfully."));

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(mock.history.post).toHaveLength(1);
  });
});
