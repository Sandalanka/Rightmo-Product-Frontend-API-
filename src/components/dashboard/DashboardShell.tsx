"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/context/AuthContext";
import { isActive, NAV_ITEMS } from "./nav-items";
import { SearchBar } from "./SearchBar";
import { Sidebar } from "./Sidebar";

const SIDEBAR_ID = "dashboard-sidebar";

/**
 * md and up: header with logo, search, inline links, user + logout.
 * Below md: hamburger opens the Sidebar drawer; search moves to its own row.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  // If the window is widened past md while the drawer is open, close it so scroll is unlocked.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => e.matches && close();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [close]);

  const search = (
    <Suspense fallback={<div className="h-9 w-full rounded-md bg-gray-100" />}>
      <SearchBar />
    </Suspense>
  );

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            aria-expanded={isOpen}
            aria-controls={SIDEBAR_ID}
            className="-ml-2 rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/dashboard" className="text-2xl font-extrabold tracking-tight text-brand-500">
            Rightmo
          </Link>

          <div className="mx-6 hidden max-w-2xl flex-1 md:flex">{search}</div>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    active ? "text-brand-600" : "text-gray-700 hover:text-brand-500"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            {user && <span className="hidden max-w-40 truncate text-sm text-gray-600 lg:inline">{user.name}</span>}
            <LogoutButton />
          </div>
        </div>

        <div className="px-4 pb-3 md:hidden">{search}</div>
      </header>

      <Sidebar id={SIDEBAR_ID} isOpen={isOpen} onClose={close} />

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 md:py-6">{children}</main>
    </div>
  );
}
