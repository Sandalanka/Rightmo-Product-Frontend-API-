const STAR_PATH =
  "M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z";

function Stars({ className }: { className: string }) {
  return (
    <span className={`flex ${className}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-full aspect-square shrink-0" fill="currentColor" aria-hidden>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

const SIZES = { sm: "h-3.5", md: "h-4", lg: "h-6" };

/** Read-only stars with partial fill (e.g. 3.7 fills 74%). */
export function StarRating({ value, size = "sm", count }: { value: number; size?: keyof typeof SIZES; count?: number }) {
  const clamped = Math.min(5, Math.max(0, value));
  return (
    <span className="inline-flex items-center gap-1">
      <span role="img" aria-label={`Rated ${clamped.toFixed(1)} out of 5`} className={`relative inline-block ${SIZES[size]}`}>
        <Stars className="h-full text-gray-300" />
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(clamped / 5) * 100}%` }}>
          <Stars className="h-full text-amber-400" />
        </span>
      </span>
      {count !== undefined && <span className="text-xs text-gray-500">({count})</span>}
    </span>
  );
}

export { STAR_PATH };
