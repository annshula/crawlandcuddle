"use client";

import { forwardRef } from "react";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/Button";
import { PackPicker } from "@/components/product/PackPicker";
import { PromiseStrip } from "@/components/product/PromiseStrip";
import { Icon } from "@/components/ui/Icon";
import { product, type PackTier, type Variant } from "@/content/site";
import { usePurchaseActions } from "@/hooks/usePurchaseActions";
import { formatMoney } from "@/lib/money";

/**
 * Pack picker + add-to-cart + buy-now for one style. Every pack tier is the
 * SAME Shopify variant at cart-line qty 1/2/3 (see content/site.ts's
 * packTiers) — CJ fulfils N units of the one mapped SKU, no new product or
 * API call. Buy now adds the line and goes straight to checkout; add-to-cart
 * opens the drawer so the shopper can keep browsing.
 *
 * `packSize`/`onPackSizeChange` are controlled by the parent (ProductPurchase)
 * rather than local state, so the hero price at the top of the page and this
 * panel's own total always agree on which tier is selected.
 *
 * Forwards its root ref so ProductPurchase can watch when this panel's own
 * CTA row scrolls out of view and show the sticky bottom bar in its place
 * (StickyBuyBar) — the same add/buy-now logic (usePurchaseActions), just in
 * a compact floating strip once this one is out of sight.
 */
export const BuyBox = forwardRef<
  HTMLDivElement,
  {
    variant: Variant;
    packSize: PackTier["size"];
    onPackSizeChange: (size: PackTier["size"]) => void;
  }
>(function BuyBox({ variant, packSize, onPackSizeChange }, ref) {
  const {
    amount: unitAmount,
    currencyCode,
    pending: pricePending,
  } = useStylePrice(variant.slug);

  const {
    tier,
    totalAmount,
    added,
    buying,
    buyError,
    handleAdd,
    handleBuyNow,
    outOfStock,
  } = usePurchaseActions({ variant, packSize, unitAmount, currencyCode });

  return (
    <div className="mt-9">
      <PackPicker
        slug={variant.slug}
        selected={packSize}
        onSelect={onPackSizeChange}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-tag bg-hairline/40 px-4 py-3">
        <p className="text-body-sm text-ink-soft">
          {tier.includesGift ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="gift" className="size-3.5 text-rose-600" />
              Includes a free gift
            </span>
          ) : (
            "Order total"
          )}
        </p>
        <p className="font-headline text-lg text-ink">
          {pricePending ? (
            <span
              aria-hidden="true"
              className="inline-block h-5 w-20 animate-pulse rounded-pill bg-hairline align-middle"
            />
          ) : (
            formatMoney(totalAmount, currencyCode)
          )}
        </p>
      </div>

      {outOfStock ? (
        <p className="mt-5 rounded-tag bg-hairline/50 px-4 py-3 text-body-sm text-ink-soft">
          This style is out of stock right now. Pick another style above, or
          check back soon.
        </p>
      ) : (
        <>
          <div
            ref={ref}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <Magnetic strength={0.15} className="w-full sm:w-auto">
              <Button
                onClick={handleAdd}
                variant="outline"
                className="w-full justify-center sm:w-auto"
              >
                {added ? "Added to bag" : `Add to bag`}
              </Button>
            </Magnetic>
            <Button
              onClick={handleBuyNow}
              withArrow
              disabled={buying}
              className="w-full justify-center sm:w-auto"
            >
              {buying ? "Taking you to checkout…" : "Buy it now"}
            </Button>
          </div>

          {/* Reassurance, directly under the CTA where a hesitating shopper's
              eye lands right after reading the buttons. The "sold" and
              rating pills already cover social proof, at the top of
              ProductPurchase — this only adds the checkout-trust line. */}
          <p className="mt-4 inline-flex items-center gap-1.5 text-body-sm text-ink-soft">
            <Icon name="shield" className="size-3.5 text-rose-600" />
            Secure checkout · 30-day money-back guarantee
          </p>
        </>
      )}

      {buyError && (
        <p className="mt-4 rounded-tag bg-rose-50 px-4 py-3 text-body-sm text-rose-700">
          {buyError}
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {added
          ? `${variant.name} (${tier.label}, ${tier.size} ${tier.size === 1 ? "unit" : "units"}) added to your bag`
          : ""}
      </p>

      <PromiseStrip className="mt-7 border-t border-hairline pt-6" />

      <ul className="mt-7 flex flex-col gap-2.5">
        {product.includes.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-body-sm text-ink-soft"
          >
            <Icon
              name="check"
              className="mt-0.5 size-4 shrink-0 text-rose-600"
              strokeWidth={2.2}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
});
