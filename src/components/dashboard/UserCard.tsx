"use client";

import { useAuth } from "@/context/AuthContext";

/** Profile of the signed-in user, read from the saved session. */
export function UserCard() {
  const { user, isReady } = useAuth();

  if (!isReady) return <div className="h-32 animate-pulse rounded-xl bg-gray-200" />;
  if (!user) return null;

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
        {initial}
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-gray-900">{user.name}</p>
        <p className="truncate text-sm text-gray-500">{user.email}</p>
        <p className="mt-1 text-xs text-gray-400">Member since {new Date(user.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
