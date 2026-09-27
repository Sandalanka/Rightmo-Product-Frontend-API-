"use client";

import { useEffect, type ReactNode } from "react";

interface DrawerProps {
  id: string;
  label: string;
  isOpen: boolean;
  onClose: () => void;
  side?: "left" | "right";
  /** Extra classes for the wrapper, e.g. "md:hidden" to make it mobile-only. */
  className?: string;
  children: ReactNode;
}

/** Off-canvas panel with backdrop; closes on Escape / backdrop click and locks page scroll while open. */
export function Drawer({ id, label, isOpen, onClose, side = "left", className = "", children }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const position = side === "left" ? "left-0" : "right-0";
  const hidden = side === "left" ? "-translate-x-full" : "translate-x-full";

  return (
    <div className={className}>
      <div
        onClick={onClose}
        aria-hidden
        data-testid={`${id}-backdrop`}
        className={`fixed inset-0 z-40 bg-gray-900/50 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        id={id}
        aria-label={label}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-y-0 ${position} z-50 flex w-72 max-w-[85vw] flex-col bg-white transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0 shadow-xl" : hidden
        }`}
      >
        {children}
      </aside>
    </div>
  );
}
