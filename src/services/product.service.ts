import { ENDPOINTS, http as browserHttp, type Http } from "@/lib/api";
import { type ProductFilters, toApiParams } from "@/lib/products/filters";
import type { Category, Product, ProductImage, ProductInput, ProductPage } from "@/types/product";

// Axios would serialise FormData as JSON because the client defaults to application/json;
// multipart/form-data makes it send a real upload and let the browser add the boundary.
const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

function requireProduct(product: Product | undefined): Product {
  if (!product) throw new Error("Invalid response from server.");
  return product;
}

const EMPTY_PAGE: ProductPage = {
  products: [],
  pagination: { current_page: 1, last_page: 1, per_page: 0, total: 0, from: null, to: null },
};

export const createProductService = (http: Http) => ({
  async list(filters: ProductFilters, signal?: AbortSignal): Promise<ProductPage> {
    const res = await http.get<ProductPage>(ENDPOINTS.products.list, { params: toApiParams(filters), signal });
    return res.data ?? EMPTY_PAGE;
  },

  async get(id: number, signal?: AbortSignal): Promise<Product> {
    const res = await http.get<Product>(ENDPOINTS.products.detail(id), { signal });
    return requireProduct(res.data);
  },

  /** Creates the product with its images in one multipart request. */
  async create(input: ProductInput, images: File[] = []): Promise<Product> {
    const form = new FormData();
    form.append("name", input.name);
    form.append("category_id", String(input.category_id));
    form.append("price", input.price);
    if (input.description) form.append("description", input.description);
    images.forEach((file) => form.append("images[]", file));
    const res = await http.post<Product>(ENDPOINTS.products.list, form, MULTIPART);
    return requireProduct(res.data);
  },

  async update(id: number, input: Partial<ProductInput>): Promise<Product> {
    const res = await http.put<Product>(ENDPOINTS.products.detail(id), input);
    return requireProduct(res.data);
  },

  async remove(id: number): Promise<void> {
    await http.delete(ENDPOINTS.products.detail(id));
  },
});

export const createProductImageService = (http: Http) => ({
  async add(productId: number, files: File[]): Promise<ProductImage[]> {
    const form = new FormData();
    files.forEach((file) => form.append("images[]", file));
    const res = await http.post<{ images: ProductImage[] }>(ENDPOINTS.products.images(productId), form, MULTIPART);
    return res.data?.images ?? [];
  },

  /** PHP only parses multipart bodies on POST, so the PUT is sent as POST + _method (Laravel method spoofing). */
  async replace(productId: number, imageId: number, file: File): Promise<ProductImage> {
    const form = new FormData();
    form.append("_method", "PUT");
    form.append("image", file);
    const res = await http.post<ProductImage>(ENDPOINTS.products.image(productId, imageId), form, MULTIPART);
    if (!res.data) throw new Error("Invalid response from server.");
    return res.data;
  },

  async remove(productId: number, imageId: number): Promise<void> {
    await http.delete(ENDPOINTS.products.image(productId, imageId));
  },
});

export const createCategoryService = (http: Http) => ({
  async list(signal?: AbortSignal): Promise<Category[]> {
    const res = await http.get<{ categories: Category[] }>(ENDPOINTS.categories, { signal });
    return res.data?.categories ?? [];
  },
});

export const productService = createProductService(browserHttp);
export const productImageService = createProductImageService(browserHttp);
export const categoryService = createCategoryService(browserHttp);
