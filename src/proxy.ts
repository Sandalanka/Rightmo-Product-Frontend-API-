import { NextResponse, type NextRequest } from "next/server";

// Keep in sync with TOKEN_COOKIE in src/lib/auth/session.ts (proxy must not import app modules).
const TOKEN_COOKIE = "auth_token";
const PROTECTED_PREFIXES = ["/dashboard"];
const GUEST_ONLY = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  // The server got a 401 with this token: drop it, otherwise the guest-only rule below would bounce back to /dashboard.
  if (pathname === "/login" && request.nextUrl.searchParams.has("expired")) {
    const response = NextResponse.next();
    response.cookies.delete(TOKEN_COOKIE);
    return response;
  }

  if (!hasToken && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(url);
  }

  if (hasToken && GUEST_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
