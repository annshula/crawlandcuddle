"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getVariantForStyle,
  productCompareAtCents,
  productCurrency,
  productPriceCents,
} from "@/lib/catalog";
import { applyPackDiscount, getDisplayPackTier } from "@/content/site";

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

/** One variant's price in the shopper's country currency, as Shopify reports it. */
type VariantPrice = {
  amount: number;
  compareAtAmount: number | null;
  currencyCode: string;
};

type LocalizationValue = {
  ready: boolean;
  /** True while the live prices for the current country are still loading. */
  pricesLoading: boolean;
  /** The variant's live price for the shopper's country, or null until loaded. */
  priceFor: (variantId: string) => VariantPrice | null;
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
 * GET /api/localization), then asks Shopify for every variant's price in the
 * shopper's country (GET /api/localization/prices -> Storefront `@inContext`).
 * Nothing is snapshotted or converted here: amounts and currency are exactly
 * what Shopify Markets returns. Until they arrive - and if the request fails -
 * `useLocalizedAmount`/`useLocalizedCart` fall back to the synced shop-currency
 * base price, so a price is always renderable.
 */
export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<LocalizationCountry[]>([]);
  const [defaultCountry, setDefaultCountry] =
    useState<LocalizationCountry | null>(null);
  const [country, setCountryState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [prices, setPrices] = useState<{
    country: string;
    byVariant: Record<string, VariantPrice>;
  } | null>(null);
  const [loadingCountry, setLoadingCountry] = useState<string | null>(null);
  // Per-country response cache so flipping back to a country is instant.
  const priceCache = useRef(new Map<string, Record<string, VariantPrice>>());

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

  /* Ask Shopify for the live prices whenever the effective country changes. */
  useEffect(() => {
    if (!effectiveCountry) return;
    const cached = priceCache.current.get(effectiveCountry);
    if (cached) {
      setPrices({ country: effectiveCountry, byVariant: cached });
      return;
    }
    let cancelled = false;
    setLoadingCountry(effectiveCountry);
    fetch(`/api/localization/prices?country=${effectiveCountry}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.ok) return;
        priceCache.current.set(effectiveCountry, data.prices);
        setPrices({ country: effectiveCountry, byVariant: data.prices });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCountry(null);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveCountry]);

  // Only ever show prices that belong to the country in effect - never a stale
  // currency left over from the previous pick.
  const activePrices =
    prices && prices.country === effectiveCountry ? prices : null;
  const priceFor = (variantId: string) =>
    activePrices?.byVariant[variantId] ?? null;

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
    () => ({
      ready,
      pricesLoading:
        loadingCountry !== null && loadingCountry === effectiveCountry,
      priceFor,
      countries,
      defaultCountry,
      country,
      canLocalize,
      setCountry,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      loadingCountry,
      effectiveCountry,
      activePrices,
      countries,
      defaultCountry,
      country,
      canLocalize,
    ],
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
 * Resolves the price to display for a variant: Shopify's live price for the
 * shopper's country once loaded, otherwise the caller's fallback.
 *
 * `pending` reflects only whether *localization* has resolved yet — it is
 * NOT "do we have a price to show". The caller's fallback (the product's
 * server-rendered shop-currency price) is always known synchronously, on
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
  const { ready, pricesLoading, country, defaultCountry, priceFor } =
    useLocalization();
  const effectiveCountry = country ?? defaultCountry?.isoCode ?? null;

  const resolved = variantId ? priceFor(variantId) : null;
  const pending = !ready || pricesLoading;

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
 * live Shopify prices as useLocalizedAmount.
 * The pack tier (and its % off) is derived from each line's own `qty` via
 * `getDisplayPackTier`/`applyPackDiscount` — qty 2 always prices as the
 * 2-pack, qty 3 AND UP all price at the 3-pack's per-unit rate (see
 * content/site.ts's packTiers / getDisplayPackTier doc comments) rather
 * than dropping back to full price the moment qty isn't exactly 3. There is
 * no separate pack flag to pass or fall out of sync with the real quantity.
 */
export function useLocalizedCart(lines: { slug: string; qty: number }[]) {
  const { ready, pricesLoading, priceFor } = useLocalization();
  const pending = !ready || pricesLoading;

  const baseUnitAmountFor = (slug: string) => {
    const variant = getVariantForStyle(slug);
    return priceFor(variant.id)?.amount ?? variant.price;
  };
  // getDisplayPackTier (not getPackTier): qty 4, 5, 6... still resolve to
  // the 3-pack's per-unit rate instead of silently falling back to the
  // full, undiscounted single-unit price — the bug being fixed here was
  // the drawer's "$X × N" line showing plain full price past qty 3. The
  // total is `perUnit * qty` explicitly (not applyPackDiscount's own total,
  // which is pinned to the tier's fixed size) so it's always the real line
  // total for however many units are actually in the line.
  const unitAmountFor = (slug: string, qty = 1) =>
    applyPackDiscount(baseUnitAmountFor(slug), getDisplayPackTier(qty))
      .perUnit;
  const lineTotalFor = (slug: string, qty: number) =>
    Math.round(unitAmountFor(slug, qty) * qty * 100) / 100;

  const currencyCode =
    (lines.length > 0
      ? priceFor(getVariantForStyle(lines[0]!.slug).id)?.currencyCode
      : null) ?? productCurrency;

  const subtotal = lines.reduce(
    (total, line) => total + lineTotalFor(line.slug, line.qty),
    0,
  );

  return { currencyCode, unitAmountFor, lineTotalFor, subtotal, pending };
}

/**
 * Price for one of our ten styles: resolves the style's Shopify variant and
 * overlays Shopify's live amount for the selected country's currency, falling
 * back to the synced base price until it has loaded.
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
