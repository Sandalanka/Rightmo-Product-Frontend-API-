const SIZES = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" };

/** Spinning ring in the current text colour. Pass a label when it is the only content (screen readers announce it). */
export function Spinner({ size = "sm", label, className = "" }: { size?: keyof typeof SIZES; label?: string; className?: string }) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZES[size]} ${className}`}
    />
  );
}
