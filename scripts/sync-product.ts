/**
 * `npm run shopify:sync` — fetch the Crawl & Cuddle hero product from the
 * Shopify Admin API and write data/product.json with its live price and
 * compare-at price (in dollars). Everything else on the site stays static.
 *
 * The Admin access token is GENERATED at runtime via the client-credentials
 * grant (Client ID + Secret → 24h token, cached in-process) — never passed in
 * directly. See src/lib/shopify/admin-token.ts (ported from the Trackify
 * reference).
 *
 * Usage: npm run shopify:sync [handle]
 *   Default handle: baby-head-protector-backpack
 */

import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { adminAuthSource, getAdminToken } from "../src/lib/shopify/admin-token";
import { isStorefrontConfigured, shopifyConfig } from "../src/lib/shopify/config";
import { getLocalizedVariantPrices } from "../src/lib/shopify/localization-service";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT = join(ROOT, "data", "product.json");

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
  if (process.env[key] === undefined && value !== undefined)
    process.env[key] = value;
}

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

const endpoint = `https://${cfg.storeDomain}/admin/api/${cfg.apiVersion}/graphql.json`;
const handle = process.argv[2] ?? "baby-head-protector-backpack";

type VariantNode = {
  id: string;
  title: string;
  price: string | null;
  compareAtPrice: string | null;
  availableForSale: boolean;
};

async function adminRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await getAdminToken();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };
  if (!res.ok || body.errors?.length) {
    throw new Error(body.errors?.[0]?.message || `HTTP ${res.status}`);
  }
  return body.data as T;
}

const SHOP_QUERY = `query { shop { name currencyCode } }`;

const MARKETS_QUERY = `
query Markets {
  markets(first: 20) {
    nodes {
      name
      enabled
      regions(first: 10) {
        nodes {
          ... on MarketRegionCountry {
            code
          }
        }
      }
    }
  }
}`;

type MarketPrice = {
  amount: number;
  compareAtAmount: number | null;
  currencyCode: string;
};

/** Single-country markets are real, merchant-priced markets; multi-country ones are the "sell everywhere" catch-all — see reference/lib/shopify/sync-product.ts. */
async function discoverCuratedMarketCountries(): Promise<string[]> {
  const data = await adminRequest<{
    markets: {
      nodes: {
        name: string;
        enabled: boolean;
        regions: { nodes: { code?: string }[] };
      }[];
    };
  }>(MARKETS_QUERY);

  const codes = new Set<string>();
  for (const market of data.markets.nodes) {
    if (!market.enabled) continue;
    const regionCodes = market.regions.nodes
      .map((r) => r.code)
      .filter((c): c is string => Boolean(c));
    if (regionCodes.length === 1) codes.add(regionCodes[0]!);
  }
  return [...codes];
}

const PRODUCT_QUERY = `
query ProductByHandle($handle: String!) {
  productByHandle(handle: $handle) {
    id
    handle
    title
    variants(first: 100) {
      nodes {
        id
        title
        price
        compareAtPrice
        availableForSale
      }
    }
  }
}`;

type ShopData = { shop: { name: string; currencyCode: string } | null };
type ProductData = {
  productByHandle: {
    id: string;
    handle: string;
    title: string;
    variants: { nodes: VariantNode[] } | null;
  } | null;
};

function normalizeVariants(nodes: VariantNode[]) {
  return nodes
    .filter((v) => v.price != null)
    .map((v) => {
      const price = Number(v.price);
      const compare =
        v.compareAtPrice != null ? Number(v.compareAtPrice) : null;
      return {
        id: v.id,
        title: v.title,
        price,
        compareAtPrice: compare != null && compare > price ? compare : null,
        availableForSale: v.availableForSale,
      };
    });
}

async function main() {
  console.log(`· syncing product "${handle}" from ${cfg.storeDomain}`);

  const [shopData, productData] = await Promise.all([
    adminRequest<ShopData>(SHOP_QUERY),
    adminRequest<ProductData>(PRODUCT_QUERY, { handle }),
  ]);

  const product = productData?.productByHandle;
  if (!product) {
    console.error(`✖ no product found with handle "${handle}"`);
    process.exit(1);
  }

  const variants = normalizeVariants(product.variants?.nodes ?? []);
  const saleVariant = variants.find((v) => v.availableForSale) ?? variants[0];
  const price = saleVariant?.price ?? null;
  const compare = saleVariant?.compareAtPrice ?? null;
  const currency = shopData?.shop?.currencyCode || "USD";

  if (price == null) {
    console.error("✖ product has no priced, saleable variant");
    process.exit(1);
  }

  // A permissions gap (e.g. the Admin app is missing the read_markets scope)
  // must not take down the base sync — just skip market prices.
  const markets = await discoverCuratedMarketCountries().catch(() => []);
  console.log(`· curated markets: ${markets.length > 0 ? markets.join(", ") : "(none)"}`);

  const pricesByVariant = new Map<string, Record<string, MarketPrice>>(
    variants.map((v) => [v.id, {}]),
  );

  if (markets.length > 0 && isStorefrontConfigured(cfg)) {
    const variantIds = variants.map((v) => v.id);
    await Promise.all(
      markets.map(async (country) => {
        const priceMap = await getLocalizedVariantPrices(
          variantIds,
          country,
        ).catch(() => new Map());
        for (const [variantId, localized] of priceMap) {
          const bucket = pricesByVariant.get(variantId);
          if (!bucket) continue;
          bucket[country] = {
            amount: Number(localized.amount),
            compareAtAmount:
              localized.compareAtAmount != null
                ? Number(localized.compareAtAmount)
                : null,
            currencyCode: localized.currencyCode,
          };
        }
      }),
    );
  }

  const variantsWithMarkets = variants.map((v) => ({
    ...v,
    pricesByMarket: pricesByVariant.get(v.id) ?? {},
  }));

  const record = {
    version: 3,
    syncedAt: new Date().toISOString(),
    shop: {
      domain: cfg.storeDomain,
      name: shopData?.shop?.name || "Crawl & Cuddle",
      currencyCode: currency,
    },
    markets,
    product: {
      id: product.id,
      handle: product.handle,
      title: product.title,
      price,
      compareAtPrice: compare != null && compare > price ? compare : null,
      currencyCode: currency,
      availableForSale: variants.some((v) => v.availableForSale),
      variants: variantsWithMarkets,
    },
  };

  const json = `${JSON.stringify(record, null, 2)}\n`;
  const tmp = `${OUTPUT}.tmp`;
  writeFileSync(tmp, json);
  renameSync(tmp, OUTPUT);

  console.log(`✔ wrote ${OUTPUT}`);
  console.log(
    `  ${product.title} → $${price}${record.product.compareAtPrice ? ` (was $${record.product.compareAtPrice})` : ""} ${currency}`,
  );
}

main().catch((err) => {
  console.error("✖ sync failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
