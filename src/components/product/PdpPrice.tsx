"use client";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { discountPercent } from "@/components/ui/Price";
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
 * The struck compare-at leads, so the row reads as a comparison, and the live
 * price carries the size. Both take `leading-none`: at their default line
 * heights the struck one's box hangs ~5px below the live one's, which drags any
 * bottom-aligned mark in the same row down with it.
 */
export function PdpPrice({ slug }: { slug: string }) {
  const { amount, currencyCode, compareAtAmount, pending } =
    useStylePrice(slug);

  if (pending) {
    return (
      <div aria-label="Loading price" className="flex flex-col gap-3">
        <span
          aria-hidden="true"
          className="inline-block h-12 w-52 animate-pulse rounded-tag bg-hairline"
        />
        <span
          aria-hidden="true"
          className="inline-block h-4 w-28 animate-pulse rounded-pill bg-hairline/60"
        />
      </div>
    );
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      {compareAtAmount != null && compareAtAmount > amount && (
        <span className="text-2xl leading-none text-ink-faint line-through">
          {formatMoney(compareAtAmount, currencyCode)}
        </span>
      )}

      <span className="font-headline text-5xl leading-none font-bold tracking-tight text-ink">
        {formatMoney(amount, currencyCode)}
      </span>
    </p>
  );
}
