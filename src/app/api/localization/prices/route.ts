import { NextResponse } from "next/server";

import { resolveEffectiveCountry } from "@/lib/localization/country";
import { getLocalizedVariantPrices } from "@/lib/shopify/localization-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VARIANT_ID_RE = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

/**
 * POST /api/localization/prices
 *
 * Given a batch of variant IDs, returns each one's price as Shopify itself
 * reports it for the country the request asks for, falling back to the
 * visitor's effective country (their saved choice, or the edge-detected one).
 * No conversion happens in this app.
 *
 * The country travels in the body because the client is the source of truth
 * for what the shopper is currently looking at: the cookie write that follows
 * a currency switch is a separate request, so reading only the cookie here
 * would race it and answer the very next batch in the previous currency.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const variantIds = (body as { variantIds?: unknown })?.variantIds;
  if (
    !Array.isArray(variantIds) ||
    variantIds.length === 0 ||
    variantIds.length > 60 ||
    variantIds.some((id) => typeof id !== "string" || !VARIANT_ID_RE.test(id))
  ) {
    return NextResponse.json(
      { error: "Invalid variant ids." },
      { status: 400 },
    );
  }

  const requested = (body as { country?: unknown })?.country;
  const country =
    typeof requested === "string" && COUNTRY_CODE_RE.test(requested)
      ? requested
      : await resolveEffectiveCountry();
  if (!country) {
    return NextResponse.json({ prices: {} });
  }

  try {
    const priceMap = await getLocalizedVariantPrices(
      variantIds as string[],
      country,
    );
    return NextResponse.json({
      prices: Object.fromEntries(priceMap),
      country,
    });
  } catch {
    // A failed live-price fetch should never break the page — callers fall
    // back to the base-currency price already shown.
    return NextResponse.json({ prices: {} });
  }
}
