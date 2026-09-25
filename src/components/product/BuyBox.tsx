"use client";

import { forwardRef } from "react";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/Button";
import { PaymentIcons } from "@/components/product/PaymentIcons";
import { PromiseStrip } from "@/components/product/PromiseStrip";
import { type PackTier, type Variant } from "@/content/site";
import { usePurchaseActions } from "@/hooks/usePurchaseActions";

/**
 * Add-to-cart + buy-now for one style + pack tier. Every pack tier is the
 * SAME Shopify variant at cart-line qty 1/2/3 (see content/site.ts's
 * packTiers) — CJ fulfils N units of the one mapped SKU, no new product or
 * API call. Buy now adds the line and goes straight to checkout; add-to-cart
 * opens the drawer so the shopper can keep browsing.
 *
 * The pack picker itself (PackPicker) renders in ProductPurchase, above the
 * hero price — so the shopper picks a tier, sees the price update, then
 * reaches these buttons. `packSize` is still controlled by ProductPurchase
 * (not local state), so the hero price and this panel's own total always
 * agree on which tier is selected.
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
  }
>(function BuyBox({ variant, packSize }, ref) {
  const { amount: unitAmount, currencyCode } = useStylePrice(variant.slug);

  const {
    tier,
    added,
    buying,
    buyError,
    handleAdd,
    handleBuyNow,
    outOfStock,
  } = usePurchaseActions({ variant, packSize, unitAmount, currencyCode });

  return (
    <div className="mt-9">
      {outOfStock ? (
        <p className="mt-5 rounded-tag bg-hairline/50 px-4 py-3 text-body-sm text-ink-soft">
          This style is out of stock right now. Pick another style above, or
          check back soon.
        </p>
      ) : (
        <>
          <div ref={ref} className="mt-5 grid grid-cols-2 gap-3">
            <Magnetic strength={0.15} className="w-full">
              <Button
                onClick={handleAdd}
                variant="outline"
                className="w-full justify-center"
              >
                {added ? "Added to bag" : `Add to bag`}
              </Button>
            </Magnetic>
            <Button
              onClick={handleBuyNow}
              withArrow
              disabled={buying}
              className="w-full justify-center"
            >
              {buying ? "Taking you to checkout…" : "Buy it now"}
            </Button>
          </div>

          {/* Reassurance, directly under the CTA where a hesitating shopper's
              eye lands right after reading the buttons. The "sold" and
              rating pills already cover social proof, at the top of
              ProductPurchase — this shows how they'll actually pay. */}
          <PaymentIcons className="mt-4" />
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

      <PromiseStrip className="mt-7" />
    </div>
  );
});
