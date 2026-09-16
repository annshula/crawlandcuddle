/**
 * Loads the Shopify-synced product record (data/product.json) and exposes the
 * live price / compare-at price in cents for the UI, plus per-market prices
 * for the currency selector — ported from the AccuPenPro reference
 * (lib/catalog.ts) to the same fully-static model: no live Shopify call at
 * request time, every price is a synchronous lookup into the synced catalog.
 *
 * The catalog file is produced by `npm run shopify:sync` — it is a read model
 * only. At buy time the price is re-validated against Shopify's Storefront API,
 * never trusted from this file.
 */

import catalog from "../../data/product.json";

export type MarketPrice = {
  amount: number;
  compareAtAmount: number | null;
  currencyCode: string;
};

export type SyncedVariant = {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  availableForSale: boolean;
  /** Per-country price list, from the store's real curated Shopify Markets only — see scripts/sync-product.ts. Empty until a product has been through that sync. */
  pricesByMarket?: Record<string, MarketPrice>;
  /** The real Shopify variant image (per style) — null when Shopify has no image for this variant, undefined for a product synced before this field existed. */
  image?: string | null;
};

export type SyncedVideo = {
  poster: string;
  sources: { src: string; type: string }[];
};

/** One photo in the product's Shopify media list. */
export type SyncedMediaImage = {
  type: "image";
  url: string;
  width?: number | null;
  height?: number | null;
  /** The Shopify variant this is the featured photo of, when it is one — null for the extra product/gallery shots. */
  variantId?: string | null;
};

/** The product's video, in the same list position Shopify gives it. */
export type SyncedMediaVideo = SyncedVideo & { type: "video" };

export type SyncedMediaItem = SyncedMediaImage | SyncedMediaVideo;

export type SyncedProduct = {
  id: string;
  handle: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  currencyCode: string;
  availableForSale: boolean;
  variants: SyncedVariant[];
  /** The product's real Shopify video, if one is attached — undefined for a product synced before this field existed, null when Shopify genuinely has none. */
  video?: SyncedVideo | null;
  /** Every photo and video in Shopify's own gallery order — undefined for a product synced before this field existed. */
  media?: SyncedMediaItem[];
};

export const syncedProduct: SyncedProduct = catalog.product;
export const syncedShop = catalog.shop;
/** The product's real Shopify video, or null until one is attached and synced. */
export const syncedVideo: SyncedVideo | null =
  "video" in catalog.product
    ? (catalog.product.video as SyncedVideo | null)
    : null;
/**
 * The product's media in Shopify's own order (20 images + 1 video for the live
 * product) — the PDP gallery renders this list as-is. Empty until the product
 * has been synced with the media field, in which case the gallery falls back to
 * one photo per style.
 */
export const syncedMedia: SyncedMediaItem[] =
  "media" in catalog.product && Array.isArray(catalog.product.media)
    ? (catalog.product.media as SyncedMediaItem[])
    : [];
/** Curated market country codes this catalog has real per-market prices for (empty until synced with Storefront access). */
export const syncedMarkets: string[] =
  "markets" in catalog && Array.isArray(catalog.markets)
    ? (catalog.markets as string[])
    : [];

export const syncedAt = catalog.syncedAt;

/**
 * A variant's price for a given country, straight from the synced catalog —
 * no live Shopify call. A variant with no pricesByMarket entries (not yet
 * synced) simply falls back to its own base price for every country.
 */
export function priceForMarket(
  variantId: string,
  countryCode: string | null | undefined,
): MarketPrice {
  const variant = syncedProduct.variants.find((v) => v.id === variantId);
  const rawDefault: MarketPrice = {
    amount: variant?.price ?? syncedProduct.price,
    compareAtAmount: variant?.compareAtPrice ?? syncedProduct.compareAtPrice,
    currencyCode: syncedProduct.currencyCode,
  };
  if (!variant) return rawDefault;

  const us = variant.pricesByMarket?.US ?? rawDefault;
  if (!countryCode) return us;
  return variant.pricesByMarket?.[countryCode.toUpperCase()] ?? us;
}

