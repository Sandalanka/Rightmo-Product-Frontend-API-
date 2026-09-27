import { ApiError, ENDPOINTS, http } from "@/lib/api";
import type { AuthPayload, LoginCredentials, RegisterData } from "@/types/auth";

function requireAuthPayload(data: AuthPayload | undefined): AuthPayload {
  if (!data?.token || !data.user) throw new ApiError("Invalid response from server.");
  return data;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthPayload> {
    const res = await http.post<AuthPayload>(ENDPOINTS.auth.login, credentials);
    return requireAuthPayload(res.data);
  },

  async register(payload: RegisterData): Promise<AuthPayload> {
    const res = await http.post<AuthPayload>(ENDPOINTS.auth.register, payload);
    return requireAuthPayload(res.data);
  },

  async logout(): Promise<void> {
    await http.post(ENDPOINTS.auth.logout);
  },
};
