import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactElement } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { saveSession } from "@/lib/auth/session";
import type { User } from "@/types/auth";

export function renderWithProviders(ui: ReactElement, { user }: { user?: User } = {}) {
  if (user) saveSession("1|test-token", user);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}

/** Fresh axios mock on the shared client; call .restore() in afterEach. */
export const mockApi = () => new MockAdapter(apiClient, { onNoMatch: "throwException" });
