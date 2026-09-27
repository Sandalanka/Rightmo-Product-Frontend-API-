/** All backend routes in one place (relative to NEXT_PUBLIC_API_BASE_URL). */
export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
  },
} as const;
