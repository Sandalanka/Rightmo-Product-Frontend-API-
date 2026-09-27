"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useCategories, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useForm } from "@/hooks/useForm";
import { type ProductFormValues, validateProduct } from "@/lib/validation/product";
import type { Product, ProductInput } from "@/types/product";
import { ImageManager } from "./ImageManager";
import { ImagePicker } from "./ImagePicker";

const toInput = (v: ProductFormValues): ProductInput => ({
  name: v.name.trim(),
  category_id: Number(v.category_id),
  price: v.price.trim(),
  description: v.description.trim() || null,
});

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-md bg-white p-4 shadow-sm md:p-6">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Create (no product) or edit (with product) form. */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const categories = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct(product?.id ?? 0);
  const [images, setImages] = useState<File[]>([]);
  const isEdit = Boolean(product);
  const toast = useToast();
  // Keeps the save button spinning until the product page has loaded, not just until the API answers.
  const [isNavigating, startTransition] = useTransition();

  const { values, errors, formError, isSubmitting, handleChange, handleSubmit } = useForm<ProductFormValues>({
    initialValues: {
      name: product?.name ?? "",
      category_id: product ? String(product.category_id) : "",
      price: product?.price ?? "",
      description: product?.description ?? "",
    },
    validate: validateProduct,
    onSubmit: async (v) => {
      const saved = product ? await update.mutateAsync(toInput(v)) : await create.mutateAsync({ input: toInput(v), images });
      toast.success(product ? "Product updated successfully." : "Product added successfully.");
      startTransition(() => router.push(`/dashboard/products/${saved.id}`));
    },
  });

  const cancelHref = product ? `/dashboard/products/${product.id}` : "/dashboard";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Section title="Product details">
          <Alert message={formError} />
          <Input label="Product name" name="name" value={values.name} onChange={handleChange} error={errors.name} maxLength={255} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              name="category_id"
              value={values.category_id}
              onChange={handleChange}
              error={errors.category_id}
              placeholder={categories.isPending ? "Loading…" : "Select a category"}
              options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
            <Input label="Price (Rs.)" name="price" inputMode="decimal" placeholder="0.00" value={values.price} onChange={handleChange} error={errors.price} />
          </div>
          <Textarea
            label="Description"
            name="description"
            rows={5}
            maxLength={5000}
            value={values.description}
            onChange={handleChange}
            error={errors.description}
            hint={`${values.description.length}/5000`}
          />
        </Section>

        {!isEdit && (
          <Section title="Images" description="The first image is shown on the product card.">
            <ImagePicker files={images} onChange={setImages} />
          </Section>
        )}
      </form>

      {product && (
        <Section title="Images" description="Image changes are saved straight away.">
          <ImageManager productId={product.id} images={product.images} />
        </Section>
      )}

      <div className="sticky bottom-0 -mx-3 flex justify-end gap-2 border-t border-gray-200 bg-white/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <Link href={cancelHref} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Cancel
        </Link>
        <Button type="submit" form="product-form" isLoading={isSubmitting || isNavigating}>
          {isEdit ? "Save changes" : "Add product"}
        </Button>
      </div>
    </div>
  );
}
