import type { AuthPayload, User } from "@/types/auth";

export const user: User = {
  id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
  email_verified_at: null,
  created_at: "2026-09-27T00:00:00.000000Z",
  updated_at: "2026-09-27T00:00:00.000000Z",
};

export const authPayload: AuthPayload = { user, token: "1|test-token", token_type: "Bearer" };

export const success = <T,>(data?: T, message = "OK") => ({
  status: "success",
  message,
  ...(data !== undefined && { data }),
  timestamp: "2026-09-27 00:00:00",
});
