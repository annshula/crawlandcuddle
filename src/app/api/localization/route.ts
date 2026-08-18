import { NextRequest, NextResponse } from "next/server";

import { readSelectedCountry } from "@/lib/localization/country";
import { detectVisitorCountry } from "@/lib/localization/geo";
import { getLocalization } from "@/lib/shopify/localization-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/localization — the real list of countries/currencies Shopify has
 * configured for this store, the shop's default market for this visitor's
 * detected country, and whichever country they already chose. Powers the
 * currency selector — nothing here is hardcoded.
 */
export async function GET(request: NextRequest) {
  try {
    const [localization, selected] = await Promise.all([
      getLocalization(detectVisitorCountry(request.headers)),
      readSelectedCountry(),
    ]);
    return NextResponse.json(
      {
        defaultCountry: localization.defaultCountry,
        countries: localization.availableCountries,
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
