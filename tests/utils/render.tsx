import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { saveSession } from "@/lib/auth/session";
import type { User } from "@/types/auth";

/** Renders inside AuthProvider; pass a user to start signed in. */
export function renderWithAuth(ui: ReactElement, { user }: { user?: User } = {}) {
  if (user) saveSession("1|test-token", user);
  return render(<AuthProvider>{ui}</AuthProvider>);
}
