"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getVariantForStyle,
  priceForMarket,
  productCompareAtCents,
  productCurrency,
  productPriceCents,
} from "@/lib/catalog";
import { applyPackDiscount, getPackTier } from "@/content/site";

export type LocalizedPrice = {
  amount: string;
  currencyCode: string;
  compareAtAmount: string | null;
};

export type LocalizationCountry = {
  isoCode: string;
  name: string;
  currency: { isoCode: string; symbol: string };
};

type LocalizationValue = {
  ready: boolean;
  countries: LocalizationCountry[];
  defaultCountry: LocalizationCountry | null;
  /** The shopper's explicit country pick, or null for "auto". */
  country: string | null;
  /** True once a country is known, i.e. localized prices are resolvable. */
  canLocalize: boolean;
  setCountry: (code: string) => void;
};

const LocalizationContext = createContext<LocalizationValue | null>(null);

/**
 * Fetches the curated market list once (data/product.json's `markets`, via
 * GET /api/localization — no live Shopify call, see scripts/sync-product.ts).
 * Pricing itself is synchronous: every variant's per-market price is already
 * embedded in the synced catalog, so `useLocalizedAmount`/`useLocalizedCart`
 * below are a plain lookup (lib/catalog.ts's priceForMarket), not a fetch —
 * there is no network round trip and no per-price "pending" state, only the
 * one-time "has the country list loaded yet". Ported from the AccuPenPro
 * reference to match its fully-static model.
 */
export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<LocalizationCountry[]>([]);
  const [defaultCountry, setDefaultCountry] =
    useState<LocalizationCountry | null>(null);
  const [country, setCountryState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  /* Load the configured markets + the visitor's saved choice. */
  useEffect(() => {
    fetch("/api/localization")
      .then((r) => r.json())
      .then((data) => {
        setCountries(Array.isArray(data.countries) ? data.countries : []);
        setDefaultCountry(data.defaultCountry ?? null);
        setCountryState(
          typeof data.selected === "string" ? data.selected : null,
        );
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const effectiveCountry = country ?? defaultCountry?.isoCode ?? null;
  const canLocalize = effectiveCountry !== null;

  const setCountry = (code: string) => {
    // Optimistic — flip instantly so prices re-resolve; persist in background.
    setCountryState(code === "AUTO" ? null : code);
    fetch("/api/localization/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: code }),
    }).catch(() => {});
  };

  const value = useMemo<LocalizationValue>(
    () => ({ ready, countries, defaultCountry, country, canLocalize, setCountry }),
    [ready, countries, defaultCountry, country, canLocalize],
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const ctx = useContext(LocalizationContext);
  if (!ctx)
    throw new Error(
      "useLocalization must be used inside <LocalizationProvider>",
    );
  return ctx;
}

/**
 * Resolves the price to display for a variant: the synced catalog's price
 * for the shopper's country when known, otherwise the caller's fallback.
 *
 * `pending` reflects only whether *localization* has resolved yet — it is
 * NOT "do we have a price to show". The caller's fallback (the product's
 * server-rendered default-market price) is always known synchronously, on
 * the very first render, server-side included. `amount`/`currencyCode`/
 * `compareAtAmount` below always resolve to a real, displayable price;
 * `pending` is exposed separately so a caller that wants to show a "still
 * localizing" affordance still can, without ever blanking the price itself.
 */
export function useLocalizedAmount(
  variantId: string | null,
  fallbackAmount: number,
  fallbackCurrency: string,
  fallbackCompareAt: number | null,
) {
  const { ready, country, defaultCountry } = useLocalization();
  const effectiveCountry = country ?? defaultCountry?.isoCode ?? null;

  const resolved = variantId ? priceForMarket(variantId, effectiveCountry) : null;
  const pending = !ready;

  return useMemo(
    () => ({
      amount: resolved ? resolved.amount : fallbackAmount,
      currencyCode: resolved ? resolved.currencyCode : fallbackCurrency,
      compareAtAmount: resolved
        ? resolved.compareAtAmount
        : fallbackCompareAt,
      pending,
      isLocalized: Boolean(resolved && effectiveCountry),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      resolved?.amount,
      resolved?.currencyCode,
      resolved?.compareAtAmount,
      fallbackAmount,
      fallbackCurrency,
      fallbackCompareAt,
      pending,
      effectiveCountry,
    ],
  );
}

/**
 * Cart amounts in the shopper's selected currency, resolved from the same
 * synced per-market prices as useLocalizedAmount — synchronous, no fetch.
 * The pack tier (and its % off) is derived from each line's own `qty` via
 * `getPackTier`/`applyPackDiscount` — qty 2 always prices as the 2-pack, qty
 * 3 always as the 3-pack, matching the Shopify automatic discount so the
 * drawer/summary total agrees with what checkout actually charges (see
 * content/site.ts's packTiers). There is no separate pack flag to pass or
 * fall out of sync with the real quantity.
 */
export function useLocalizedCart(lines: { slug: string; qty: number }[]) {
  const { ready, country, defaultCountry } = useLocalization();
  const effectiveCountry = country ?? defaultCountry?.isoCode ?? null;
  const pending = !ready;

  const baseUnitAmountFor = (slug: string) =>
    priceForMarket(getVariantForStyle(slug).id, effectiveCountry).amount;
  const unitAmountFor = (slug: string, qty = 1) =>
    applyPackDiscount(baseUnitAmountFor(slug), getPackTier(qty)).perUnit;
  const lineTotalFor = (slug: string, qty: number) =>
    applyPackDiscount(baseUnitAmountFor(slug), getPackTier(qty)).total;

  const currencyCode =
    lines.length > 0
      ? priceForMarket(getVariantForStyle(lines[0]!.slug).id, effectiveCountry)
          .currencyCode
      : productCurrency;

  const subtotal = lines.reduce(
    (total, line) => total + lineTotalFor(line.slug, line.qty),
    0,
  );

  return { currencyCode, unitAmountFor, lineTotalFor, subtotal, pending };
}

/**
 * Price for one of our ten styles: resolves the style's Shopify variant and
 * overlays the synced per-market amount for the selected currency, falling
 * back to the synced base USD price until localization is ready.
 */
export function useStylePrice(slug: string) {
  const variant = getVariantForStyle(slug);
  return useLocalizedAmount(
    variant.id || null,
    productPriceCents / 100,
    productCurrency,
    productCompareAtCents / 100,
  );
}
