import { getAdminToken } from "@/lib/shopify/admin-token";
import {
  adminEndpoint,
  isStorefrontConfigured,
  shopifyConfig,
} from "@/lib/shopify/config";
import { getLocalizedVariantPrices } from "@/lib/shopify/localization-service";
import {
  CATALOG_PATH,
  acquireLock,
  writeJsonFileAtomic,
} from "@/lib/catalog/storage";

/**
 * The Shopify → data/product.json sync engine, extracted from
 * `scripts/sync-product.ts` so it can run in two places:
 *  - `npm run shopify:sync` (the CLI is now a thin wrapper around this)
 *  - the Shopify `products/create` + `products/update` webhook, so a merchant
 *    edit refreshes the catalog without anyone running a command.
 *
 * Faithful to the CLI it replaces: same GraphQL, same mapping, same schema
 * (`version: 5`) — only the WRITE changed, from `writeFileSync` into the
 * working tree to `writeJsonFileAtomic` via `lib/catalog/storage.ts`, which
 * picks the filesystem in dev and Vercel Blob in production (a deployed
 * function's filesystem is read-only, so the old write would throw EROFS
 * there). A cross-process lock serialises concurrent webhook deliveries.
 *
 * Everything here is Shopify-sourced and overwritten on every run: title,
 * price, compare-at, per-market prices, variants and the media list in
 * Shopify's own order. The record is a read model — the price is re-validated
 * against the Storefront API at buy time, never trusted from this file.
 *
 * Market prices come from the Storefront API once per curated market. A
 * single-country market is a real, merchant-priced market; a multi-country one
 * is the "sell everywhere" catch-all whose price is live-FX-converted, so
 * snapshotting it would only go stale.
 */

/** The one product this storefront publishes. */
export const DEFAULT_PRODUCT_HANDLE = "baby-head-protector-backpack";

type VariantNode = {
  id: string;
  title: string;
  price: string | null;
  compareAtPrice: string | null;
  availableForSale: boolean;
  image: { url: string } | null;
};

type VideoSourceNode = {
  url: string;
  mimeType: string;
  format: string;
  width: number | null;
  height: number | null;
};

type MarketPrice = {
  amount: number;
  compareAtAmount: number | null;
  currencyCode: string;
};

/** One variant as persisted — the shape `lib/catalog.ts` reads back. */
export type SyncedVariantRecord = {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  availableForSale: boolean;
  image: string | null;
  pricesByMarket: Record<string, MarketPrice>;
};

export type SyncedMediaItemRecord =
  | {
      type: "image";
      url: string;
      width: number | null;
      height: number | null;
      variantId: string | null;
    }
  | { type: "video"; poster: string; sources: { src: string; type: string }[] };

export type SyncedProductRecord = {
  id: string;
  handle: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  currencyCode: string;
  availableForSale: boolean;
  variants: SyncedVariantRecord[];
  video: { poster: string; sources: { src: string; type: string }[] } | null;
  media: SyncedMediaItemRecord[];
};

/** The whole `data/product.json` document. */
export type SyncedCatalogRecord = {
  version: number;
  syncedAt: string;
  shop: { domain: string; name: string; currencyCode: string };
  markets: string[];
  product: SyncedProductRecord;
};

export type SyncResult = {
  action: "synced";
  handle: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  currencyCode: string;
  mediaItems: number;
  mediaImages: number;
  mediaVideos: number;
};

async function adminRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const endpoint = adminEndpoint();
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

