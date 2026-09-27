import type { PaginationMeta } from "./api";

export interface Category {
  id: number;
  name: string;
}

/** ProductListResource */
export interface ProductSummary {
  id: number;
  name: string;
  /** Decimal string from Laravel, e.g. "199.99" */
  price: string;
  average_rating: number;
  category_name?: string;
  image_url?: string | null;
}

export interface ProductImage {
  id: number;
  image_url: string;
}

/** ProductResource */
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  category_id: number;
  average_rating: number;
  ratings_count: number;
  category?: Category;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductPage {
  products: ProductSummary[];
  pagination: PaginationMeta;
}

/** ProductRatingResource */
export interface Rating {
  id: number;
  product_id: number;
  rating: number;
  comment: string | null;
  user?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface RatingPage {
  ratings: Rating[];
  pagination: PaginationMeta;
}

export interface RatingInput {
  rating: number;
  comment?: string | null;
}

/** Text fields of ProductStoreRequest / ProductUpdateRequest */
export interface ProductInput {
  name: string;
  category_id: number;
  price: string;
  description: string | null;
}
