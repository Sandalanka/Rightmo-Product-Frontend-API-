"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/context/AuthContext";

/** Top bar with logo, signed-in user and logout, wrapping every /dashboard page. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="text-2xl font-extrabold tracking-tight text-brand-500">
            Rightmo
          </Link>

          <div className="ml-auto flex items-center gap-3">
            {user && <span className="hidden max-w-40 truncate text-sm text-gray-600 sm:inline">{user.name}</span>}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
