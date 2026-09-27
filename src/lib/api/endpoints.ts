/** All backend routes in one place (relative to NEXT_PUBLIC_API_BASE_URL). */
export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
  },
  categories: "/categories",
  products: {
    list: "/products",
    detail: (id: number) => `/products/${id}`,
    ratings: (id: number) => `/products/${id}/ratings`,
    rating: (id: number, ratingId: number) => `/products/${id}/ratings/${ratingId}`,
    images: (id: number) => `/products/${id}/images`,
    image: (id: number, imageId: number) => `/products/${id}/images/${imageId}`,
  },
} as const;
