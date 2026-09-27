/**
 * Central place for environment variables.
 * NEXT_PUBLIC_* values are inlined at build time, so they must be read with the full literal name.
 */
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8089/api/v1",
  apiTimeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 15000),
} as const;
