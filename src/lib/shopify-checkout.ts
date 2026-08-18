/**
 * Client helper for kicking off a Shopify-hosted checkout from the current
 * bag. The actual Storefront cart is created server-side (no tokens in the
 * browser); this only calls the API route and navigates to the checkout URL.
 */

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
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    return { ok: false, error: data.error ?? "We could not start checkout." };
  } catch {
    return { ok: false, error: "We could not reach checkout right now." };
  }
}
