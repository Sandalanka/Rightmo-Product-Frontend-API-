"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { useCategories } from "@/hooks/useProducts";

export function CategoryGrid() {
  const { data, isPending, isError, error } = useCategories();

  if (isError) return <Alert message={error.message} />;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {isPending
        ? Array.from({ length: 5 }, (_, i) => <li key={i} className="h-24 animate-pulse rounded-md bg-gray-200" />)
        : data.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard?category=${c.id}`}
                className="flex h-24 items-center justify-center rounded-md bg-white p-3 text-center font-medium text-gray-800 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:text-brand-600 hover:shadow-md"
              >
                {c.name}
              </Link>
            </li>
          ))}
    </ul>
  );
}
