import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient, setUnauthorizedHandler } from "@/lib/api";
import { saveSession } from "@/lib/auth/session";
import { user } from "./fixtures";

describe("apiClient", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
    setUnauthorizedHandler(null);
  });

  it("uses the base URL from env", () => {
    expect(apiClient.defaults.baseURL).toBe("http://localhost:8089/api/v1");
  });

  it("sends JSON Accept header and no Authorization when signed out", async () => {
    mock.onGet("/ping").reply((config) => [200, { headers: config.headers }]);

    const res = await apiClient.get("/ping");

    expect(res.data.headers.Accept).toBe("application/json");
    expect(res.data.headers.Authorization).toBeUndefined();
  });

  it("attaches the Bearer token when signed in", async () => {
    saveSession("1|secret", user);
    mock.onGet("/ping").reply((config) => [200, { auth: config.headers?.Authorization }]);

    const res = await apiClient.get("/ping");

    expect(res.data.auth).toBe("Bearer 1|secret");
  });

  it("normalises Laravel validation errors into ApiError", async () => {
    mock.onPost("/auth/register").reply(422, {
      status: "failed",
      message: "Validation errors",
      errors: { email: ["The email has already been taken."] },
    });

    const error = await apiClient.post("/auth/register").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.isValidationError).toBe(true);
    expect(error.fieldError("email")).toBe("The email has already been taken.");
  });

  it("ignores string errors (debug exception text) as field errors", async () => {
    mock.onGet("/boom").reply(500, { status: "error", message: "Something went wrong.", errors: "SQLSTATE..." });

    const error: ApiError = await apiClient.get("/boom").catch((e) => e);

    expect(error.status).toBe(500);
    expect(error.message).toBe("Something went wrong.");
    expect(error.fieldErrors).toEqual({});
  });

  it("reports network failures with a friendly message", async () => {
    mock.onGet("/ping").networkError();

    const error: ApiError = await apiClient.get("/ping").catch((e) => e);

    expect(error.status).toBe(0);
    expect(error.message).toMatch(/unable to reach the server/i);
  });

  it("reports timeouts with a friendly message", async () => {
    mock.onGet("/ping").timeout();

    const error: ApiError = await apiClient.get("/ping").catch((e) => e);

    expect(error.message).toMatch(/timed out/i);
  });

  it("calls the unauthorized handler when an authenticated request gets 401", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    saveSession("1|expired", user);
    mock.onPost("/auth/logout").reply(401, { status: "error", message: "Unauthenticated." });

    await expect(apiClient.post("/auth/logout")).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not call the unauthorized handler for a failed login (no token)", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mock.onPost("/auth/login").reply(401, { status: "error", message: "Invalid email or password." });

    const error: ApiError = await apiClient.post("/auth/login").catch((e) => e);

    expect(error.message).toBe("Invalid email or password.");
    expect(handler).not.toHaveBeenCalled();
  });
});
