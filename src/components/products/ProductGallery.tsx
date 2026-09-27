"use client";

import { useState } from "react";
import type { ProductImage as Img } from "@/types/product";
import { ProductImage } from "./ProductImage";

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = images.find((img) => img.id === activeId) ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
        <ProductImage src={active?.image_url} alt={name} eager sizes="(min-width: 768px) 40vw, 100vw" className="object-contain" />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveId(img.id)}
                aria-label={`Show image ${i + 1}`}
                aria-current={img.id === active?.id}
                className={`relative block h-16 w-16 overflow-hidden rounded border-2 ${
                  img.id === active?.id ? "border-brand-500" : "border-transparent hover:border-gray-300"
                }`}
              >
                <ProductImage src={img.image_url} alt="" sizes="64px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
