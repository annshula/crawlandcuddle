/**
 * `npm run shopify:sync [handle]` — refresh data/product.json from the live
 * Shopify product (price, compare-at, per-market prices, variants and the
 * media list in Shopify's own order).
 *
 * This is now a thin wrapper: the engine lives in
 * `src/lib/shopify/sync-product.ts`, which is also what the Shopify
 * `products/create` + `products/update` webhook calls, so a merchant edit and
 * a manual sync can never drift apart. (The reference project keeps two
 * separate copies — a lib for the webhook and a standalone script for the CLI
 * — because its lib imports "server-only"; ours does not, so one
 * implementation is enough.)
 *
 * The write goes through `lib/catalog/storage.ts`: the filesystem locally, and
 * Vercel Blob in production (where the deployed function's disk is read-only).
 *
 * Usage: npm run shopify:sync [handle]
 *   Default handle: baby-head-protector-backpack
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CATALOG_PATH } from "../src/lib/catalog/storage";
import { adminAuthSource } from "../src/lib/shopify/admin-token";
import { shopifyConfig } from "../src/lib/shopify/config";
import {
  DEFAULT_PRODUCT_HANDLE,
  syncProduct,
} from "../src/lib/shopify/sync-product";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/* ── minimal .env loader ───────────────────────────────────────────────── */
function loadEnv(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const text = readFileSync(join(ROOT, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  } catch {
    /* no .env — rely on process env */
  }
  return result;
}

// Populate process.env from .env so the Shopify config module sees it
// (real environment variables always win).
const env = loadEnv();
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined && value !== undefined) {
    process.env[key] = value;
  }
}

async function main(): Promise<void> {
  const cfg = shopifyConfig();
  if (!cfg.storeDomain) {
    console.error(
      "✖ SHOPIFY_STORE_DOMAIN is not set (e.g. your-store.myshopify.com)",
    );
    process.exit(1);
  }
  if (adminAuthSource() === "unconfigured") {
    console.error(
      "✖ Admin API is not configured. Set SHOPIFY_ADMIN_CLIENT_ID + SHOPIFY_ADMIN_CLIENT_SECRET " +
        "in .env so the access token can be generated (or a legacy SHOPIFY_ADMIN_API_TOKEN).",
    );
    process.exit(1);
  }

  const handle = process.argv[2] ?? DEFAULT_PRODUCT_HANDLE;
  console.log(`· syncing product "${handle}" from ${cfg.storeDomain}`);

  const result = await syncProduct(handle);

  const target = process.env.BLOB_READ_WRITE_TOKEN
    ? "Vercel Blob"
    : CATALOG_PATH;
  console.log(`✔ wrote ${target}`);
  console.log(
    `  ${result.title} → $${result.price}${result.compareAtPrice ? ` (was $${result.compareAtPrice})` : ""} ${result.currencyCode}`,
  );
  console.log(
    `  ${result.mediaItems} media items in Shopify order (${result.mediaImages} images + ${result.mediaVideos} video)`,
  );
}

main().catch((err) => {
  console.error("✖ sync failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
