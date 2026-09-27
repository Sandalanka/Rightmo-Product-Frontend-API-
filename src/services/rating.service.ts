import { ENDPOINTS, http as browserHttp, type Http } from "@/lib/api";
import type { Rating, RatingInput, RatingPage } from "@/types/product";

export const RATINGS_PER_PAGE = 5;

const toBody = (input: RatingInput) => ({ rating: input.rating, comment: input.comment?.trim() || null });

function requireRating(rating: Rating | undefined): Rating {
  if (!rating) throw new Error("Invalid response from server.");
  return rating;
}

export const createRatingService = (http: Http) => ({
  async list(productId: number, page = 1, perPage = RATINGS_PER_PAGE, signal?: AbortSignal): Promise<RatingPage> {
    const res = await http.get<RatingPage>(ENDPOINTS.products.ratings(productId), {
      params: { page, per_page: perPage },
      signal,
    });
    return res.data ?? { ratings: [], pagination: { current_page: 1, last_page: 1, per_page: perPage, total: 0, from: null, to: null } };
  },

  /** Adds a new review (a user may review the same product several times). */
  async create(productId: number, input: RatingInput): Promise<Rating> {
    const res = await http.post<Rating>(ENDPOINTS.products.ratings(productId), toBody(input));
    return requireRating(res.data);
  },

  /** Updates one of the user's own reviews (403 for someone else's). */
  async update(productId: number, ratingId: number, input: RatingInput): Promise<Rating> {
    const res = await http.put<Rating>(ENDPOINTS.products.rating(productId, ratingId), toBody(input));
    return requireRating(res.data);
  },

  async remove(productId: number, ratingId: number): Promise<void> {
    await http.delete(ENDPOINTS.products.rating(productId, ratingId));
  },
});

export const ratingService = createRatingService(browserHttp);
