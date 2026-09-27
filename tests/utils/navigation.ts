import { vi } from "vitest";

/** Controllable stand-in for next/navigation. Use: vi.mock("next/navigation", () => import("./utils/navigation")) */
export const nav = {
  pathname: "/dashboard",
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
};

export function resetNav(pathname = "/dashboard", search = "") {
  nav.pathname = pathname;
  nav.searchParams = new URLSearchParams(search);
  nav.push.mockReset();
  nav.replace.mockReset();
}

export const useRouter = () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), refresh: vi.fn() });
export const usePathname = () => nav.pathname;
export const useSearchParams = () => nav.searchParams;
export const notFound = () => {
  throw new Error("NEXT_NOT_FOUND");
};
