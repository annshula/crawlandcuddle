import { NextRequest, NextResponse } from "next/server";

import { readSelectedCountry } from "@/lib/localization/country";
import { detectVisitorCountry } from "@/lib/localization/geo";
import { CURATED_MARKET_COUNTRIES } from "@/lib/localization/markets";
import { getLocalization } from "@/lib/shopify/localization-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/localization — this store's curated markets (the ones we've set
 * up our own price for in Shopify Markets — see CURATED_MARKET_COUNTRIES),
 * the shop's default market for this visitor's detected country, and
 * whichever country they already chose. Powers the currency selector.
 *
 * Shopify's `localization.availableCountries` lists every country the
 * catch-all "International" market can sell to (100+ rows) — that's a
 * shipping/checkout list, not a curated currency list, so it's filtered down
 * to just the markets this store has actually priced instead of shown as-is.
 */
export async function GET(request: NextRequest) {
  try {
    const [localization, selected] = await Promise.all([
      getLocalization(detectVisitorCountry(request.headers)),
      readSelectedCountry(),
    ]);

    const curated = localization.availableCountries.filter((c) =>
      CURATED_MARKET_COUNTRIES.includes(c.isoCode),
    );

    const defaultCountry = CURATED_MARKET_COUNTRIES.includes(
      localization.defaultCountry.isoCode,
    )
      ? localization.defaultCountry
      : (curated.find((c) => c.isoCode === "US") ?? curated[0] ?? null);

    return NextResponse.json(
      {
        defaultCountry,
        countries: curated,
        selected,
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch {
    return NextResponse.json(
      { defaultCountry: null, countries: [], selected: null },
      { status: 200, headers: { "Cache-Control": "no-store, private" } },
    );
  }
}
