/**
 * Loads the Shopify-synced product record (data/product.json) and exposes the
 * live price / compare-at price in cents for the UI.
 *
 * The catalog file is produced by `npm run shopify:sync` — it is a read model
 * only. At buy time the price is re-validated against Shopify's Storefront API,
 * never trusted from this file.
 */

import catalog from "../../data/product.json";

export type SyncedVariant = {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  availableForSale: boolean;
};

export type SyncedProduct = {
  id: string;
  handle: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  currencyCode: string;
  availableForSale: boolean;
  variants: SyncedVariant[];
};

export const syncedProduct: SyncedProduct = catalog.product;
export const syncedShop = catalog.shop;

export const productPriceCents = Math.round(syncedProduct.price * 100);
export const productCompareAtCents =
  syncedProduct.compareAtPrice != null
    ? Math.round(syncedProduct.compareAtPrice * 100)
    : productPriceCents;
export const productCurrency = syncedProduct.currencyCode ?? "USD";

export const syncedAt = catalog.syncedAt;

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
 * Map a style slug (e.g. "dream-little-butterfly") to the matching Shopify
 * variant by fuzzy title match, falling back to the first saleable variant.
 */
export function getVariantForStyle(slug: string): SyncedVariant {
  const words = slugToWords(slug);
  const match = syncedProduct.variants.find((v) => {
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
  return match ?? defaultVariant();
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
