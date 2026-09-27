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

import type { Category, Product, ProductSummary, Rating } from "@/types/product";

export const categories: Category[] = [
  { id: 1, name: "Electronics" },
  { id: 3, name: "Books" },
];

export const productSummary = (overrides: Partial<ProductSummary> = {}): ProductSummary => ({
  id: 26,
  name: "Wireless Headphones",
  price: "1999.50",
  average_rating: 4.5,
  category_name: "Electronics",
  image_url: "http://localhost:8089/storage/products/a.jpg",
  ...overrides,
});

export const pagination = (current_page = 1, last_page = 1, total = 1) => ({
  current_page,
  last_page,
  per_page: 12,
  total,
  from: total ? 1 : null,
  to: total ? total : null,
});

export const product: Product = {
  id: 26,
  name: "Wireless Headphones",
  description: "Noise cancelling over-ear headphones.",
  price: "1999.50",
  category_id: 1,
  average_rating: 4.3,
  ratings_count: 3,
  category: { id: 1, name: "Electronics" },
  images: [
    { id: 1, image_url: "http://localhost:8089/storage/products/a.jpg" },
    { id: 2, image_url: "http://localhost:8089/storage/products/b.jpg" },
  ],
  created_at: "2026-09-27T04:12:49.000000Z",
  updated_at: "2026-09-27T04:12:49.000000Z",
};

export const rating = (overrides: Partial<Rating> = {}): Rating => ({
  id: 100,
  product_id: 26,
  rating: 4,
  comment: "Great sound",
  user: { id: 99, name: "Someone Else" },
  created_at: "2026-09-20T10:00:00.000000Z",
  updated_at: "2026-09-20T10:00:00.000000Z",
  ...overrides,
});

export const imageFile = (name = "photo.png", type = "image/png", bytes = 1024) =>
  new File([new Uint8Array(bytes)], name, { type });

/** FormData -> { key: value | value[] } for easy assertions (Files become their names). */
export function formDataToObject(data: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  data.forEach((value, key) => {
    const v = value instanceof File ? value.name : value;
    out[key] = key in out ? [...([] as unknown[]).concat(out[key]), v] : v;
  });
  return out;
}
