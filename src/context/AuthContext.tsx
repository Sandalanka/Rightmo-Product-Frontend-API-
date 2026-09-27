"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/lib/api";
import { clearSession, getStoredUser, getToken, saveSession } from "@/lib/auth/session";
import { authService } from "@/services/auth.service";
import type { LoginCredentials, RegisterData, User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Restore the session after mount (localStorage is not available during SSR).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
    setUser(getToken() ? getStoredUser() : null);
    setIsReady(true);
  }, []);

  // A 401 on an authenticated request means the token is gone: reset and send to login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setUser(null);
      router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { token, user } = await authService.login(credentials);
    saveSession(token, user);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { token, user } = await authService.register(data);
    saveSession(token, user);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Sign out locally even if the server call fails (e.g. token already revoked).
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isReady, login, register, logout }),
    [user, isReady, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
