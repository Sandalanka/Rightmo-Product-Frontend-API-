import { getPageItems } from "@/lib/products/filters";

interface PaginationProps {
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  label?: string;
}

const base = "flex h-9 min-w-9 items-center justify-center rounded border px-2 text-sm transition";

export function Pagination({ page, lastPage, onPageChange, label = "Pagination" }: PaginationProps) {
  if (lastPage <= 1) return null;

  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${base} border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-500 disabled:pointer-events-none disabled:opacity-40`}
      >
        ‹
      </button>
      {getPageItems(page, lastPage).map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-gray-500" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={`${base} ${
              item === page
                ? "border-brand-600 bg-brand-600 font-semibold text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-500"
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= lastPage}
        aria-label="Next page"
        className={`${base} border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-500 disabled:pointer-events-none disabled:opacity-40`}
      >
        ›
      </button>
    </nav>
  );
}
