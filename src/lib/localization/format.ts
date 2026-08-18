/**
 * Currency display names via the same ICU data `Intl.NumberFormat` uses —
 * never a hand-maintained list.
 */

const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });

export function currencyDisplayName(code: string): string {
  try {
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Preferred country for a currency when several share one (for the selector). */
export const CANONICAL_COUNTRY_BY_CURRENCY: Record<string, string> = {
  AUD: "AU",
  CAD: "CA",
  EUR: "DE",
  GBP: "GB",
  INR: "IN",
  JPY: "JP",
  NZD: "NZ",
  USD: "US",
};
