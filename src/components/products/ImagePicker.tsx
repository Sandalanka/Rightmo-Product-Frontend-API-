"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { IMAGE_ACCEPT, MAX_IMAGES, validateImages } from "@/lib/validation/product";

interface ImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Images the product already has (edit mode), counted towards the limit. */
  existingCount?: number;
  label?: string;
}

/** Chooses new images with previews. Files are only uploaded by the parent. */
export function ImagePicker({ files, onChange, existingCount = 0, label = "Add images" }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const remaining = MAX_IMAGES - existingCount - files.length;

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again
    if (selected.length === 0) return;
    const problem = validateImages([...files, ...selected], existingCount);
    setError(problem);
    if (!problem) onChange([...files, ...selected]);
  };

  return (
    <div className="space-y-2">
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Selected images">
        {files.map((file, i) => (
          <li key={`${file.name}-${i}`} className="relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimise */}
            <img src={previews[i]} alt={file.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              aria-label={`Remove ${file.name}`}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/70 text-sm text-white hover:bg-gray-900"
            >
              ×
            </button>
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 text-xs text-gray-500 transition hover:border-brand-400 hover:text-brand-500"
            >
              <span className="text-2xl leading-none">+</span>
              {label}
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        onChange={handleSelect}
        className="sr-only"
        aria-label={label}
        tabIndex={-1}
      />
      <p className="text-xs text-gray-500">
        JPG, PNG or WEBP, up to 2 MB each. {Math.max(remaining, 0)} of {MAX_IMAGES} slots left.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
