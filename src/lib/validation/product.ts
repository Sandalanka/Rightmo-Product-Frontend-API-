/** Client-side checks that mirror ProductStoreRequest / ProductUpdateRequest / ProductImage*Request. */
export interface ProductFormValues extends Record<string, string> {
  name: string;
  category_id: string;
  price: string;
  description: string;
}

export const MAX_IMAGES = 10;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
const MAX_PRICE = 99_999_999.99;

export function validateProduct(values: ProductFormValues): Partial<Record<keyof ProductFormValues, string>> {
  const errors: Partial<Record<keyof ProductFormValues, string>> = {};
  const name = values.name.trim();
  if (!name) errors.name = "Name is required.";
  else if (name.length > 255) errors.name = "Name may not be longer than 255 characters.";

  if (!values.category_id) errors.category_id = "Please choose a category.";

  const price = values.price.trim();
  if (!price) errors.price = "Price is required.";
  else if (!/^\d+(\.\d{1,2})?$/.test(price)) errors.price = "Enter a valid price with up to 2 decimals.";
  else if (Number(price) > MAX_PRICE) errors.price = "Price is too large.";

  if (values.description.length > 5000) errors.description = "Description may not be longer than 5000 characters.";
  return errors;
}

/** Returns an error message for the first invalid file, or null when all are fine. */
export function validateImages(files: File[], existingCount = 0): string | null {
  if (existingCount + files.length > MAX_IMAGES) return `A product can have at most ${MAX_IMAGES} images.`;
  for (const file of files) {
    if (!IMAGE_TYPES.includes(file.type)) return `"${file.name}" must be a JPG, PNG or WEBP image.`;
    if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" is larger than 2 MB.`;
  }
  return null;
}
