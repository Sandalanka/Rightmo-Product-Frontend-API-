import { dehydrate, QueryClient } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient } from "@/lib/api";
import { DEFAULT_FILTERS } from "@/lib/products/filters";
import { queryKeys } from "@/lib/query-client";
import { parseIdParam, prefetch, SESSION_EXPIRED_URL, toURLSearchParams } from "@/lib/server/prefetch";
import { proxy } from "@/proxy";
import { categories, pagination, productSummary, success } from "./fixtures";
import { resetNav } from "./utils/navigation";
import { renderWithProviders } from "./utils/render";

const serverCookies = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (serverCookies.has(name) ? { name, value: serverCookies.get(name) } : undefined) }),
}));
vi.mock("next/navigation", async () => {
  const nav = await import("./utils/navigation");
  return {
    ...nav,
    redirect: vi.fn((url: string) => {
      throw new Error(`REDIRECT ${url}`);
    }),
    notFound: vi.fn(() => {
      throw new Error("NOT_FOUND");
    }),
  };
});

describe("prefetch()", () => {
  const key = ["thing"];

  it("stores the data in the query cache", async () => {
    const qc = new QueryClient();
    await expect(prefetch(qc, key, async () => ({ ok: 1 }))).resolves.toEqual({ ok: 1 });
    expect(qc.getQueryData(key)).toEqual({ ok: 1 });
  });

  it("redirects to login when the token is rejected", async () => {
    await expect(prefetch(new QueryClient(), key, () => Promise.reject(new ApiError("Unauthenticated", 401)))).rejects.toThrow(
      `REDIRECT ${SESSION_EXPIRED_URL}`,
    );
  });

  it("renders not-found for a 404 only when asked", async () => {
    const load = () => Promise.reject(new ApiError("Product not found.", 404));
    await expect(prefetch(new QueryClient(), key, load, { notFoundOn404: true })).rejects.toThrow("NOT_FOUND");
    await expect(prefetch(new QueryClient(), key, load)).resolves.toBeUndefined();
  });

  it("leaves other failures to the client (nothing cached)", async () => {
    const qc = new QueryClient();
    await expect(prefetch(qc, key, () => Promise.reject(new ApiError("Server down", 500)))).resolves.toBeUndefined();
    expect(qc.getQueryData(key)).toBeUndefined();
  });
});

describe("server helpers", () => {
  it("toURLSearchParams keeps the first value of repeated keys", () => {
    expect(toURLSearchParams({ search: "tv", category: ["2", "3"], page: undefined }).toString()).toBe("search=tv&category=2");
  });

  it("parseIdParam accepts positive integers only", () => {
    expect(parseIdParam("26")).toBe(26);
    for (const bad of ["0", "-1", "1.5", "abc"]) expect(() => parseIdParam(bad)).toThrow("NOT_FOUND");
  });
});

describe("proxy: expired session", () => {
  it("clears the stale cookie on /login?expired=1 instead of bouncing to the dashboard", () => {
    const req = new NextRequest(new URL("/login?expired=1", "http://localhost:3000"));
    req.cookies.set("auth_token", "1|revoked");

    const res = proxy(req);

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("set-cookie")).toMatch(/auth_token=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i);
  });
});

describe("server-rendered pages", () => {
  let serverApi: MockAdapter;
  let browserApi: MockAdapter;

  beforeEach(() => {
    serverCookies.clear();
    serverCookies.set("auth_token", "1|server-token");
    // Server requests use a per-request axios instance (inherits the default adapter); browser ones use apiClient.
    serverApi = new MockAdapter(axios, { onNoMatch: "throwException" });
    browserApi = new MockAdapter(apiClient, { onNoMatch: "throwException" });
  });
  afterEach(() => {
    serverApi.restore();
    browserApi.restore();
  });

  it("dashboard: loads products with the cookie token on the server and the browser does not refetch", async () => {
    resetNav("/dashboard", "search=head&sort=price_asc");
    serverApi.onGet("/products").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer 1|server-token");
      expect(config.params).toMatchObject({ search: "head", sort_by: "price", sort_order: "asc" });
      return [200, success({ products: [productSummary()], pagination: pagination(1, 1, 1) })];
    });
    serverApi.onGet("/categories").reply(200, success({ categories }));

    const { default: DashboardPage } = await import("@/app/dashboard/page");
    const element = await DashboardPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({ search: "head", sort: "price_asc" }),
    } as PageProps<"/dashboard">);
    renderWithProviders(element);

    // Present immediately: rendered from the server-provided cache.
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Books" })).toBeInTheDocument();
    expect(browserApi.history.get).toHaveLength(0);
  });

  it("dashboard: sends users with a revoked token to login", async () => {
    serverApi.onGet("/products").reply(401, { status: "error", message: "Unauthenticated." });
    serverApi.onGet("/categories").reply(401, { status: "error", message: "Unauthenticated." });

    const { default: DashboardPage } = await import("@/app/dashboard/page");
    await expect(
      DashboardPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) } as PageProps<"/dashboard">),
    ).rejects.toThrow(`REDIRECT ${SESSION_EXPIRED_URL}`);
  });

  it("product page: not-found for a missing product, title from the product for an existing one", async () => {
    serverApi.onGet("/products/999").reply(404, { status: "error", message: "Product not found." });
    serverApi.onGet("/products/999/ratings").reply(404, { status: "error", message: "Product not found." });
    serverApi.onGet("/products/26").reply(200, success({ id: 26, name: "Wireless Headphones", description: "Great", category: { id: 1, name: "Electronics" } }));

    const page = await import("@/app/dashboard/products/[id]/page");
    await expect(
      page.default({ params: Promise.resolve({ id: "999" }), searchParams: Promise.resolve({}) } as PageProps<"/dashboard/products/[id]">),
    ).rejects.toThrow("NOT_FOUND");

    const metadata = await page.generateMetadata({
      params: Promise.resolve({ id: "26" }),
      searchParams: Promise.resolve({}),
    } as PageProps<"/dashboard/products/[id]">);
    expect(metadata).toMatchObject({ title: "Wireless Headphones", description: "Great" });
  });

  it("the server cache key matches the key the client asks for", () => {
    const qc = new QueryClient();
    qc.setQueryData(queryKeys.products.list({ ...DEFAULT_FILTERS }), "x");
    const [entry] = dehydrate(qc).queries;
    expect(entry.queryHash).toBe(JSON.stringify(["products", "list", Object.fromEntries(Object.entries(DEFAULT_FILTERS).sort())]));
  });
});
