/**
 * The countries this store has its own curated Shopify Market + price list
 * for (see the Markets section of Shopify Admin). Shopify's Storefront API
 * `localization.availableCountries` lists every country the catch-all
 * "International" market can ship to — 100+ rows, most of them priced only
 * by blanket currency conversion, not a merchant-set price. Restricting the
 * currency selector to this list keeps it to the currencies we've actually
 * priced, the same curation reference/lib/shopify/sync-product.mjs applies
 * via data/product.json's `markets` field.
 *
 * Keep in sync with Shopify Admin → Settings → Markets.
 */
export const CURATED_MARKET_COUNTRIES: string[] = ["US", "CA", "GB", "AU", "IN"];
