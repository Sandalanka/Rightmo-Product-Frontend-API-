"use client";

import { useId, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StarInput } from "@/components/ui/StarInput";
import { toApiError } from "@/lib/api";
import type { RatingInput } from "@/types/product";

const MAX_COMMENT = 1000;

interface RatingFormProps {
  initial?: RatingInput;
  submitLabel: string;
  isSaving: boolean;
  error: unknown;
  onSubmit: (input: RatingInput) => Promise<unknown>;
  onCancel?: () => void;
}

/** Star + comment form used both to write a new review and to edit an existing one. */
export function RatingForm({ initial, submitLabel, isSaving, error, onSubmit, onCancel }: RatingFormProps) {
  const commentId = useId();
  const [stars, setStars] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [starsError, setStarsError] = useState<string>();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (stars < 1) return setStarsError("Please choose a star rating.");
    setStarsError(undefined);
    try {
      await onSubmit({ rating: stars, comment });
      if (!initial) {
        setStars(0);
        setComment("");
      }
    } catch {
      // shown from `error`
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <StarInput
        value={stars}
        onChange={(v) => {
          setStars(v);
          setStarsError(undefined);
        }}
        error={starsError}
      />
      <div>
        <label htmlFor={commentId} className="sr-only">
          Comment
        </label>
        <textarea
          id={commentId}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={3}
          placeholder="Share your thoughts about this product (optional)"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <p className="mt-1 text-right text-xs text-gray-500">
          {comment.length}/{MAX_COMMENT}
        </p>
      </div>
      <Alert message={error ? toApiError(error).message : null} />
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
