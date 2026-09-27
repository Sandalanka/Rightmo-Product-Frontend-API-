"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";

/**
 * Daraz-style header search. Searching from the listing keeps the current
 * category/price/sort; searching from any other page starts a fresh listing.
 */
export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = pathname === "/dashboard" ? (searchParams.get("search") ?? "") : "";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = String(new FormData(e.currentTarget).get("search") ?? "").trim();
    const params = new URLSearchParams(pathname === "/dashboard" ? searchParams.toString() : "");
    if (query) params.set("search", query);
    else params.delete("search");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  };

  return (
    <form role="search" onSubmit={handleSubmit} className={`flex w-full ${className}`}>
      {/* key: reset the text when the URL's search changes (back button, "Clear all") */}
      <input
        key={current}
        name="search"
        type="search"
        defaultValue={current}
        placeholder="Search products"
        aria-label="Search products"
        maxLength={255}
        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-transparent bg-gray-100 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
      />
      <button type="submit" aria-label="Search" className="rounded-r-md bg-brand-500 px-4 text-white transition hover:bg-brand-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
        </svg>
      </button>
    </form>
  );
}
