import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Extra path prefixes that also mark this item active (e.g. product detail pages). */
  alsoMatches?: string[];
}

const iconProps = {
  className: "h-5 w-5 shrink-0",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.8,
  "aria-hidden": true,
} as const;

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Products",
    alsoMatches: ["/dashboard/products"],
    icon: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/categories",
    label: "Categories",
    icon: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h6v6H4zM14 6h6v6h-6zM4 16h6v4H4zM14 16h6v4h-6z" />
      </svg>
    ),
  },
];

const matchesPrefix = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** "/dashboard" matches only itself (plus alsoMatches); other items also match their sub-pages. */
export function isActive(pathname: string, item: Pick<NavItem, "href" | "alsoMatches">): boolean {
  const own = item.href === "/dashboard" ? pathname === item.href : matchesPrefix(pathname, item.href);
  return own || (item.alsoMatches ?? []).some((p) => matchesPrefix(pathname, p));
}
