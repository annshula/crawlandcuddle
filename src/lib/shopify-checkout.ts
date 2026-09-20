/**
 * Client helper for kicking off a Shopify-hosted checkout from the current
 * bag. The actual Storefront cart is created server-side (no tokens in the
 * browser); this only calls the API route and navigates to the checkout URL.
 */

import { applyPackDiscount, getPackTier, product, variants } from "@/content/site";
import { trackInitiateCheckout } from "@/lib/analytics";

export type ShopifyCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function shopifyCheckout(
  lines: Array<{ slug: string; qty: number }>,
): Promise<ShopifyCheckoutResult> {
  try {
    const res = await fetch("/api/shopify/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      checkoutUrl?: string;
      error?: string;
    };
    if (data.ok && data.checkoutUrl) {
      const items = lines
        .map((line) => {
          const variant = variants.find((v) => v.slug === line.slug);
          if (!variant) return null;
          // Each line's own pack tier (derived from its qty), so a cart
          // mixing tiers reports the real discounted price per line rather
          // than full price for everything.
          const { perUnit } = applyPackDiscount(
            product.priceCents / 100,
            getPackTier(line.qty),
          );
          return {
            slug: line.slug,
            name: variant.name,
            quantity: line.qty,
            priceCents: Math.round(perUnit * 100),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      if (items.length > 0) {
        trackInitiateCheckout(items, product.currency);
      }
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    return { ok: false, error: data.error ?? "We could not start checkout." };
  } catch {
    return { ok: false, error: "We could not reach checkout right now." };
  }
}
