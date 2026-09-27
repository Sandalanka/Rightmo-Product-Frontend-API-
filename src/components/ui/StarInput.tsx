"use client";

import { useState } from "react";
import { STAR_PATH } from "./StarRating";

const LABELS = ["Very poor", "Poor", "Average", "Good", "Excellent"];

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

/** Accessible 1–5 star picker (radio group; arrow keys work via native radios). */
export function StarInput({ value, onChange, error }: StarInputProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div>
      <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {LABELS.map((label, i) => {
          const star = i + 1;
          return (
            <label key={star} className="cursor-pointer" onMouseEnter={() => setHover(star)}>
              <input
                type="radio"
                name="rating"
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""} – ${label}`}
                className="peer sr-only"
              />
              <svg
                viewBox="0 0 20 20"
                aria-hidden
                className={`h-8 w-8 rounded transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 ${
                  star <= shown ? "text-amber-400" : "text-gray-300"
                }`}
                fill="currentColor"
              >
                <path d={STAR_PATH} />
              </svg>
            </label>
          );
        })}
        <span className="ml-2 text-sm text-gray-600">{shown ? LABELS[shown - 1] : "Select a rating"}</span>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
