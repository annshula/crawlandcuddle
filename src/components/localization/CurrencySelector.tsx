"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  useLocalization,
  type LocalizationCountry,
} from "@/components/providers/LocalizationProvider";
import {
  CANONICAL_COUNTRY_BY_CURRENCY,
  currencyDisplayName,
} from "@/lib/localization/format";
import { cn } from "@/lib/utils";

type Option = {
  countryCode: string;
  currencyCode: string;
  name: string;
  symbol: string;
};

/**
 * Header currency switcher. One row per currency Shopify Markets actually
 * publishes (deduped), with a type-to-search filter. Picking a currency
 * re-fetches every price from Shopify so amounts update instantly.
 */
export function CurrencySelector() {
  const { ready, countries, defaultCountry, country, setCountry } =
    useLocalization();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const options = useMemo<Option[]>(() => {
    const seen = new Map<string, Option>();
    for (const entry of countries) {
      const currencyCode = entry.currency.isoCode;
      if (seen.has(currencyCode)) continue;
      const canonical = CANONICAL_COUNTRY_BY_CURRENCY[currencyCode];
      const countryCode =
        canonical && countries.some((c) => c.isoCode === canonical)
          ? canonical
          : entry.isoCode;
      seen.set(currencyCode, {
        countryCode,
        currencyCode,
        name: currencyDisplayName(currencyCode),
        symbol: entry.currency.symbol,
      });
    }
    return [...seen.values()];
  }, [countries]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (o) =>
        o.currencyCode.toLowerCase().includes(needle) ||
        o.name.toLowerCase().includes(needle),
    );
  }, [options, query]);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) setQuery("");
      return next;
    });
  };

  /* Focus the search box the moment the panel opens. */
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready || options.length <= 1) return null;

  const current =
    country != null
      ? options.find((o) => o.countryCode === country)
      : options.find(
          (o) => o.currencyCode === defaultCountry?.currency.isoCode,
        );

  const pick = (code: string) => {
    setCountry(code);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select currency"
        className={cn(
          "flex items-center gap-2 rounded-full border border-ink/15 px-3.5 py-2.5 font-label text-[0.68rem] tracking-[0.14em] text-ink uppercase transition-colors duration-300 hover:border-rose-600 hover:text-rose-600",
          open && "border-rose-600 text-rose-600",
        )}
      >
        <span aria-hidden="true" className="text-[0.9rem] leading-none">
          {current?.symbol ?? "💱"}
        </span>
        <span>{current?.currencyCode ?? "Auto"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-panel border border-hairline bg-paper shadow-drift">
          {/* Auto row */}
          <div className="p-1.5 pb-0">
            <button
              type="button"
              role="option"
              aria-selected={country == null}
              onClick={() => pick("AUTO")}
              className="flex w-full items-center justify-between gap-2 rounded-tag px-3 py-2.5 text-left transition-colors duration-200 hover:bg-blush"
            >
              <span className="font-label text-[0.68rem] tracking-[0.14em] text-ink uppercase">
                Auto
              </span>
              <span className="text-caption text-ink-faint">
                based on your location
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pt-1 pb-1">
            <div className="flex items-center gap-2 rounded-tag border border-hairline bg-cream px-3 focus-within:border-rose-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-4 shrink-0 text-ink-faint"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                role="searchbox"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search currency…"
                aria-label="Search currencies"
                className="w-full bg-transparent py-2 text-body-sm text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
          </div>

          {/* Scrollable list */}
          <ul
            role="listbox"
            aria-label="Currencies"
            className="max-h-[min(60vh,20rem)] overflow-y-auto p-1.5"
            data-lenis-prevent
          >
            {filtered.map((option) => (
              <li key={option.countryCode}>
                <button
                  type="button"
                  role="option"
                  aria-selected={country === option.countryCode}
                  onClick={() => pick(option.countryCode)}
                  className="flex w-full items-center justify-between gap-3 rounded-tag px-3 py-2.5 text-left transition-colors duration-200 hover:bg-blush"
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="w-5 shrink-0 text-center text-[0.9rem] leading-none"
                    >
                      {option.symbol}
                    </span>
                    <span className="font-headline text-sm text-ink">
                      {option.currencyCode}
                    </span>
                  </span>
                  <span className="truncate text-caption text-ink-faint">
                    {option.name}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-caption text-ink-faint">
                No currencies match “{query}”.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
