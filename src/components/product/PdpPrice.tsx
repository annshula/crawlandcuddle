"use client";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { discountPercent } from "@/components/ui/Price";
import { applyPackDiscount, getPackTier, type PackTier } from "@/content/site";
import { formatMoney } from "@/lib/money";

/**
 * The PDP hero price for one style — compact, one line where it fits: the
 * struck "was" price leads, then the live price carrying the size, then the
 * save badge trailing on the same baseline. That order (was → now → save%)
 * is the standard markdown read: it sets the anchor before the number that
 * beats it, so the live price reads as a deal instead of just a price. No
 * card chrome (border/background) — with stock status now living on the
 * Style row above, this block only ever needs to be the numbers themselves,
 * not a bordered panel hosting several pieces of unrelated meta. Updates
 * instantly when the currency changes.
 *
 * `packSize` (from the pack picker above, lifted to the shared parent)
 * applies that tier's price here too, so the number always matches the
 * total the buy box is about to charge, struck against the same compare-at
 * total the pack picker's tiles show.
 */
export function PdpPrice({
  slug,
  packSize = 1,
}: {
  slug: string;
  packSize?: PackTier["size"];
}) {
  const { amount, compareAtAmount, currencyCode, pending } =
    useStylePrice(slug);

  if (pending) {
    return (
      <div aria-label="Loading price">
        <span
          aria-hidden="true"
          className="inline-block h-8 w-36 animate-pulse rounded-tag bg-hairline"
        />
      </div>
    );
  }

  const tier = getPackTier(packSize);
  const { total: packTotal } = applyPackDiscount(amount, tier);
  // Same struck figure as the matching PackPicker tile: the compare-at price
  // for the whole pack, so the hero price and the tile never disagree. With
  // no compare-at price, multi-packs fall back to that many units at the
  // regular price; the 1-pack just shows its price.
  const compareAtTotal =
    compareAtAmount != null
      ? compareAtAmount * tier.size
      : tier.size > 1
        ? amount * tier.size
        : null;
  const percent = discountPercent(packTotal, compareAtTotal);

  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {compareAtTotal != null && compareAtTotal > packTotal && (
          <span className="font-headline text-[1.7rem] leading-none text-ink-faint line-through sm:text-[1.6rem]">
            {formatMoney(compareAtTotal, currencyCode)}
          </span>
        )}
        <span className="font-headline text-[2rem] leading-none font-bold tracking-tight text-ink sm:text-3xl">
          {formatMoney(packTotal, currencyCode)}
        </span>
        {percent != null && (
          <span className="self-center rounded-tag bg-rose-600 px-2 py-1 font-label text-[0.64rem] leading-none tracking-widest text-paper uppercase">
            Save {percent}%
          </span>
        )}
      </p>
    </div>
  );
}
