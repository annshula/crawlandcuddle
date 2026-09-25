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
 * total the buy box is about to charge. The per-unit breakdown lives on the
 * pack picker's own tiles, not repeated here — this stays just the total.
 */
export function PdpPrice({
  slug,
  packSize = 1,
}: {
  slug: string;
  packSize?: PackTier["size"];
}) {
  const { amount, currencyCode, pending } = useStylePrice(slug);

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
  // Pack 1 has no bundle discount to show off — its own compare-at markdown
  // reads as a generic "sale price" rather than a reason to pick a bigger
  // pack, so the struck price is hidden there and shown only for 2/3-packs,
  // where it isolates just the pack discount (that many units at the
  // regular selling price — `amount` — not the compare-at price stacked up,
  // which would overstate the save %).
  const compareAtTotal = tier.size === 1 ? null : amount * tier.size;
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
