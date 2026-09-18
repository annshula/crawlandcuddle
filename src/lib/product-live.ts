import { syncedProduct, type SyncedProduct } from "@/lib/catalog";
import { CATALOG_PATH, readJsonFile } from "@/lib/catalog/storage";
import type { SyncedCatalogRecord } from "@/lib/shopify/sync-product";

/**
 * Live-synced catalog reads — ported from the reference
 * (`reference/lib/product-live.ts`). Split out from `lib/catalog.ts`
 * specifically so that file can stay bundle-safe: `lib/catalog.ts` is reachable
 * from client components (the cart validates lines against it in the browser),
 * so it must never import Blob / node:fs. This module is server-only by
 * construction — `lib/catalog/storage.ts` pulls in both.
 *
 * Reads through `lib/catalog/storage.ts`, which checks Vercel Blob (where the
 * `products/create|update` webhook persists a sync in production, because the
 * deployed function's own filesystem is read-only there) and falls back to the
 * build-time `data/product.json` snapshot when no sync has run yet in this
 * environment.
 *
 * SCOPE — deliberately narrow, exactly like the reference: this is wired into
 * the sitemap and the llms*.txt feeds ONLY. The product detail page, the shop
 * listing and the homepage still resolve pricing through `lib/catalog.ts`'s
 * static import, because that same module feeds variant ids and market prices
 * that cart/checkout matching depends on — switching it wholesale to an async
 * storage read is a separate, larger change. So a Shopify edit reaches those
 * shopper-facing surfaces on the next deploy, not instantly.
 */

/** The synced catalog document as persisted, or null when nothing is readable. */
export async function getLiveCatalogRecord(): Promise<SyncedCatalogRecord | null> {
  return readJsonFile<SyncedCatalogRecord>(CATALOG_PATH);
}

/** The live product, falling back to the committed build-time snapshot. */
export async function getLiveProduct(): Promise<SyncedProduct> {
  const record = await getLiveCatalogRecord();
  return (record?.product as SyncedProduct | undefined) ?? syncedProduct;
}

/** The live product when the handle matches, otherwise undefined. */
export async function getLiveProductByHandle(
  handle: string,
): Promise<SyncedProduct | undefined> {
  const product = await getLiveProduct();
  return product.handle === handle ? product : undefined;
}
