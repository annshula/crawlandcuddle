"use client";

import { useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { applyPackDiscount, getPackTier, type Variant } from "@/content/site";
import { formatMoney } from "@/lib/money";
import { shopifyCheckout } from "@/lib/shopify-checkout";

/**
 * Add-to-bag / buy-now behaviour for one style + pack tier, shared by BuyBox
 * and the sticky bottom bar so both call the exact same logic — no risk of
 * one drifting from the other (different toast copy, different checkout
 * line, etc). `unitAmount`/`currencyCode` come from the caller's own
 * `useStylePrice` so this hook doesn't re-fetch localized pricing itself.
 */
export function usePurchaseActions({
  variant,
  packSize,
  unitAmount,
  currencyCode,
}: {
  variant: Variant;
  packSize: 1 | 2 | 3;
  unitAmount: number;
  currencyCode: string;
}) {
  const { add, clear } = useCart();
  const { show: showToast } = useToast();
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

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
    const result = await shopifyCheckout([{ slug: variant.slug, qty: packSize }]);
    if (result.ok) {
      // The bag is now committed to Shopify's checkout — empty the local cart.
      clear();
      window.location.href = result.checkoutUrl;
      return;
    }
    setBuyError(result.error);
    setBuying(false);
  };

  return {
    tier,
    totalAmount,
    added,
    buying,
    buyError,
    handleAdd,
    handleBuyNow,
    outOfStock: !variant.availableForSale,
  };
}
