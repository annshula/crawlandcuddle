"use client";

import { useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/Button";
import { PromiseStrip } from "@/components/product/PromiseStrip";
import { Icon } from "@/components/ui/Icon";
import { product, type Variant } from "@/content/site";
import { formatMoney } from "@/lib/money";
import { shopifyCheckout } from "@/lib/shopify-checkout";

/**
 * Quantity + add-to-cart + buy-now for one style. Buy now adds the line and
 * goes straight to checkout; add-to-cart opens the drawer so the shopper can
 * keep browsing.
 */
export function BuyBox({ variant }: { variant: Variant }) {
  const { add } = useCart();
  const {
    amount: unitAmount,
    currencyCode,
    pending: pricePending,
  } = useStylePrice(variant.slug);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const handleAdd = () => {
    add(variant.slug, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const handleBuyNow = async () => {
    add(variant.slug, qty);
    if (buying) return;
    setBuying(true);
    setBuyError(null);
    const result = await shopifyCheckout([{ slug: variant.slug, qty }]);
    if (result.ok) {
      window.location.href = result.checkoutUrl;
      return;
    }
    setBuyError(result.error);
    setBuying(false);
  };

  return (
    <div className="mt-9">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-btn border border-hairline">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="grid size-12 cursor-pointer place-items-center text-ink transition-colors duration-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Icon name="minus" className="size-4" strokeWidth={2} />
          </button>
          <span
            aria-live="polite"
            aria-label={`Quantity ${qty}`}
            className="w-10 text-center font-headline text-lg text-ink"
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            disabled={qty >= 20}
            aria-label="Increase quantity"
            className="grid size-12 cursor-pointer place-items-center text-ink transition-colors duration-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Icon name="plus" className="size-4" strokeWidth={2} />
          </button>
        </div>

        <p className="text-body-sm text-ink-soft">
          Total{" "}
          <span className="font-headline text-ink">
            {pricePending ? (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-20 animate-pulse rounded-pill bg-hairline align-middle"
              />
            ) : (
              formatMoney(unitAmount * qty, currencyCode)
            )}
          </span>
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Magnetic strength={0.15} className="w-full sm:w-auto">
          <Button
            onClick={handleAdd}
            className="w-full justify-center sm:w-auto"
          >
            {added ? "Added to bag" : "Add to bag"}
          </Button>
        </Magnetic>
        <Button
          onClick={handleBuyNow}
          variant="outline"
          withArrow
          disabled={buying}
          className="w-full justify-center sm:w-auto"
        >
          {buying ? "Taking you to checkout…" : "Buy it now"}
        </Button>
      </div>

      {buyError && (
        <p className="mt-4 rounded-tag bg-rose-50 px-4 py-3 text-body-sm text-rose-700">
          {buyError}
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {added ? `${variant.name} added to your bag` : ""}
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
