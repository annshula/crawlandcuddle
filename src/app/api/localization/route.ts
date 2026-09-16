import { NextRequest, NextResponse } from "next/server";

import { readSelectedCountry } from "@/lib/localization/country";
import { detectVisitorCountry } from "@/lib/localization/geo";
import { syncedProduct, syncedMarkets } from "@/lib/catalog";
import type { LocalizationCountry } from "@/components/providers/LocalizationProvider";

export const dynamic = "force-dynamic";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

// Intl.NumberFormat("en", …) falls back to the bare ISO code for a currency
// with no strong symbol convention in generic English locale data (ZAR is
// one — only "en-ZA" resolves it to "R"). Overridden here instead of
// per-locale so every visitor sees the same symbol regardless of the
// server's locale support.
const SYMBOL_OVERRIDES: Record<string, string> = { ZAR: "R" };

function currencyFor(countryCode: string): { isoCode: string; symbol: string } {
  // A market's currency is whatever its synced prices actually came back in —
  // every variant shares one, so the first is representative.
  const isoCode =
    syncedProduct.variants[0]?.pricesByMarket?.[countryCode]?.currencyCode ??
    syncedProduct.currencyCode;
  const symbol =
    SYMBOL_OVERRIDES[isoCode] ??
    new Intl.NumberFormat("en", { style: "currency", currency: isoCode })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ??
    isoCode;
  return { isoCode, symbol };
}

function toLocalizationCountry(code: string): LocalizationCountry {
  return {
    isoCode: code,
    name: regionNames.of(code) ?? code,
    currency: currencyFor(code),
  };
}

/**
 * GET /api/localization — this store's curated markets (the ones with their
 * own Shopify price list, discovered and synced by scripts/sync-product.ts
 * — see data/product.json's `markets`), the shopper's saved country, and a
 * default guessed from edge geolocation. No live Shopify call: this reads the
 * synced catalog only, same as the product page. Ported from the AccuPenPro
 * reference to the same fully-static model.
 */
export async function GET(request: NextRequest) {
  const countries = syncedMarkets.map(toLocalizationCountry);

  const selected = await readSelectedCountry();
  const detected = detectVisitorCountry(request.headers);
  const defaultCode =
    (detected && syncedMarkets.includes(detected) ? detected : null) ??
    (syncedMarkets.includes("US") ? "US" : syncedMarkets[0]) ??
    null;

  return NextResponse.json(
    {
      defaultCountry: defaultCode ? toLocalizationCountry(defaultCode) : null,
      countries,
      selected,
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
