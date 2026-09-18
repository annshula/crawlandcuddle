import { NextRequest, NextResponse } from "next/server";

import { syncedProduct } from "@/lib/catalog";
import {
  describeCaller,
  isDuplicateWebhook,
  verifyWebhookSignature,
} from "@/services/webhooks/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Shopify `products/create` + `products/update` webhooks — refreshes the
 * published storefront after a merchant edits the product in Shopify Admin,
 * without anyone remembering to run `npm run shopify:sync` + redeploy.
 *
 * Unlike the reference's version of this route (which syncs the catalog into
 * Vercel Blob and revalidates ISR tags), this site's catalog is a STATIC
 * import (`import catalog from "../../data/product.json"` in lib/catalog.ts),
 * bundled at build time. A runtime write to that file would be invisible to
 * the storefront, so the only honest way to publish a Shopify edit is a
 * rebuild: this handler pings a Vercel Deploy Hook, which re-runs
 * `npm run shopify:sync` (see the build command) and republishes.
 *
 * The plumbing is identical to the orders/paid handler: HMAC against
 * SHOPIFY_WEBHOOK_SECRET, dedupe on the webhook id, and a 200 ack for
 * anything we can't act on so Shopify never retries a hopeless delivery.
 */

const PRODUCT_TOPICS = new Set(["products/create", "products/update"]);

/** Numeric tail of our catalogue id — webhooks send plain numbers, the APIs send `gid://shopify/Product/123`. */
const productIdNum = syncedProduct.id.split("/").pop();

/**
 * Deploy hooks are rate-limited and a Shopify bulk edit fires many
 * `products/update` events in a burst, so collapse a burst into one rebuild.
 */
const REBUILD_COOLDOWN_MS = 60_000;
let lastRebuildAt = 0;

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

/** Pings the Vercel Deploy Hook; no-op (with a loud log) when it isn't configured. */
async function triggerRebuild(
  reason: string,
  productId: string,
): Promise<"triggered" | "debounced" | "not-configured" | "failed"> {
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
  if (!hook) {
    console.warn(
      `[webhook/products] ${reason} for product ${productId}: VERCEL_DEPLOY_HOOK_URL is not set in this environment, so nothing was rebuilt. The catalog is still on the previous build.`,
    );
    return "not-configured";
  }

  const elapsed = Date.now() - lastRebuildAt;
  if (lastRebuildAt !== 0 && elapsed < REBUILD_COOLDOWN_MS) {
    console.log(
      `[webhook/products] ${reason} for product ${productId}: rebuild debounced (last one ${Math.round(elapsed / 1000)}s ago).`,
    );
    return "debounced";
  }

  try {
    const response = await fetch(hook, { method: "POST" });
    const text = await response.text();
    if (!response.ok) {
      console.error(
        `[webhook/products] deploy hook returned ${response.status} for product ${productId}: ${text.slice(0, 300)}`,
      );
      return "failed";
    }
    lastRebuildAt = Date.now();
    console.log(
      `[webhook/products] ${reason} for product ${productId}: rebuild triggered (${response.status}): ${text.slice(0, 200)}`,
    );
    return "triggered";
  } catch (error) {
    console.error(
      `[webhook/products] deploy hook request failed for product ${productId}:`,
      error instanceof Error ? error.message : error,
    );
    return "failed";
  }
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
  // id so one edit never triggers two rebuilds.
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
    // Ack anyway: retrying would deliver the same unparseable bytes.
    return ack({ topic, parsed: false });
  }

  if (payload.id === undefined || payload.id === null) {
    console.error(`[webhook/products] ${topic} payload missing product id`);
    return ack({ topic, missingId: true });
  }

  // Webhook topics are store-scoped: this Shopify store hosts several brands,
  // so products/create|update fire for every one of their merchants. Only the
  // product this storefront actually publishes may trigger a rebuild.
  if (!isOurProduct(payload)) {
    console.log(
      `[webhook/products] ${topic} ignored product ${payload.id} ("${payload.title ?? "untitled"}", vendor "${payload.vendor ?? "unknown"}"): not in this storefront's catalog`,
    );
    return ack({ topic, matched: false });
  }

  const reason = `${topic} for ${syncedProduct.handle}`;
  const outcome = await triggerRebuild(reason, String(payload.id));

  return NextResponse.json(
    { received: true, topic, matched: true, rebuild: outcome },
    // Never let a CDN cache a webhook ack.
    { headers: { "Cache-Control": "no-store" } },
  );
}
