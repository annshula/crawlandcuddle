import { NextRequest, NextResponse } from "next/server";

import { syncedProduct } from "@/lib/catalog";
import { revalidateProduct } from "@/lib/catalog/tags";
import { isAdminConfigured } from "@/lib/shopify/config";
import { syncProductFromWebhook } from "@/lib/shopify/sync-product";
import {
  describeCaller,
  isDuplicateWebhook,
  verifyWebhookSignature,
} from "@/services/webhooks/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Shopify `products/create` + `products/update` webhooks — keeps the synced
 * catalog current when the product is edited in Shopify Admin, so a
 * title/price/image/metafield change does not need someone to remember
 * `npm run shopify:sync`.
 *
 * Modelled on the reference's handler: HMAC → topic gate → dedupe → sync the
 * product into storage → `revalidateProduct()` to drop the ISR entries that
 * read it. The one deliberate difference is the gate: the reference screens on
 * a vendor allowlist, while this route matches the webhook's product id/handle
 * against the single product this storefront publishes — stricter, and it
 * needs no configuration.
 *
 * WHERE THE EDIT ACTUALLY SHOWS UP: the sync writes through
 * `lib/catalog/storage.ts` (Vercel Blob in production), and only the surfaces
 * that read live — the sitemap and the llms*.txt feeds — pick it up
 * immediately. Pages that resolve pricing through `lib/catalog.ts`'s static
 * import (PDP, shop listing, homepage) change on the next deploy. That matches
 * the reference exactly; see `lib/product-live.ts` for why the pricing path is
 * not switched to a live read yet.
 */

const PRODUCT_TOPICS = new Set(["products/create", "products/update"]);

/** Numeric tail of our catalogue id — webhooks send plain numbers, the APIs send `gid://shopify/Product/123`. */
const productIdNum = syncedProduct.id.split("/").pop();

const ack = (extra: Record<string, unknown> = {}) =>
  NextResponse.json({ received: true, ...extra });

/** True when the webhook names the one product this storefront publishes. */
function isOurProduct(payload: {
  id?: number | string | null;
  handle?: string | null;
}): boolean {
  if (payload.id != null && String(payload.id) === productIdNum) return true;
  return Boolean(payload.handle) && payload.handle === syncedProduct.handle;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (
    !verifyWebhookSignature(
      rawBody,
      request.headers.get("x-shopify-hmac-sha256"),
      describeCaller(request.headers),
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  if (!PRODUCT_TOPICS.has(topic)) {
    // Not ours (e.g. products/delete) — ack so Shopify doesn't retry.
    console.log(
      `[webhook/products] ignoring topic "${topic}" (only ${[...PRODUCT_TOPICS].join(", ")} are handled)`,
    );
    return ack({ topic, ignored: true });
  }

  // Shopify retries and can re-deliver the same event; dedupe on the webhook
  // id so one edit is never synced twice.
  if (isDuplicateWebhook(request.headers.get("x-shopify-webhook-id"))) {
    return ack({ topic, deduped: true });
  }

  let payload: {
    id?: number | string | null;
    handle?: string | null;
    title?: string | null;
    vendor?: string | null;
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch (error) {
    console.error(
      "[webhook/products] could not parse the body as JSON:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.id === undefined || payload.id === null) {
    console.error(`[webhook/products] ${topic} payload missing product id`);
    return ack({ topic, missingId: true });
  }

  // Graceful when the Admin API isn't configured — same as the orders handler
  // skipping analytics providers: ack so Shopify doesn't hammer a config error
  // that a retry can never fix.
  if (!isAdminConfigured()) {
    console.error(
      "[webhook/products] Admin API not configured, skipping sync (set SHOPIFY_ADMIN_CLIENT_ID + SHOPIFY_ADMIN_CLIENT_SECRET or SHOPIFY_ADMIN_API_TOKEN).",
    );
    return ack({ topic, synced: false });
  }

  // Webhook topics are store-scoped: this Shopify store hosts several brands,
  // so products/create|update fire for every one of their merchants. Only the
  // product this storefront publishes may trigger a sync.
  if (!isOurProduct(payload)) {
    console.log(
      `[webhook/products] ${topic} ignored product ${payload.id} ("${payload.title ?? "untitled"}", vendor "${payload.vendor ?? "unknown"}"): not in this storefront's catalog`,
    );
    return ack({ topic, matched: false });
  }

  try {
    const result = await syncProductFromWebhook(payload.id, {
      handle: payload.handle,
      title: payload.title,
    });

    // The catalog document changed — flush the ISR entries/tags for the
    // touched product so the routes that read live storage (sitemap +
    // llms*.txt) pick it up without waiting for their revalidate window.
    revalidateProduct(result.handle);

    console.log(
      `[webhook/products] ${topic} → synced "${result.handle}" ($${result.price} ${result.currencyCode}, ${result.mediaItems} media items)`,
    );
    return NextResponse.json(
      { received: true, topic, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      `[webhook/products] ${topic} sync failed:`,
      error instanceof Error ? error.message : error,
    );
    // 500 so Shopify retries — a transient Admin API hiccup should not leave
    // the catalog stale forever.
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