const mainSaleVariant =
  syncedProduct.variants.find((v) => v.availableForSale) ??
  syncedProduct.variants[0];
// Same US-preferred fallback as priceForMarket — the site's one "no country
// known yet" price should never be the raw Admin default.
const mainDefaultPrice = mainSaleVariant?.pricesByMarket?.US ?? {
  amount: syncedProduct.price,
  compareAtAmount: syncedProduct.compareAtPrice,
  currencyCode: syncedProduct.currencyCode,
};

export const productPriceCents = Math.round(mainDefaultPrice.amount * 100);
export const productCompareAtCents =
  mainDefaultPrice.compareAtAmount != null
    ? Math.round(mainDefaultPrice.compareAtAmount * 100)
    : productPriceCents;
export const productCurrency = mainDefaultPrice.currencyCode ?? "USD";

/** The default Shopify variant to buy from (first saleable). */
export function defaultVariant(): SyncedVariant {
  return (
    syncedProduct.variants.find((v) => v.availableForSale) ??
    syncedProduct.variants[0] ??
    ({
      id: "",
      title: "Default Title",
      price: syncedProduct.price,
      compareAtPrice: syncedProduct.compareAtPrice,
      availableForSale: syncedProduct.availableForSale,
    } as SyncedVariant)
  );
}

const slugToWords = (slug: string) =>
  slug.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

/**
 * The Shopify variant a style slug (e.g. "dream-little-butterfly") belongs to,
 * by fuzzy title match — `undefined` when the synced catalog has no such
 * variant at all, so callers can tell "not synced yet" from "matched".
 */
function findVariantForStyle(slug: string): SyncedVariant | undefined {
  const words = slugToWords(slug);
  return syncedProduct.variants.find((v) => {
    const title = v.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (title === words) return true;
    const titleWords = new Set(title.split(" "));
    const slugSet = new Set(words.split(" "));
    if (titleWords.size > 1 && slugSet.size > 1) {
      const intersection = [...titleWords].filter((w) => slugSet.has(w));
      return intersection.length >= Math.min(titleWords.size, slugSet.size);
    }
    return false;
  });
}

/**
 * Map a style slug to the matching Shopify variant by fuzzy title match,
 * falling back to the first saleable variant.
 */
export function getVariantForStyle(slug: string): SyncedVariant {
  return findVariantForStyle(slug) ?? defaultVariant();
}

/**
 * Where a style sits in the live Shopify variant list — the storefront's style
 * order should read exactly like the product's style dropdown on Shopify. A
 * style with no synced variant yet sorts after every real one (never bumps the
 * queue), and `Array.prototype.sort` is stable, so unsynced styles keep their
 * hand-written order among themselves.
 */
export function variantPositionForStyle(slug: string): number {
  const match = findVariantForStyle(slug);
  const index = match ? syncedProduct.variants.indexOf(match) : -1;
  return index < 0 ? syncedProduct.variants.length : index;
}

/* ── Brand identity on a shared store ──────────────────────────────────── */

/** The single product this storefront sells — how we tell our line items apart from other brands sharing the Shopify store. */
export const crawlCuddleProductId = syncedProduct.id;

/** Every variant of that product; anything else on the shared store belongs to another brand. */
const crawlCuddleVariantIds = new Set(
  syncedProduct.variants.map((variant) => variant.id),
);

/**
 * Whether an order line item belongs to Crawl & Cuddle. Matches the product id
 * first (any variant of our product counts, including a design added after the
 * last `npm run shopify:sync`), falling back to the exact variant id set.
 */
export function belongsToCrawlCuddle(input: {
  variantId?: string | null;
  productId?: string | null;
}): boolean {
  if (input.productId && input.productId === crawlCuddleProductId) return true;
  return Boolean(input.variantId && crawlCuddleVariantIds.has(input.variantId));
}