/** Single-country markets are real, merchant-priced markets; multi-country ones are the "sell everywhere" catch-all. */
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
        image { url }
      }
    }
    media(first: 50) {
      nodes {
        __typename
        ... on MediaImage {
          image { url width height }
        }
        ... on Video {
          sources { url mimeType format width height }
          preview { image { url width height } }
        }
      }
    }
  }
}`;

type ShopData = { shop: { name: string; currencyCode: string } | null };
type MediaImageNode = {
  __typename: "MediaImage";
  image: { url: string; width: number | null; height: number | null } | null;
};
type VideoNode = {
  __typename: "Video";
  sources: VideoSourceNode[];
  preview: { image: { url: string; width: number; height: number } } | null;
};
type MediaNode = MediaImageNode | VideoNode | { __typename: string };

/* The catch-all `{ __typename: string }` member means a bare `__typename`
   comparison cannot discriminate the union — these guards do it explicitly. */
const isMediaImage = (node: MediaNode): node is MediaImageNode =>
  node.__typename === "MediaImage";
const isVideo = (node: MediaNode): node is VideoNode =>
  node.__typename === "Video";

type ProductData = {
  productByHandle: {
    id: string;
    handle: string;
    title: string;
    variants: { nodes: VariantNode[] } | null;
    media: { nodes: MediaNode[] } | null;
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
        image: v.image?.url ?? null,
      };
    });
}

/** Shopify auto-transcodes a video into several mp4 renditions plus an HLS stream — only mp4 sources are usable in a plain <video> element, sorted HD-first. */
function videoFromNode(
  video: VideoNode,
): { poster: string; sources: { src: string; type: string }[] } | null {
  const mp4 = video.sources
    .filter((s) => s.mimeType === "video/mp4")
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  if (mp4.length === 0) return null;
  return {
    poster: video.preview?.image.url ?? "",
    sources: mp4.map((s) => ({ src: s.url, type: s.mimeType })),
  };
}

/** The product's first real video, if one is attached. */
function extractVideo(
  nodes: MediaNode[] | undefined,
): { poster: string; sources: { src: string; type: string }[] } | null {
  const video = nodes?.find((n): n is VideoNode => isVideo(n));
  return video ? videoFromNode(video) : null;
}

/** Shopify CDN urls carry a `?v=` cache-buster; compare image urls without it. */
const bareUrl = (url: string) => url.split("?")[0] ?? url;

/**
 * The product's media in Shopify's own order — images and video interleaved
 * exactly as the storefront gallery shows them. This is the axis the PDP
 * gallery mirrors; the variant ("style") order is a separate matter.
 */
function normalizeMedia(
  nodes: MediaNode[] | undefined,
  variants: { id: string; image: string | null }[],
): SyncedMediaItemRecord[] {
  const variantByImage = new Map(
    variants
      .filter((v): v is { id: string; image: string } => Boolean(v.image))
      .map((v) => [bareUrl(v.image), v.id] as const),
  );

  const items: SyncedMediaItemRecord[] = [];
  for (const node of nodes ?? []) {
    if (isMediaImage(node)) {
      const image = node.image;
      if (!image?.url) continue;
      items.push({
        type: "image",
        url: image.url,
        width: image.width ?? null,
        height: image.height ?? null,
        variantId: variantByImage.get(bareUrl(image.url)) ?? null,
      });
    } else if (isVideo(node)) {
      const video = videoFromNode(node);
      if (video) items.push({ type: "video", ...video });
    }
  }
  return items;
}

/**
 * Fetches the live product from Shopify and rewrites data/product.json.
 * Serialised behind a cross-process lock, then written atomically (Blob PUT in
 * production, temp-file + rename on the filesystem).
 */
export async function syncProduct(
  handle: string = DEFAULT_PRODUCT_HANDLE,
): Promise<SyncResult> {
  const cfg = shopifyConfig();
  if (!cfg.storeDomain) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN is not set (e.g. your-store.myshopify.com)",
    );
  }

  const [shopData, productData] = await Promise.all([
    adminRequest<ShopData>(SHOP_QUERY),
    adminRequest<ProductData>(PRODUCT_QUERY, { handle }),
  ]);

  const product = productData?.productByHandle;
  if (!product) {
    throw new Error(`no product found with handle "${handle}"`);
  }

  const variants = normalizeVariants(product.variants?.nodes ?? []);
  const saleVariant = variants.find((v) => v.availableForSale) ?? variants[0];
  const price = saleVariant?.price ?? null;
  const compare = saleVariant?.compareAtPrice ?? null;
  const currency = shopData?.shop?.currencyCode || "USD";

  if (price == null) {
    throw new Error("product has no priced, saleable variant");
  }

  // A permissions gap (e.g. the Admin app is missing read_markets) must not
  // take down the base sync — just skip market prices.
  const markets = await discoverCuratedMarketCountries().catch(() => []);

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

  const variantsWithMarkets: SyncedVariantRecord[] = variants.map((v) => ({
    ...v,
    pricesByMarket: pricesByVariant.get(v.id) ?? {},
  }));

  const video = extractVideo(product.media?.nodes);
  const media = normalizeMedia(product.media?.nodes, variants);

  const record: SyncedCatalogRecord = {
    version: 5,
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
      video,
      media,
    },
  };

  const lock = await acquireLock();
  try {
    await writeJsonFileAtomic(CATALOG_PATH, record);
  } finally {
    await lock.release();
  }

  return {
    action: "synced",
    handle: product.handle,
    title: product.title,
    price,
    compareAtPrice: record.product.compareAtPrice,
    currencyCode: currency,
    mediaItems: media.length,
    mediaImages: media.filter((m) => m.type === "image").length,
    mediaVideos: media.filter((m) => m.type === "video").length,
  };
}

/**
 * Webhook entry point — same name and shape as the reference, minus its
 * new-product seeding: this storefront publishes exactly one product, whose
 * styles, copy and layout live in code, so a brand-new Shopify product cannot
 * be "seeded" into the catalog. The id is what the webhook names; `handle` is
 * only a hint (Shopify lets a merchant change the handle on an update).
 */
export async function syncProductFromWebhook(
  _productId: number | string,
  hint?: { handle?: string | null; title?: string | null },
): Promise<SyncResult> {
  const handle = hint?.handle || DEFAULT_PRODUCT_HANDLE;
  return syncProduct(handle);
}
