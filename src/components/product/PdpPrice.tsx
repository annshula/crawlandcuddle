"use client";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { formatMoney } from "@/lib/money";

/**
 * The PDP hero price for one style — large display type, with the struck
 * compare-at — in the shopper's selected currency (from Shopify) or the
 * synced base price. Updates instantly when the currency changes.
 */
export function PdpPrice({ slug }: { slug: string }) {
  const { amount, currencyCode, compareAtAmount } = useStylePrice(slug);
  return (
    <>
      <p className="font-headline text-5xl leading-none font-bold tracking-tight text-ink">
        {formatMoney(amount, currencyCode)}
      </p>
      {compareAtAmount != null && compareAtAmount > amount && (
        <p className="text-body text-ink-faint line-through">
          {formatMoney(compareAtAmount, currencyCode)}
        </p>
      )}
    </>
  );
}
