import "server-only";
import axios from "axios";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "@/config/env";
import { createHttp, toApiError } from "@/lib/api";
import { TOKEN_COOKIE } from "@/lib/auth/session";
import { createCategoryService, createProductService } from "@/services/product.service";
import { createRatingService } from "@/services/rating.service";

/**
 * The server may reach Laravel on a different address than the browser (e.g. a Docker service name),
 * so API_INTERNAL_URL (server-only) wins over the public URL when set.
 */
const serverBaseUrl = process.env.API_INTERNAL_URL || env.apiBaseUrl;

/** Per-request API services authenticated with the user's token cookie (cached for the request). */
export const getServerApi = cache(async () => {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  const client = axios.create({
    baseURL: serverBaseUrl,
    timeout: env.apiTimeout,
    headers: {
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(toApiError(error)),
  );

  const http = createHttp(client);
  return {
    products: createProductService(http),
    categories: createCategoryService(http),
    ratings: createRatingService(http),
  };
});

export type ServerApi = Awaited<ReturnType<typeof getServerApi>>;
