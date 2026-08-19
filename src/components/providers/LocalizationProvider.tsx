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
  /** True once a country is known, i.e. a live localized price is on its way. */
  canLocalize: boolean;
  setCountry: (code: string) => void;
  requestPrices: (variantIds: string[]) => void;
  localizedPriceFor: (id: string) => LocalizedPrice | null;
  /** True once this id's fetch for the current country finished — price or not. */
  isPriceSettled: (id: string) => boolean;
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
  /* Ids whose fetch for the current country has come back, with or without a
     price. Consumers show a placeholder until an id is either priced or
     settled, so a base-currency amount never flashes before the real one. */
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());

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
    setSettledIds(new Set());
  }, [effectiveCountry]);

  const flush = useCallback(() => {
    flushTimer.current = null;
    const ids = [...pendingRef.current];
    pendingRef.current = new Set();
    if (ids.length === 0) return;
    const country = countryRef.current;
    /* Marking these ids settled says "no live price is coming for them" — only
       true for the country this batch was sent for. A switch mid-flight resets
       the settled set and re-requests, so settling the old batch afterwards
       would let the base price flash while the new one is still loading. */
    const settle = () => {
      if (countryRef.current !== country) return;
      setSettledIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    };
    if (!country) {
      settle();
      return;
    }
    fetch("/api/localization/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The country rides along so the answer matches what the shopper sees
      // right now, rather than whatever the cookie happens to hold — the
      // cookie write for a currency switch is a separate, racing request.
      body: JSON.stringify({ variantIds: ids, country }),
    })
      .then((r) => r.json())
      .then((data) => {
        // Drop a response that raced a currency switch — its amounts are for
        // the old country.
        if (countryRef.current !== country) return;
        if (data.prices) setPriceMap((prev) => ({ ...prev, ...data.prices }));
      })
      .catch(() => {})
      // Settle either way: a failed fetch must fall back to the base price
      // rather than leave the placeholder up forever.
      .finally(settle);
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
    // It is deliberately not read in the body, so the lint rule cannot see it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const isPriceSettled = useCallback(
    (id: string) => settledIds.has(id),
    [settledIds],
  );
  const canLocalize = effectiveCountry !== null;

  const value = useMemo<LocalizationValue>(
    () => ({
      ready,
      countries,
      defaultCountry,
      country,
      canLocalize,
      setCountry,
      requestPrices,
      localizedPriceFor,
      isPriceSettled,
    }),
    [
      ready,
      countries,
      defaultCountry,
      country,
      canLocalize,
      setCountry,
      requestPrices,
      localizedPriceFor,
      isPriceSettled,
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
 *
 * `pending` is the important part. Rendering the base amount while the live
 * one is in flight made every page flash a base-currency price before
 * snapping to the shopper's, on first load and on every switch. It is true
 * from the first render until we either have the real amount or know none is
 * coming (no country, or the fetch failed), so callers can hold a placeholder
 * and skip the wrong number entirely.
 */
export function useLocalizedAmount(
  variantId: string | null,
  fallbackAmount: number,
  fallbackCurrency: string,
  fallbackCompareAt: number | null,
) {
  const {
    ready,
    canLocalize,
    requestPrices,
    localizedPriceFor,
    isPriceSettled,
  } = useLocalization();

  useEffect(() => {
    if (variantId) requestPrices([variantId]);
  }, [variantId, requestPrices]);

  const localized = variantId ? localizedPriceFor(variantId) : null;
  const settled = variantId ? isPriceSettled(variantId) : true;
  // Before the country list lands we do not yet know whether a live price is
  // coming, so treat that window as pending too.
  const pending = !ready || (canLocalize && !localized && !settled);

  return useMemo(
    () => ({
      amount: localized ? Number.parseFloat(localized.amount) : fallbackAmount,
      currencyCode: localized?.currencyCode ?? fallbackCurrency,
      compareAtAmount: localized
        ? localized.compareAtAmount != null
          ? Number.parseFloat(localized.compareAtAmount)
          : null
        : fallbackCompareAt,
      pending,
      isLocalized: Boolean(localized),
    }),
    [localized, fallbackAmount, fallbackCurrency, fallbackCompareAt, pending],
  );
}

/**
 * Cart amounts in the shopper's selected currency. Cart lines carry base-price
 * cents from the catalogue, which never change with the currency, so the whole
 * cart is re-priced here from the same live Shopify amounts the product pages
 * use.
 *
 * All-or-nothing on purpose: a half-loaded batch must never render one
 * currency's symbol over another currency's numbers, so the cart stays
 * `pending` until every line has its live amount (or none is coming).
 */
export function useLocalizedCart(lines: { slug: string; qty: number }[]) {
  const {
    ready,
    canLocalize,
    requestPrices,
    localizedPriceFor,
    isPriceSettled,
  } = useLocalization();

  /* Keyed on the slug list so the effect re-runs when the cart changes, not on
     every render of a freshly-built lines array. */
  const slugKey = lines.map((l) => l.slug).join(",");
  const variantIds = useMemo(
    () =>
      slugKey
        ? slugKey
            .split(",")
            .map((slug) => getVariantForStyle(slug).id)
            .filter(Boolean)
        : [],
    [slugKey],
  );

  useEffect(() => {
    if (variantIds.length > 0) requestPrices(variantIds);
  }, [variantIds, requestPrices]);

  const localized = variantIds.map((id) => localizedPriceFor(id));
  const allLanded =
    variantIds.length > 0 && localized.every((price) => price !== null);
  const allSettled = variantIds.every((id) => isPriceSettled(id));
  const pending =
    variantIds.length > 0 &&
    (!ready || (canLocalize && !allLanded && !allSettled));

  const unitBySlug = useMemo(() => {
    const base = productPriceCents / 100;
    const map = new Map<string, number>();
    for (const { slug } of lines) {
      const id = getVariantForStyle(slug).id;
      const price = allLanded && id ? localizedPriceFor(id) : null;
      map.set(slug, price ? Number.parseFloat(price.amount) : base);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugKey, allLanded, localizedPriceFor]);

  const currencyCode = allLanded
    ? (localized[0]?.currencyCode ?? productCurrency)
    : productCurrency;

  const unitAmountFor = (slug: string) =>
    unitBySlug.get(slug) ?? productPriceCents / 100;
  const lineTotalFor = (slug: string, qty: number) => unitAmountFor(slug) * qty;
  const subtotal = lines.reduce(
    (total, line) => total + lineTotalFor(line.slug, line.qty),
    0,
  );

  return { currencyCode, unitAmountFor, lineTotalFor, subtotal, pending };
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
