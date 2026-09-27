import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

const request = (path: string, token?: string) => {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  if (token) req.cookies.set("auth_token", token);
  return req;
};

describe("proxy", () => {
  it("redirects guests from protected pages to login with a return path", () => {
    const res = proxy(request("/dashboard?tab=1"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe("/dashboard?tab=1");
  });

  it("lets signed-in users reach protected pages", () => {
    const res = proxy(request("/dashboard", "1|abc"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects signed-in users away from login and register", () => {
    for (const path of ["/login", "/register"]) {
      const res = proxy(request(path, "1|abc"));
      expect(new URL(res.headers.get("location")!).pathname).toBe("/dashboard");
    }
  });

  it("lets guests open login", () => {
    expect(proxy(request("/login")).headers.get("location")).toBeNull();
  });
});

describe("proxy with an expired session", () => {
  it("deletes the token cookie on /login?expired and lets the page load", () => {
    const res = proxy(request("/login?expired=1", "1|old"));
    expect(res.headers.get("location")).toBeNull();
    expect(res.cookies.get("auth_token")?.value).toBe("");
  });
});
