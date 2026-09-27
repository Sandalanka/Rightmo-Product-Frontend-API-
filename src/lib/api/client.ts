import axios, { type AxiosInstance } from "axios";
import { env } from "@/config/env";
import { getToken } from "@/lib/auth/session";
import { toApiError } from "./errors";

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Lets the AuthProvider decide what happens when a token expires (clear state, redirect). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export function createApiClient(baseURL: string = env.apiBaseUrl): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: env.apiTimeout,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const apiError = toApiError(error);
      // Only an authenticated request can "expire"; a failed login is a normal 401.
      const hadToken = Boolean(error?.config?.headers?.Authorization);
      if (apiError.isUnauthorized && hadToken) onUnauthorized?.();
      return Promise.reject(apiError);
    },
  );

  return instance;
}

/** Shared instance used by all services. */
export const apiClient = createApiClient();
