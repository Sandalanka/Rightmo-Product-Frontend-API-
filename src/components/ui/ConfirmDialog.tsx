"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, children, confirmLabel = "Delete", isLoading, error, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the safe option, close on Escape.
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !isLoading && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-4 sm:items-center" onClick={() => !isLoading && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        {children && <div className="mt-2 text-sm text-gray-600">{children}</div>}
        {error && (
          <div className="mt-3">
            <Alert message={error} />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
