"use client";

import { useToast } from "@/components/ui/Toast";
import { useCreateRating } from "@/hooks/useProducts";
import { RatingForm } from "./RatingForm";

/** Always available: a user can add as many reviews for a product as they like. */
export function WriteReview({ productId }: { productId: number }) {
  const create = useCreateRating(productId);
  const toast = useToast();

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-3 font-semibold text-gray-900">Write a review</h3>
      <RatingForm
        submitLabel="Submit review"
        isSaving={create.isPending}
        error={create.error}
        onSubmit={async (input) => {
          await create.mutateAsync(input);
          toast.success("Thanks! Your review was added.");
        }}
      />
    </div>
  );
}
