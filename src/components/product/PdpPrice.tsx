"use client";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { discountPercent } from "@/components/ui/Price";
import { applyPackDiscount, getPackTier, type PackTier } from "@/content/site";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The markdown, as a small flat mark: one tint, one shape, no rotation, shadow
 * or hover — it is a label on the price (the struck compare-at beside it already
 * shows the money involved), not something to press.
 *
 * Two tones. `chip` is the filled tag for the roomy row; `plain` drops the fill
 * for the phone, where it sits on a meta line beside availability and two filled
 * chips side by side read as furniture rather than information.
 *
 * It lives outside `PdpPrice` so the buy panel can place it deliberately per
 * breakpoint instead of letting it fall wherever the price row happens to wrap.
 */
export function SaveChip({
  slug,
  tone = "chip",
  className,
}: {
  slug: string;
  tone?: "chip" | "plain";
  className?: string;
}) {
  const { amount, compareAtAmount, pending } = useStylePrice(slug);
  const percent = discountPercent(amount, compareAtAmount);
  if (pending || percent == null) return null;

  return (
    <span
      className={cn(
        "font-label text-[0.68rem] leading-none tracking-widest text-rose-700 uppercase",
        tone === "chip" && "rounded-tag bg-rose-100 px-2 py-1",
        className,
      )}
    >
      Save {percent}%
    </span>
  );
}

/**
 * The PDP hero price for one style — the price it was and the price it is — in
 * the shopper's selected currency (from Shopify) or the synced base price.
 * Updates instantly when the currency changes.
 *
 * `packSize` (from the pack picker below, lifted to the shared parent) applies
 * that tier's price here too, so the hero number always matches the total the
 * buy box is about to charge — picking the 3-pack shows the 3-pack's total up
 * top, not the single-unit price.
 *
 * The struck compare-at leads, so the row reads as a comparison, and the live
 * price carries the size. Both take `leading-none`: at their default line
 * heights the struck one's box hangs ~5px below the live one's, which drags any
 * bottom-aligned mark in the same row down with it.
 */
export function PdpPrice({
  slug,
  packSize = 1,
}: {
  slug: string;
  packSize?: PackTier["size"];
}) {
  const { amount, currencyCode, compareAtAmount, pending } =
    useStylePrice(slug);

  if (pending) {
    return (
      <div aria-label="Loading price" className="flex flex-col gap-3">
        <span
          aria-hidden="true"
          className="inline-block h-9 w-44 animate-pulse rounded-tag bg-hairline"
        />
        <span
          aria-hidden="true"
          className="inline-block h-4 w-28 animate-pulse rounded-pill bg-hairline/60"
        />
      </div>
    );
  }

  const tier = getPackTier(packSize);
  const { total: packTotal } = applyPackDiscount(amount, tier);
  // The "was" price scales with the pack too — comparing a 3-unit total
  // against a 1-unit compare-at would overstate the markdown.
  const compareAtTotal =
    compareAtAmount != null ? compareAtAmount * tier.size : null;

  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      {compareAtTotal != null && compareAtTotal > packTotal && (
        <span className="text-xl leading-none text-ink-faint line-through">
          {formatMoney(compareAtTotal, currencyCode)}
        </span>
      )}

      <span className="font-headline text-3xl leading-none font-bold tracking-tight text-ink sm:text-4xl">
        {formatMoney(packTotal, currencyCode)}
      </span>
    </p>
  );
}
