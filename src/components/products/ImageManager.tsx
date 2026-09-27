"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useProductImages } from "@/hooks/useProducts";
import { toApiError } from "@/lib/api";
import { IMAGE_ACCEPT, validateImages } from "@/lib/validation/product";
import type { ProductImage as Img } from "@/types/product";
import { ImagePicker } from "./ImagePicker";
import { ProductImage } from "./ProductImage";

/** Edit-mode image management: replace / remove existing images and upload new ones (saved immediately). */
export function ImageManager({ productId, images }: { productId: number; images: Img[] }) {
  const { add, replace, remove } = useProductImages(productId);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<number | null>(null);
  const toast = useToast();

  const run = async (imageId: number | null, action: () => Promise<unknown>, successMessage: string) => {
    setError(null);
    setBusyId(imageId);
    try {
      await action();
      toast.success(successMessage);
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReplaceFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const imageId = replaceTarget.current;
    if (!file || imageId === null) return;
    const problem = validateImages([file]);
    if (problem) return setError(problem);
    void run(imageId, () => replace.mutateAsync({ imageId, file }), "Image replaced.");
  };

  const upload = () => {
    const count = newFiles.length;
    return run(
      -1,
      async () => {
        await add.mutateAsync(newFiles);
        setNewFiles([]);
      },
      `${count} ${count === 1 ? "image" : "images"} uploaded.`,
    );
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Current images">
          {images.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-md border border-gray-200">
              <div className="relative aspect-square bg-gray-100">
                <ProductImage src={img.image_url} alt={`Image ${i + 1}`} sizes="200px" eager={i === 0} />
                {busyId === img.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-brand-600">
                    <Spinner size="md" label={`Updating image ${i + 1}`} />
                  </div>
                )}
              </div>
              <div className="flex divide-x divide-gray-200 border-t border-gray-200 text-xs">
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => {
                    replaceTarget.current = img.id;
                    replaceInput.current?.click();
                  }}
                  aria-label={`Replace image ${i + 1}`}
                  className="flex-1 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Replace
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => run(img.id, () => remove.mutateAsync(img.id), "Image removed.")}
                  aria-label={`Remove image ${i + 1}`}
                  className="flex-1 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input ref={replaceInput} type="file" accept={IMAGE_ACCEPT} onChange={handleReplaceFile} className="sr-only" aria-label="Replacement image" tabIndex={-1} />

      <ImagePicker files={newFiles} onChange={setNewFiles} existingCount={images.length} label="Add images" />
      {newFiles.length > 0 && (
        <Button type="button" size="sm" onClick={upload} isLoading={busyId === -1}>
          Upload {newFiles.length} {newFiles.length === 1 ? "image" : "images"}
        </Button>
      )}
      <Alert message={error} />
    </div>
  );
}
