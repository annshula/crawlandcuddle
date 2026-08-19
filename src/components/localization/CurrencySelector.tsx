"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useLocalization } from "@/components/providers/LocalizationProvider";
import { Icon } from "@/components/ui/Icon";
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
 * Currency switcher. One row per currency Shopify Markets actually publishes
 * (deduped), with a type-to-search filter. Picking a currency re-fetches every
 * price from Shopify so amounts update instantly.
 *
 * `bar` is the desktop header pill (symbol + code). `drawer` is the mobile
 * menu's icon-only circle, sized and toned to sit beside the account and bag
 * buttons; its panel opens upward because that row lives at the drawer's foot.
 */
export function CurrencySelector({
  variant = "bar",
}: {
  variant?: "bar" | "drawer";
}) {
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

  const isDrawer = variant === "drawer";
  const triggerClass = isDrawer
    ? "grid size-12 place-items-center rounded-full border border-paper/25 text-paper transition-colors duration-300 hover:bg-paper/10"
    : "flex items-center gap-2 rounded-full border border-ink/15 px-3.5 py-2.5 font-label text-[0.68rem] tracking-[0.14em] text-ink uppercase transition-colors duration-300 hover:border-rose-600 hover:text-rose-600";

  /* The country list is a round trip away. Hold the control's own footprint
     with a spinner rather than rendering nothing, so the header and the
     drawer's icon row do not reflow when it lands. */
  if (!ready) {
    return (
      <span
        role="status"
        aria-label="Loading currencies"
        className={cn(
          triggerClass,
          "pointer-events-none",
          !isDrawer && "min-w-[5.5rem] justify-center",
        )}
      >
        <Icon
          name="spinner"
          strokeWidth={2}
          className={cn(
            "size-4 animate-spin",
            isDrawer ? "text-paper/70" : "text-ink-faint",
          )}
        />
      </span>
    );
  }

  if (options.length <= 1) return null;

  /* Match on currency, not country: the saved country may be any country in a
     currency's market (FR), while the row for it is keyed to the canonical one
     (DE for EUR) — comparing countries would show "Auto" for a real pick. */
  const activeCurrency =
    (country != null
      ? countries.find((c) => c.isoCode === country)?.currency.isoCode
      : defaultCountry?.currency.isoCode) ?? null;
  const current = options.find((o) => o.currencyCode === activeCurrency);

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
        aria-label={
          current
            ? `Currency: ${current.currencyCode}. Change currency`
            : "Select currency"
        }
        className={cn(
          triggerClass,
          open &&
            (isDrawer
              ? "border-rose-200/60 bg-paper/10"
              : "border-rose-600 text-rose-600"),
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "leading-none",
            isDrawer ? "text-base font-semibold" : "text-[0.9rem]",
          )}
        >
          {current?.symbol ?? "💱"}
        </span>
        {!isDrawer && <span>{current?.currencyCode ?? "Auto"}</span>}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 overflow-hidden rounded-panel border border-hairline bg-paper shadow-drift",
            isDrawer
              ? "bottom-full left-1/2 mb-2 w-[min(20rem,calc(100vw-3rem))] -translate-x-1/2"
              : "top-full right-0 mt-2 w-80",
          )}
        >
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
                  aria-selected={
                    country != null && option.currencyCode === activeCurrency
                  }
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
