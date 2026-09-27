import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { ApiSuccessResponse } from "@/types/api";
import { apiClient } from "./client";

/**
 * Thin typed wrappers that return the backend envelope ({ status, message, data }).
 * The same services run in the browser (shared client) and on the server (per-request client with the user's token).
 */
export function createHttp(client: AxiosInstance) {
  return {
    async get<T>(url: string, config?: AxiosRequestConfig) {
      const { data } = await client.get<ApiSuccessResponse<T>>(url, config);
      return data;
    },
    async post<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
      const { data } = await client.post<ApiSuccessResponse<T>>(url, body, config);
      return data;
    },
    async put<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
      const { data } = await client.put<ApiSuccessResponse<T>>(url, body, config);
      return data;
    },
    async delete<T>(url: string, config?: AxiosRequestConfig) {
      const { data } = await client.delete<ApiSuccessResponse<T>>(url, config);
      return data;
    },
  };
}

export type Http = ReturnType<typeof createHttp>;

/** Browser instance (token from the auth cookie via the client interceptor). */
export const http = createHttp(apiClient);
