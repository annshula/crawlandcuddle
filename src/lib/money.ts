import { productCurrency } from "@/lib/catalog";

/** Formats a Shopify MoneyV2 amount (string) or a number into a price string. */
export function formatMoney(
  amount: string | number | null | undefined,
  currency: string = productCurrency,
  locale = "en-US",
): string {
  if (amount == null || Number.isNaN(Number(amount))) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
  }).format(Number(amount));
}

export function shortDate(
  iso: string | null | undefined,
  locale = "en-US",
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
