import { NextResponse } from "next/server";

import { resolveEffectiveCountry } from "@/lib/localization/country";
import { getLocalizedVariantPrices } from "@/lib/shopify/localization-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VARIANT_ID_RE = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

/**
 * POST /api/localization/prices
 *
 * Given a batch of variant IDs, returns each one's price as Shopify itself
 * reports it for the visitor's effective country (their explicit choice, or
 * the edge-detected country). No conversion happens in this app. Before either
 * is available, pages keep showing the base-currency price and never call this.
 */
export async function POST(request: Request) {
  const country = await resolveEffectiveCountry();
  if (!country) {
    return NextResponse.json({ prices: {} });
  }

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
