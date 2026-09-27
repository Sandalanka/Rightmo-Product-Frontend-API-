"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

type Product = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ products: Product[] }>("/products", { params: { limit: 12 } })
      .then((res) => setProducts(res.data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Products</h1>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border p-4 shadow-sm transition hover:shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumbnail} alt={p.title} className="mb-3 h-40 w-full rounded-lg object-cover" />
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-blue-600">${p.price}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
