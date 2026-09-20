"use client";

import { useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/Button";
import { PackPicker } from "@/components/product/PackPicker";
import { PromiseStrip } from "@/components/product/PromiseStrip";
import { Icon } from "@/components/ui/Icon";
import {
  applyPackDiscount,
  getPackTier,
  product,
  type PackTier,
  type Variant,
} from "@/content/site";
import { formatMoney } from "@/lib/money";
import { shopifyCheckout } from "@/lib/shopify-checkout";

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
 */
export function BuyBox({
  variant,
  packSize,
  onPackSizeChange,
}: {
  variant: Variant;
  packSize: PackTier["size"];
  onPackSizeChange: (size: PackTier["size"]) => void;
}) {
  const { add, clear } = useCart();
  const { show: showToast } = useToast();
  const {
    amount: unitAmount,
    currencyCode,
    pending: pricePending,
  } = useStylePrice(variant.slug);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const outOfStock = !variant.availableForSale;

  const tier = getPackTier(packSize);
  const { total: totalAmount } = applyPackDiscount(unitAmount, tier);

  const handleAdd = () => {
    // `replace: true` — picking a pack tile always sets the line to exactly
    // that tier's quantity, never adds on top of what's already there.
    // `openDrawer: false` — a toast confirms the add without pulling the
    // shopper out of the page into the full cart panel.
    add(variant.slug, packSize, true, false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
    showToast({
      title: `${tier.label} added to your bag`,
      description: `${variant.name} · ${formatMoney(totalAmount, currencyCode)}`,
      icon: "bag",
    });
  };

  const handleBuyNow = async () => {
    // No drawer/toast here — checkout redirect happens immediately after.
    add(variant.slug, packSize, true, false);
    if (buying) return;
    setBuying(true);
    setBuyError(null);
    const result = await shopifyCheckout([
      { slug: variant.slug, qty: packSize },
    ]);
    if (result.ok) {
      // The bag is now committed to Shopify's checkout — empty the local cart.
      clear();
      window.location.href = result.checkoutUrl;
      return;
    }
    setBuyError(result.error);
    setBuying(false);
  };

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
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
}
