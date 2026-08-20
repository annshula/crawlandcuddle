"use client";

import { useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { shopifyCheckout } from "@/lib/shopify-checkout";

/**
 * Minimal inline quantity + add-to-bag + buy-now for product cards — a clean,
 * compact purchase row that never takes focus away from the card.
 */
export function QuickBuy({ slug }: { slug: string }) {
  const { add, clear } = useCart();
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  const addToBag = () => add(slug, qty);

  const buyNow = async () => {
    if (buying) return;
    setBuying(true);
    const result = await shopifyCheckout([{ slug, qty }]);
    if (result.ok) {
      // The bag is now committed to Shopify's checkout — empty the local cart.
      clear();
      window.location.href = result.checkoutUrl;
      return;
    }
    setBuying(false);
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 items-center rounded-btn border border-hairline">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="grid size-9 cursor-pointer place-items-center text-ink transition-colors duration-200 hover:text-rose-600"
          >
            −
          </button>
          <span
            aria-live="polite"
            aria-label={`Quantity ${qty}`}
            className="w-7 text-center font-headline text-sm text-ink"
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            aria-label="Increase quantity"
            className="grid size-9 cursor-pointer place-items-center text-ink transition-colors duration-200 hover:text-rose-600"
          >
            +
          </button>
        </span>
        <button
          type="button"
          onClick={addToBag}
          className="flex h-9 flex-1 items-center justify-center rounded-btn bg-ink px-3 font-label text-[0.74rem] tracking-[0.14em] text-paper uppercase transition-colors duration-300 hover:bg-rose-600"
        >
          Add to bag
        </button>
      </div>
      <button
        type="button"
        onClick={buyNow}
        disabled={buying}
        className="flex h-9 w-full items-center justify-center rounded-btn border border-hairline font-label text-[0.74rem] tracking-[0.14em] text-ink uppercase transition-colors duration-300 hover:border-rose-400 hover:text-rose-600 disabled:opacity-60"
      >
        {buying ? "Opening…" : "Buy now"}
      </button>
    </div>
  );
}
