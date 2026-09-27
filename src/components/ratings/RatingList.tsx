"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { StarRating } from "@/components/ui/StarRating";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { useDeleteRating, useProductRatings, useUpdateRating } from "@/hooks/useProducts";
import { toApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Rating } from "@/types/product";
import { RatingForm } from "./RatingForm";

type Mode = { type: "view" } | { type: "edit"; id: number } | { type: "confirm-delete"; id: number };

function ReviewItem({
  review,
  isMine,
  mode,
  setMode,
  productId,
}: {
  review: Rating;
  isMine: boolean;
  mode: Mode;
  setMode: (mode: Mode) => void;
  productId: number;
}) {
  const update = useUpdateRating(productId);
  const remove = useDeleteRating(productId);
  const toast = useToast();
  const isEditing = mode.type === "edit" && mode.id === review.id;
  const isConfirming = mode.type === "confirm-delete" && mode.id === review.id;
  const edited = review.updated_at !== review.created_at;

  if (isEditing) {
    return (
      <li className="py-4 first:pt-0" aria-label="Editing your review">
        <RatingForm
          initial={{ rating: review.rating, comment: review.comment }}
          submitLabel="Save review"
          isSaving={update.isPending}
          error={update.error}
          onSubmit={async (input) => {
            await update.mutateAsync({ ratingId: review.id, input });
            toast.success("Your review was updated.");
            setMode({ type: "view" });
          }}
          onCancel={() => setMode({ type: "view" })}
        />
      </li>
    );
  }

  return (
    <li className="py-4 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StarRating value={review.rating} />
        <span className="text-xs text-gray-500">
          {formatDate(review.created_at)}
          {edited && " · edited"}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        by {review.user?.name ?? "Anonymous"}
        {isMine && <span className="ml-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">You</span>}
      </p>
      {review.comment && <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{review.comment}</p>}

      {isMine && (
        <div className="mt-2">
          {isConfirming ? (
            <div className="flex flex-wrap items-center gap-2 rounded bg-red-50 p-3">
              <span className="text-sm text-red-700">Delete this review?</span>
              <Button
                variant="danger"
                size="sm"
                isLoading={remove.isPending}
                onClick={() =>
                  remove.mutate(review.id, {
                    onSuccess: () => {
                      toast.success("Your review was deleted.");
                      setMode({ type: "view" });
                    },
                  })
                }
              >
                Yes, delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setMode({ type: "view" })} disabled={remove.isPending}>
                Keep it
              </Button>
              {remove.error && <p className="w-full text-sm text-red-700">{toApiError(remove.error).message}</p>}
            </div>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setMode({ type: "edit", id: review.id })} aria-label="Edit review">
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => setMode({ type: "confirm-delete", id: review.id })}
                aria-label="Delete review"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function RatingList({ productId }: { productId: number }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>({ type: "view" });
  const { data, isPending, isError, error, isFetching } = useProductRatings(productId, page);

  if (isPending) {
    return (
      <div className="space-y-3" aria-label="Loading reviews">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    );
  }
  if (isError) return <Alert message={error.message} />;

  // Deleting the last review on a page leaves it empty; step back a page.
  if (data.ratings.length === 0 && page > 1) {
    setPage(page - 1);
    return null;
  }
  if (data.ratings.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">No reviews yet. Be the first to review this product!</p>;
  }

  return (
    <div className="space-y-4">
      <ul className={`divide-y divide-gray-100 transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-label="Reviews">
        {data.ratings.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            isMine={Boolean(user && review.user?.id === user.id)}
            mode={mode}
            setMode={setMode}
            productId={productId}
          />
        ))}
      </ul>
      <Pagination
        page={data.pagination.current_page}
        lastPage={data.pagination.last_page}
        onPageChange={(p) => {
          setMode({ type: "view" });
          setPage(p);
        }}
        label="Reviews pagination"
      />
    </div>
  );
}
