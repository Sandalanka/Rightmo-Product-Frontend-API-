import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retry network/5xx errors once; 4xx (not found, validation, auth) will not change on retry.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 1,
      },
    },
  });
}

/** Query keys in one place so invalidation stays consistent. */
export const queryKeys = {
  categories: ["categories"] as const,
  products: {
    all: ["products"] as const,
    list: (filters: object) => ["products", "list", filters] as const,
    detail: (id: number) => ["products", "detail", id] as const,
  },
  ratings: {
    all: (productId: number) => ["ratings", productId] as const,
    list: (productId: number, page: number) => ["ratings", productId, "list", page] as const,
  },
};
