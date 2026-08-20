/**
 * Client helper for kicking off a Shopify-hosted checkout from the current
 * bag. The actual Storefront cart is created server-side (no tokens in the
 * browser); this only calls the API route and navigates to the checkout URL.
 */

import { product, variants } from "@/content/site";
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
          return variant
            ? { slug: line.slug, name: variant.name, quantity: line.qty }
            : null;
        })
        .filter(
          (item): item is { slug: string; name: string; quantity: number } =>
            item !== null,
        );
      if (items.length > 0) {
        trackInitiateCheckout(items, product.priceCents, product.currency);
      }
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    return { ok: false, error: data.error ?? "We could not start checkout." };
  } catch {
    return { ok: false, error: "We could not reach checkout right now." };
  }
}
