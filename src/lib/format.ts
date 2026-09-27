import { env } from "@/config/env";

const priceFormatter = new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Fixed time zone: the server and the browser must format dates identically for hydration.
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: env.timeZone,
});

/** "1999.5" -> "Rs. 1,999.50" */
export function formatPrice(value: string | number): string {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  return `${env.currencySymbol} ${priceFormatter.format(Number.isFinite(amount) ? amount : 0)}`;
}

/** ISO date -> "27 Sept 2026" */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}
