import { NextRequest, NextResponse } from "next/server";

import { syncedProduct } from "@/lib/catalog";
import { isStorefrontConfigured } from "@/lib/shopify/config";
import { getLocalizedVariantPrices } from "@/lib/shopify/localization-service";

export const runtime = "nodejs";

/**
 * GET /api/localization/prices?country=CA — every variant's price in that
 * country's presentment currency, asked of Shopify live via `@inContext`.
 * No exchange-rate math and nothing snapshotted: the amounts are exactly what
 * Shopify Markets reports. Prices are not shopper-specific, so the response is
 * edge-cacheable for a few minutes.
 */
export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country")?.toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json(
      { ok: false, error: "Invalid country code." },
      { status: 400 },
    );
  }

  if (!isStorefrontConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Shopify storefront is not configured." },
      { status: 503 },
    );
  }

  try {
    const priceMap = await getLocalizedVariantPrices(
      syncedProduct.variants.map((v) => v.id),
      country,
    );
    const prices: Record<
      string,
      { amount: number; compareAtAmount: number | null; currencyCode: string }
    > = {};
    for (const [variantId, price] of priceMap) {
      const amount = Number(price.amount);
      const compare =
        price.compareAtAmount != null ? Number(price.compareAtAmount) : null;
      prices[variantId] = {
        amount,
        compareAtAmount: compare != null && compare > amount ? compare : null,
        currencyCode: price.currencyCode,
      };
    }
    return NextResponse.json(
      { ok: true, country, prices },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Could not load prices.",
      },
      { status: 502 },
    );
  }
}
