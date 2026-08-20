import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Shopify webhook HMAC verification + idempotency — ported from the Trackify
 * reference (`reference/services/webhooks/verify.ts`).
 *
 * Verification MUST run against the raw request body — any JSON round-trip
 * changes the bytes and invalidates the signature.
 */

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  headerSignature: string | null,
): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[webhook] 401: SHOPIFY_WEBHOOK_SECRET is not set on this environment",
    );
    return false;
  }
  if (!headerSignature) {
    console.error("[webhook] 401: missing x-shopify-hmac-sha256 header");
    return false;
  }

  const computed = createHmac("sha256", secret)
    .update(
      typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody,
    )
    .digest();

  let provided: Buffer;
  try {
    provided = Buffer.from(headerSignature, "base64");
  } catch {
    return false;
  }

  // timingSafeEqual throws on length mismatch, so check length first — the
  // length of a signature is not a secret.
  if (provided.length !== computed.length) return false;
  const match = timingSafeEqual(provided, computed);
  if (!match) {
    console.error(
      "[webhook] 401: HMAC mismatch — the secret registered in Shopify does not match SHOPIFY_WEBHOOK_SECRET",
    );
  }
  return match;
}

/**
 * Bounded LRU of processed webhook IDs.
 *
 * Shopify retries aggressively and can deliver the same event more than once;
 * replaying a purchase would over-count conversions in Meta / GA4.
 */
const MAX_SEEN = 2000;
const seen = new Map<string, number>();

export function isDuplicateWebhook(webhookId: string | null): boolean {
  if (!webhookId) return false;
  if (seen.has(webhookId)) {
    seen.delete(webhookId);
    seen.set(webhookId, Date.now());
    return true;
  }
  seen.set(webhookId, Date.now());
  if (seen.size > MAX_SEEN) {
    const oldest = seen.keys().next().value;
    if (oldest !== undefined) seen.delete(oldest);
  }
  return false;
}

/** Test seam — resets the dedupe cache. */
export function resetWebhookDedupe(): void {
  seen.clear();
}
