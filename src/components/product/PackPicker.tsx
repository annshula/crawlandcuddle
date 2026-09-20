"use client";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { Icon } from "@/components/ui/Icon";
import { applyPackDiscount, packTiers, type PackTier } from "@/content/site";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * "Buy more, save more" tile row — the single highest-leverage conversion
 * element on the page. Each tile is the SAME Shopify variant at qty 1/2/3
 * (see content/site.ts's packTiers doc comment) — CJ only ever fulfils more
 * units of the one mapped SKU, never a new product. Percent-off math here
 * mirrors the Shopify automatic discount that actually applies at checkout,
 * so the price shown always matches the price charged.
 *
 * Modeled after the classic 3-tile "quantity break" block (bestseller,
 * anchor-priced most-popular middle tile, value tier with a bonus) that
 * DTC PDPs use to lift AOV — the middle tile carries a "Most popular" flag
 * and a slightly heavier border so the eye lands there first.
 */
export function PackPicker({
  slug,
  selected,
  onSelect,
}: {
  slug: string;
  selected: PackTier["size"];
  onSelect: (size: PackTier["size"]) => void;
}) {
  const { amount: unitAmount, currencyCode, pending } = useStylePrice(slug);

  return (
    <div className="mt-7">
      <p className="eyebrow text-ink-faint">Choose your pack</p>
      <ul role="radiogroup" aria-label="Pack size" className="mt-3 grid gap-3 sm:grid-cols-3">
        {packTiers.map((tier) => {
          const isSelected = tier.size === selected;
          const { perUnit, total: discountedTotal } = applyPackDiscount(
            unitAmount,
            tier,
          );

          return (
            <li key={tier.size}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(tier.size)}
                className={cn(
                  "relative flex h-full w-full flex-col items-start gap-1 rounded-card border-2 px-4 py-3.5 text-left transition-colors duration-200",
                  isSelected
                    ? "border-rose-600 bg-rose-100"
                    : "border-hairline bg-cream hover:border-ink/30",
                )}
              >
                {tier.badge && (
                  <span
                    className={cn(
                      "absolute -top-2.5 left-3 rounded-tag px-2 py-0.5 font-label text-[0.6rem] tracking-widest uppercase",
                      isSelected
                        ? "bg-rose-600 text-paper"
                        : "bg-ink text-paper",
                    )}
                  >
                    {tier.badge}
                  </span>
                )}

                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-headline text-base text-ink">
                    {tier.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200",
                      isSelected
                        ? "border-rose-600 bg-rose-600"
                        : "border-hairline",
                    )}
                  >
                    {isSelected && (
                      <Icon
                        name="check"
                        className="size-3 text-paper"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                </span>

                <span className="text-body-sm text-ink-soft">
                  {tier.blurb}
                </span>

                <span className="mt-1.5 flex items-baseline gap-2">
                  {pending ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-5 w-20 animate-pulse rounded-pill bg-hairline"
                    />
                  ) : (
                    <>
                      <span className="font-headline text-lg text-ink tabular-nums">
                        {formatMoney(perUnit, currencyCode)}
                      </span>
                      <span className="text-body-sm text-ink-faint">
                        /unit
                      </span>
                    </>
                  )}
                </span>

                {tier.discountPercent > 0 && !pending && (
                  <span className="font-label text-[0.68rem] tracking-widest text-rose-700 uppercase">
                    {tier.shortLabel} · {formatMoney(discountedTotal, currencyCode)}{" "}
                    total
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
