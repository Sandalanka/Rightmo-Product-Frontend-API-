"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  sizes: string;
  /** Above-the-fold image (likely LCP): load immediately with high priority instead of lazily. */
  eager?: boolean;
  className?: string;
}

/** Fills its (relative, sized) parent. Falls back to a placeholder when there is no image or it fails to load. */
export function ProductImage({ src, alt, sizes, eager = false, className = "object-cover" }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div role="img" aria-label={alt} className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-300">
        <svg className="h-1/3 w-1/3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16l5-5 4 4 3-3 6 6M3 5h18v14H3zM15.5 8.5h.01"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
