"use client";

import {
  createContext,
  useCallback,
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
  setCountry: (code: string) => void;
  requestPrices: (variantIds: string[]) => void;
  localizedPriceFor: (id: string) => LocalizedPrice | null;
  isPriceLoading: (id: string) => boolean;
};

const LocalizationContext = createContext<LocalizationValue | null>(null);

/**
 * Fetches the Shopify Markets country/currency list once, then overlays live
 * Shopify-converted prices (via @inContext) onto the base prices. Requests for
 * visible variants are coalesced into a single POST. Switching country
 * discards the price cache so every amount re-fetches instantly.
 */
export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<LocalizationCountry[]>([]);
  const [defaultCountry, setDefaultCountry] =
    useState<LocalizationCountry | null>(null);
  const [country, setCountryState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [priceMap, setPriceMap] = useState<Record<string, LocalizedPrice>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  /** variantId → country it was fetched for. Re-fetched whenever the country differs. */
  const requestedRef = useRef<Map<string, string>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const flushTimer = useRef<number | null>(null);
  const countryRef = useRef<string | null>(null);

  const effectiveCountry = country ?? defaultCountry?.isoCode ?? null;
  countryRef.current = effectiveCountry;

  /* Load the configured countries + the visitor's saved choice. */
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

  /* Country changed — every cached price is now wrong. Consumers re-request
     because their requested id is now tagged with a stale country; pending ids
     survive and flush against the new country (flush reads the live ref). */
  useEffect(() => {
    setPriceMap({});
    setLoadingIds(new Set());
  }, [effectiveCountry]);

  const flush = useCallback(() => {
    flushTimer.current = null;
    const ids = [...pendingRef.current];
    pendingRef.current = new Set();
    if (ids.length === 0) return;
    const country = countryRef.current;
    if (!country) {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }
    setLoadingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    fetch("/api/localization/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantIds: ids }),
    })
      .then((r) => r.json())
      .then((data) => {
        // Drop a response that raced a currency switch — its amounts are for
        // the old country.
        if (countryRef.current !== country) return;
        if (data.prices) setPriceMap((prev) => ({ ...prev, ...data.prices }));
      })
      .catch(() => {})
      .finally(() => {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      });
  }, []);

  const requestPrices = useCallback(
    (variantIds: string[]) => {
      const country = countryRef.current;
      if (!country) return;
      const toRequest = variantIds.filter(
        (id) =>
          id &&
          requestedRef.current.get(id) !== country &&
          !pendingRef.current.has(id),
      );
      if (toRequest.length === 0) return;
      toRequest.forEach((id) => {
        requestedRef.current.set(id, country);
        pendingRef.current.add(id);
      });
      if (flushTimer.current === null) {
        flushTimer.current = window.setTimeout(flush, 60);
      }
    },
    // Effective country is a dep so consumers re-run their request effect when
    // the currency changes — every visible variant re-fetches in the new
    // currency instantly (their cached id is tagged with a stale country).
    [flush, effectiveCountry],
  );

  const setCountry = useCallback((code: string) => {
    // Optimistic — flip instantly so prices re-fetch; persist in background.
    setCountryState(code === "AUTO" ? null : code);
    fetch("/api/localization/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: code }),
    }).catch(() => {});
  }, []);

  const localizedPriceFor = useCallback(
    (id: string) => priceMap[id] ?? null,
    [priceMap],
  );
  const isPriceLoading = useCallback(
    (id: string) => loadingIds.has(id),
    [loadingIds],
  );

  const value = useMemo<LocalizationValue>(
    () => ({
      ready,
      countries,
      defaultCountry,
      country,
      setCountry,
      requestPrices,
      localizedPriceFor,
      isPriceLoading,
    }),
    [
      ready,
      countries,
      defaultCountry,
      country,
      setCountry,
      requestPrices,
      localizedPriceFor,
      isPriceLoading,
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
 * Resolves the price to display for a variant: the live Shopify-converted
 * price when one has landed, otherwise the catalog's base values.
 */
export function useLocalizedAmount(
  variantId: string | null,
  fallbackAmount: number,
  fallbackCurrency: string,
  fallbackCompareAt: number | null,
) {
  const { requestPrices, localizedPriceFor, isPriceLoading } =
    useLocalization();

  useEffect(() => {
    if (variantId) requestPrices([variantId]);
  }, [variantId, requestPrices]);

  const localized = variantId ? localizedPriceFor(variantId) : null;
  const loading = variantId ? isPriceLoading(variantId) : false;

  return useMemo(
    () => ({
      amount: localized ? Number.parseFloat(localized.amount) : fallbackAmount,
      currencyCode: localized?.currencyCode ?? fallbackCurrency,
      compareAtAmount: localized
        ? localized.compareAtAmount != null
          ? Number.parseFloat(localized.compareAtAmount)
          : null
        : fallbackCompareAt,
      loading: loading && !localized,
      isLocalized: Boolean(localized),
    }),
    [localized, fallbackAmount, fallbackCurrency, fallbackCompareAt, loading],
  );
}

/**
 * Price for one of our ten styles: resolves the style's Shopify variant and
 * overlays the live Shopify-converted amount for the selected currency,
 * falling back to the synced base USD price until a live one lands.
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
