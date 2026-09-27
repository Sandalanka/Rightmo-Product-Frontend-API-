import "server-only";
import { cache } from "react";
import { getServerApi } from "./api";

/** Deduplicated per request, so generateMetadata and the page share one API call. */
export const getProductOnServer = cache(async (id: number) => (await getServerApi()).products.get(id));
