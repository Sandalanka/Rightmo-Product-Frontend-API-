import "server-only";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api";

export const SESSION_EXPIRED_URL = "/login?expired=1";

/**
 * Loads data on the server and puts it in the query cache so the page is rendered with it
 * and the browser does not fetch it again.
 * - 401: the token was revoked/expired -> login (the proxy clears the stale cookie there)
 * - 404 with `notFoundOn404`: render the not-found page
 * - anything else (backend down, 500): skip; the client component fetches and shows its own error/retry UI
 */
export async function prefetch<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<T>,
  { notFoundOn404 = false } = {},
): Promise<T | undefined> {
  let data: T;
  try {
    data = await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(SESSION_EXPIRED_URL);
    if (notFoundOn404 && error instanceof ApiError && error.status === 404) notFound();
    return undefined;
  }
  queryClient.setQueryData(queryKey, data);
  return data;
}

/** Next's searchParams object -> URLSearchParams (first value wins for repeated keys). */
export function toURLSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) result.set(key, first);
  }
  return result;
}

/** Parses a positive integer route param or renders the not-found page. */
export function parseIdParam(id: string): number {
  const value = Number(id);
  if (!Number.isInteger(value) || value < 1) notFound();
  return value;
}
