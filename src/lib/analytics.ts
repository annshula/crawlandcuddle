"use client";

/**
 * Client-side analytics helpers — one call fires the matching event to every
 * configured provider (Meta Pixel via `fbq`, Google Analytics 4 via `gtag`,
 * TikTok Pixel via `ttq`).
 *
 * No provider is ever required: the snippets in MetaPixel / GoogleAnalytics /
 * TikTokPixel only install `window.fbq` / `window.gtag` / `window.ttq` when
 * their env var is set, so the optional calls below are silent no-ops on
 * local runs and previews without the ids. Event names are each platform's
 * own standard ecommerce vocabulary so all three line up on the same funnel.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: {
      page: (...args: unknown[]) => void;
      track: (...args: unknown[]) => void;
    };
  }
}

/** A catalogue line as both pixels understand it. */
export type AnalyticsItem = {
  slug: string;
  name: string;
  quantity?: number;
};

/** A checkout line — its own discounted per-unit price, since a multi-line cart can mix pack tiers at different % off. */
export type CheckoutAnalyticsItem = AnalyticsItem & {
  priceCents: number;
};

/** priceCents (int) + quantity → the amount the shopper pays, in the unit currency. */
function centsToValue(priceCents: number, quantity = 1): number {
  return Math.round(priceCents * quantity) / 100;
}

function fbq(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, data);
}

function gtag(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, params);
}

function ttq(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.ttq?.track(event, data);
}

/** GA4 enhanced-ecommerce item array, one flat price for every item. */
function toGtagItems(items: AnalyticsItem[], priceCents: number) {
  return items.map((item) => ({
    item_id: item.slug,
    item_name: item.name,
    price: priceCents / 100,
    quantity: item.quantity ?? 1,
  }));
}

/** Same shape, each item priced at its own per-unit cents — for a cart whose lines can be at different pack-discount tiers. */
function toGtagItemsPerLine(items: CheckoutAnalyticsItem[]) {
  return items.map((item) => ({
    item_id: item.slug,
    item_name: item.name,
    price: item.priceCents / 100,
    quantity: item.quantity ?? 1,
  }));
}

/** Product page view — Meta `ViewContent`, GA4 `view_item`. */
export function trackViewContent(
  item: AnalyticsItem,
  priceCents: number,
  currency: string,
) {
  const value = centsToValue(priceCents, item.quantity ?? 1);
  fbq("ViewContent", {
    content_type: "product",
    content_ids: [item.slug],
    content_name: item.name,
    currency,
    value,
  });
  gtag("view_item", {
    currency,
    value,
    items: toGtagItems([item], priceCents),
  });
}

/** Item added to the bag — Meta `AddToCart`, GA4 `add_to_cart`. */
export function trackAddToCart(
  item: AnalyticsItem,
  priceCents: number,
  currency: string,
) {
  const value = centsToValue(priceCents, item.quantity ?? 1);
  fbq("AddToCart", {
    content_type: "product",
    content_ids: [item.slug],
    content_name: item.name,
    currency,
    value,
  });
  gtag("add_to_cart", {
    currency,
    value,
    items: toGtagItems([item], priceCents),
  });
  ttq("AddToCart", {
    content_type: "product",
    content_id: item.slug,
    content_name: item.name,
    quantity: item.quantity ?? 1,
    currency,
    value,
  });
}

/**
 * Checkout started — Meta `InitiateCheckout`, GA4 `begin_checkout`. Each item
 * carries its own already-discounted per-unit `priceCents`, so a cart mixing
 * pack tiers (e.g. one style at the 2-pack price, another at the 3-pack
 * price) reports the real amount the shopper is about to pay, not full price
 * × quantity for every line.
 */
export function trackInitiateCheckout(
  items: CheckoutAnalyticsItem[],
  currency: string,
) {
  const value =
    items.reduce(
      (sum, item) => sum + item.priceCents * (item.quantity ?? 1),
      0,
    ) / 100;
  fbq("InitiateCheckout", {
    content_type: "product",
    content_ids: items.map((item) => item.slug),
    num_items: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    currency,
    value,
  });
  gtag("begin_checkout", {
    currency,
    value,
    items: toGtagItemsPerLine(items),
  });
  ttq("InitiateCheckout", {
    content_type: "product",
    contents: items.map((item) => ({
      content_id: item.slug,
      content_name: item.name,
      quantity: item.quantity ?? 1,
    })),
    currency,
    value,
  });
}
