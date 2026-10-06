import { NextRequest, NextResponse } from "next/server";

import { readSelectedCountry } from "@/lib/localization/country";
import { detectVisitorCountry } from "@/lib/localization/geo";
import { syncedProduct, syncedMarkets } from "@/lib/catalog";
import { isStorefrontConfigured } from "@/lib/shopify/config";
import { getLocalization } from "@/lib/shopify/localization-service";
import type { LocalizationCountry } from "@/components/providers/LocalizationProvider";

export const dynamic = "force-dynamic";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

// Intl.NumberFormat("en", …) falls back to the bare ISO code for a currency
// with no strong symbol convention in generic English locale data (ZAR is
// one — only "en-ZA" resolves it to "R"). Overridden here instead of
// per-locale so every visitor sees the same symbol regardless of the
// server's locale support.
const SYMBOL_OVERRIDES: Record<string, string> = { ZAR: "R" };

type Currency = { isoCode: string; symbol: string };

function symbolFor(isoCode: string): string {
  return (
    SYMBOL_OVERRIDES[isoCode] ??
    new Intl.NumberFormat("en", { style: "currency", currency: isoCode })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ??
    isoCode
  );
}

// Country → currency as Shopify Markets publishes it (live Storefront
// `localization` query). Cached in-process so the selector doesn't hit Shopify
// on every page load; currencies change far less often than prices do.
const CURRENCY_TTL_MS = 60 * 60 * 1000;
let currencyCache: { at: number; byCountry: Map<string, Currency> } | null =
  null;

async function currencyByCountry(): Promise<Map<string, Currency>> {
  if (currencyCache && Date.now() - currencyCache.at < CURRENCY_TTL_MS) {
    return currencyCache.byCountry;
  }
  const byCountry = new Map<string, Currency>();
  if (isStorefrontConfigured()) {
    try {
      const { availableCountries } = await getLocalization();
      for (const c of availableCountries) {
        byCountry.set(c.isoCode, {
          isoCode: c.currency.isoCode,
          symbol: SYMBOL_OVERRIDES[c.currency.isoCode] ?? c.currency.symbol,
        });
      }
      currencyCache = { at: Date.now(), byCountry };
    } catch {
      // Storefront unreachable — fall through to the shop currency below.
      return currencyCache?.byCountry ?? byCountry;
    }
  }
  return byCountry;
}

function toLocalizationCountry(
  code: string,
  currencies: Map<string, Currency>,
): LocalizationCountry {
  const shopIso = syncedProduct.currencyCode;
  return {
    isoCode: code,
    name: regionNames.of(code) ?? code,
    currency: currencies.get(code) ?? {
      isoCode: shopIso,
      symbol: symbolFor(shopIso),
    },
  };
}

/**
 * GET /api/localization — this store's curated markets (discovered and synced
 * by scripts/sync-product.ts — see data/product.json's `markets`), each with
 * the currency Shopify reports for it, plus the shopper's saved country and a
 * default guessed from edge geolocation. Amounts are not part of this
 * response: they come live from GET /api/localization/prices.
 */
export async function GET(request: NextRequest) {
  const currencies = await currencyByCountry();
  const countries = syncedMarkets.map((code) =>
    toLocalizationCountry(code, currencies),
  );

  const selected = await readSelectedCountry();
  const detected = detectVisitorCountry(request.headers);
  const defaultCode =
    (detected && syncedMarkets.includes(detected) ? detected : null) ??
    (syncedMarkets.includes("US") ? "US" : syncedMarkets[0]) ??
    null;

  return NextResponse.json(
    {
      defaultCountry: defaultCode
        ? toLocalizationCountry(defaultCode, currencies)
        : null,
      countries,
      selected,
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
