import { describe, expect, it } from "vitest";
import { clearSession, getStoredUser, getToken, saveSession, TOKEN_COOKIE } from "@/lib/auth/session";
import { user } from "./fixtures";

describe("session storage", () => {
  it("returns nothing when no session exists", () => {
    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it("saves the token in a cookie and the user in localStorage", () => {
    saveSession("1|abc token", user);

    expect(document.cookie).toContain(`${TOKEN_COOKIE}=`);
    expect(getToken()).toBe("1|abc token");
    expect(getStoredUser()).toEqual(user);
  });

  it("clears the session", () => {
    saveSession("1|abc", user);
    clearSession();

    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it("ignores corrupted user data", () => {
    localStorage.setItem("auth_user", "{not json");
    expect(getStoredUser()).toBeNull();
  });
});
