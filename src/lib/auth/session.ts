import type { User } from "@/types/auth";

/**
 * Client-side session storage.
 * The token lives in a cookie so the Next.js proxy can read it for route protection;
 * the user profile lives in localStorage because the backend has no /me endpoint.
 */
export const TOKEN_COOKIE = "auth_token";
const USER_KEY = "auth_user";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const isBrowser = () => typeof window !== "undefined";

export function getToken(): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getStoredUser(): User | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: User): void {
  if (!isBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage can be unavailable (private mode); the token cookie is enough to stay signed in.
  }
}

export function clearSession(): void {
  if (!isBrowser()) return;
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}
