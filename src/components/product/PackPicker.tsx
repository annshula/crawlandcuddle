"use client";

import { useState } from "react";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { discountPercent } from "@/components/ui/Price";
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
  const {
    amount: unitAmount,
    compareAtAmount,
    currencyCode,
    pending,
  } = useStylePrice(slug);

  // Which tile's gift tooltip is open — click-toggled so it works on touch;
  // CSS `group-hover` still reveals it on a mouse without a click.
  const [giftOpenSize, setGiftOpenSize] = useState<PackTier["size"] | null>(
    null,
  );

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
          // The 1-pack shows the product's own markdown (against its real
          // compare-at price). The 2/3-packs show just the pack discount
          // itself — against buying that many units individually at the
          // regular selling price (unitAmount), not against the compare-at
          // price stacked up, which would double-count the base markdown on
          // top of the pack discount and overstate the save %.
          const savePercent = discountPercent(
            discountedTotal,
            tier.size === 1
              ? compareAtAmount
              : unitAmount * tier.size,
          );

          return (
            <li key={tier.size} className="relative">
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(tier.size)}
                className={cn(
                  "relative flex h-full w-full flex-col items-start gap-1 rounded-card border-2 px-4 py-3.5 text-left transition-colors duration-200",
                  tier.includesGift && "pb-4",
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
                  <span className="min-w-0 font-headline text-base text-ink">
                    <span className="wrap-break-word">{tier.label}</span>
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

                {!pending && savePercent != null && (
                  <span className="font-label text-[0.68rem] tracking-widest text-rose-700 uppercase">
                    Save {savePercent}%
                  </span>
                )}
              </button>

              {tier.includesGift && (
                <div
                  className="group/gift absolute right-2.5 bottom-2.5 z-10"
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setGiftOpenSize(null);
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setGiftOpenSize((v) =>
                        v === tier.size ? null : tier.size,
                      )
                    }
                    aria-expanded={giftOpenSize === tier.size}
                    aria-label="Includes a free gift — show details"
                    className="grid size-6 place-items-center text-rose-600 transition-colors duration-200 hover:text-rose-700"
                  >
                    <Icon
                      name="gift"
                      className="size-4 animate-shake"
                      strokeWidth={2.2}
                    />
                  </button>

                  <div
                    role="tooltip"
                    className={cn(
                      "absolute right-0 bottom-full mb-2 w-max max-w-48 rounded-tag border border-rose-200 bg-rose-50 px-3 py-2 text-body-sm text-rose-700 shadow-drift transition-opacity duration-150 group-hover/gift:opacity-100",
                      giftOpenSize === tier.size
                        ? "opacity-100"
                        : "pointer-events-none opacity-0",
                    )}
                  >
                    Free gift: anti-slip socks included
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
