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
