"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** How long a toast stays on screen. */
export const TOAST_DURATION_MS = 4000;

const STYLES: Record<ToastType, { box: string; icon: string; path: string }> = {
  success: { box: "border-green-200 bg-green-50 text-green-800", icon: "text-green-600", path: "M5 13l4 4L19 7" },
  error: { box: "border-red-200 bg-red-50 text-red-800", icon: "text-red-600", path: "M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" },
};

function Toast({ toast, onClose }: { toast: ToastItem; onClose: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const style = STYLES[toast.type];

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${style.box}`}
    >
      <svg className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
      </svg>
      <p className="flex-1 font-medium">{toast.message}</p>
      <button type="button" onClick={() => onClose(toast.id)} aria-label="Dismiss notification" className="-m-1 rounded p-1 opacity-60 hover:opacity-100">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/** Toasts sit just below the dashboard header so they never cover it (taller below md, where search has its own row).
 *  Kept at the app root so they survive page navigation (e.g. "Product deleted" after redirecting). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback((type: ToastType, message: string) => {
    const id = ++nextId.current;
    // Newest on top, at most 3 on screen.
    setToasts((list) => [{ id, type, message }, ...list].slice(0, 3));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => show("success", m), error: (m) => show("error", m) }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-32 z-[60] md:top-20 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:w-96"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}
