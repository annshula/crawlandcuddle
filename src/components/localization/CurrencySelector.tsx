"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useLocalization } from "@/components/providers/LocalizationProvider";
import { Icon } from "@/components/ui/Icon";
import {
  CANONICAL_COUNTRY_BY_CURRENCY,
  currencyDisplayName,
} from "@/lib/localization/format";
import { useScrollLock } from "@/lib/scroll-lock";
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
 * `bar` is the desktop header pill (symbol + code) and opens as a popover
 * anchored under the trigger. `drawer` is the mobile menu's icon-only circle;
 * its list opens as a bottom sheet portalled to <body>, because a popover
 * anchored to a button sitting in a centred icon row inside a transformed
 * drawer had nowhere to go but off the side of the screen.
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
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const isDrawer = variant === "drawer";

  useEffect(() => setMounted(true), []);

  // The sheet covers the page, so the page must stop moving underneath it.
  useScrollLock(isDrawer && open);

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

  /* Focus the search box the moment the panel opens — except on the sheet,
     where it would summon the keyboard over the list the shopper came to
     read. There they tap the field themselves. */
  useEffect(() => {
    if (open && !isDrawer) searchRef.current?.focus();
  }, [open, isDrawer]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      // The sheet is portalled outside rootRef, so it needs its own check or
      // every tap inside it would read as "outside" and close it.
      if (rootRef.current?.contains(target)) return;
      if (sheetRef.current?.contains(target)) return;
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

  const triggerClass = isDrawer
    ? "grid size-12 place-items-center rounded-full border border-paper/25 text-paper transition-colors duration-300 hover:bg-paper/10"
    : "flex items-center gap-2 rounded-full border border-ink/15 px-3.5 py-2 font-label text-[0.68rem] tracking-[0.14em] text-ink uppercase transition-colors duration-300 hover:border-rose-600 hover:text-rose-600";

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
          !isDrawer && "min-w-22 justify-center",
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

  const list = (
    <CurrencyList
      searchRef={searchRef}
      query={query}
      setQuery={setQuery}
      filtered={filtered}
      country={country}
      activeCurrency={activeCurrency}
      onPick={pick}
      size={isDrawer ? "sheet" : "popover"}
    />
  );

  return (
    <div ref={rootRef} className={isDrawer ? undefined : "relative"}>
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

      {open && !isDrawer && (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-panel border border-hairline bg-paper shadow-drift">
          {list}
        </div>
      )}

      {/* Portalled to <body>: the mobile drawer animates on a transform, which
          would otherwise trap a `position: fixed` sheet inside its box. */}
      {open &&
        isDrawer &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-70" role="dialog" aria-modal="true">
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className="sheet-scrim absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            />

            <div
              ref={sheetRef}
              className="sheet-rise absolute inset-x-0 bottom-0 flex max-h-[85svh] flex-col overflow-hidden rounded-t-[1.75rem] bg-paper pb-[env(safe-area-inset-bottom)] shadow-drift"
            >
              {/* Grab handle — the affordance that says "this can be
                  dismissed" before anyone reads a word. */}
              <span
                aria-hidden="true"
                className="mx-auto mt-3 h-1 w-11 shrink-0 rounded-pill bg-hairline"
              />

              <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-4 pb-1">
                <h2 className="font-display text-heading-sm text-ink uppercase">
                  Currency
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close currency picker"
                  className="-mr-2 grid size-11 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-blush hover:text-rose-600"
                >
                  <Icon name="close" className="size-4" strokeWidth={2.2} />
                </button>
              </div>

              {list}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/**
 * The picker's contents, identical in the desktop popover and the mobile
 * sheet. Only the row height and list cap differ — a sheet gets thumb-sized
 * rows and the height the viewport allows.
 */
function CurrencyList({
  searchRef,
  query,
  setQuery,
  filtered,
  country,
  activeCurrency,
  onPick,
  size,
}: {
  searchRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (value: string) => void;
  filtered: Option[];
  country: string | null;
  activeCurrency: string | null;
  onPick: (code: string) => void;
  size: "popover" | "sheet";
}) {
  const isSheet = size === "sheet";
  const rowClass = cn(
    "flex w-full items-center justify-between gap-3 rounded-tag text-left transition-colors duration-200 hover:bg-blush",
    isSheet ? "px-4 py-3.5" : "px-3 py-2.5",
  );

  return (
    <>
      <div className={cn("pb-0", isSheet ? "px-3.5 pt-1" : "p-1.5 pb-0")}>
        <button
          type="button"
          role="option"
          aria-selected={country == null}
          onClick={() => onPick("AUTO")}
          className={rowClass}
        >
          <span className="font-label text-[0.68rem] tracking-[0.14em] text-ink uppercase">
            Auto
          </span>
          <span className="text-caption text-ink-faint">
            based on your location
          </span>
        </button>
      </div>

      <div className={cn("pt-1 pb-1", isSheet ? "px-3.5" : "px-3")}>
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
            className={cn(
              "w-full bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-faint",
              isSheet ? "py-3" : "py-2",
            )}
          />
        </div>
      </div>

      <ul
        role="listbox"
        aria-label="Currencies"
        className={cn(
          "overflow-y-auto overscroll-contain",
          isSheet
            ? "min-h-0 flex-1 px-3.5 pt-1 pb-4"
            : "max-h-[min(60vh,20rem)] p-1.5",
        )}
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
              onClick={() => onPick(option.countryCode)}
              className={rowClass}
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
    </>
  );
}
