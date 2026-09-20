"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import {
  applyPackDiscount,
  getDisplayPackTier,
  product,
  variants,
} from "@/content/site";
import { trackAddToCart } from "@/lib/analytics";
import { useScrollLock } from "@/lib/scroll-lock";

const STORAGE_KEY = "cc.cart.v1";

export type CartLine = {
  slug: string;
  /**
   * The Shopify cart-line quantity — this is exactly what CJ fulfils, so a
   * "3 pack" is never a different SKU, only `qty: 3` against the same mapped
   * variant. There is deliberately no separate `packSize` field: the pack
   * tier a line displays at (and is priced at) is always derived from `qty`
   * itself via `getPackTier` — qty 2 is always the 2-pack, qty 3 is always
   * the 3-pack, any other qty (e.g. from QuickBuy's plain stepper) is always
   * full price. A separate flag that could disagree with `qty` was the
   * source of a real bug: manual +/- edits left the displayed price out of
   * sync with the actual line quantity. Single source of truth: `qty`.
   */
  qty: number;
};

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; slug: string; qty: number; replace?: boolean }
  | { type: "setQty"; slug: string; qty: number }
  | { type: "remove"; slug: string }
  | { type: "clear" };

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;
    case "add": {
      const existing = state.find((l) => l.slug === action.slug);
      if (existing) {
        return state.map((l) =>
          l.slug === action.slug
            ? {
                ...l,
                // Picking a pack tile (BuyBox) sets the line to exactly that
                // tier's quantity — "switch to the 3 pack" means qty 3, not
                // qty+3. Plain adds (QuickBuy, "add another") stay additive,
                // the ordinary cart behavior every caller already expects.
                qty: action.replace
                  ? Math.min(action.qty, 20)
                  : Math.min(l.qty + action.qty, 20),
              }
            : l,
        );
      }
      return [...state, { slug: action.slug, qty: Math.min(action.qty, 20) }];
    }
    case "setQty":
      return action.qty <= 0
        ? state.filter((l) => l.slug !== action.slug)
        : state.map((l) =>
            l.slug === action.slug
              ? { ...l, qty: Math.min(action.qty, 20) }
              : l,
          );
    case "remove":
      return state.filter((l) => l.slug !== action.slug);
    case "clear":
      return [];
  }
}

/** A cart line joined to its catalogue entry, ready to render. */
export type ResolvedLine = CartLine & {
  name: string;
  image: string;
  tone: string;
  unitPriceCents: number;
  lineTotalCents: number;
};

interface CartContextValue {
  lines: ResolvedLine[];
  /** Number of distinct lines in the bag (one per style), not the summed quantity across lines. */
  count: number;
  subtotalCents: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** `replace: true` (BuyBox's pack tiles) sets the line to exactly `qty`; omitted (QuickBuy, "add another") adds `qty` more to whatever's already there. `openDrawer: false` skips the auto-open (BuyBox shows a toast instead). */
  add: (
    slug: string,
    qty?: number,
    replace?: boolean,
    openDrawer?: boolean,
  ) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [raw, dispatch] = useReducer(reducer, [] as CartLine[]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* Restore once on mount. Reading in an effect (not during render) keeps the
     server and first client paint identical, so there is no hydration flash. */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (l): l is CartLine =>
              typeof l === "object" &&
              l !== null &&
              typeof (l as CartLine).slug === "string" &&
              Number.isFinite((l as CartLine).qty) &&
              variants.some((v) => v.slug === (l as CartLine).slug),
          );
          dispatch({ type: "hydrate", lines: valid });
        }
      }
    } catch {
      // Corrupt or unavailable storage: start with an empty cart.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      // Private-mode quota errors must never break checkout.
    }
  }, [raw, hydrated]);

  /* Lock the page while the drawer is open. */
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const lines = useMemo<ResolvedLine[]>(
    () =>
      raw.flatMap((line) => {
        const variant = variants.find((v) => v.slug === line.slug);
        if (!variant) return [];
        // Base USD fallback figures only — the drawer/checkout summary always
        // display through useLocalizedCart, which re-derives these from the
        // live per-market price. This just keeps the reducer's own total
        // (used before localization resolves) consistent with the pack tier
        // the line's own qty implies. getDisplayPackTier (not getPackTier):
        // qty 4, 5, 6... keep the 3-pack's per-unit rate instead of falling
        // back to full, undiscounted price; the line total is perUnit × the
        // real qty, not applyPackDiscount's own total (pinned to the tier's
        // fixed size).
        const tier = getDisplayPackTier(line.qty);
        const { perUnit } = applyPackDiscount(product.priceCents / 100, tier);
        const total = Math.round(perUnit * line.qty * 100) / 100;
        return [
          {
            ...line,
            name: variant.name,
            image: variant.image,
            tone: variant.tone,
            unitPriceCents: Math.round(perUnit * 100),
            lineTotalCents: Math.round(total * 100),
          },
        ];
      }),
    [raw],
  );

  const add = useCallback(
    (slug: string, qty = 1, replace = false, openDrawer = true) => {
      dispatch({ type: "add", slug, qty, replace });
      const variant = variants.find((v) => v.slug === slug);
      if (variant) {
        const tier = getDisplayPackTier(qty);
        const { perUnit } = applyPackDiscount(product.priceCents / 100, tier);
        trackAddToCart(
          { slug, name: variant.name, quantity: qty },
          // Report the actual per-unit price paid, so ad-platform ROAS reflects
          // the pack discount instead of overstating it at full price × qty.
          Math.round(perUnit * 100),
          product.currency,
        );
      }
      // BuyBox passes `false` here and shows a toast instead — jumping the
      // shopper into a full drawer for every single add interrupts browsing
      // more than it helps. QuickBuy (product cards) keeps the drawer, since
      // there's no pack picker there to give its own confirmation moment.
      if (openDrawer) setOpen(true);
    },
    [],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      // Number of distinct items in the bag (one per style/line), not the
      // summed quantity — a 3-pack of one style counts as 1 item here, not 3.
      count: lines.length,
      subtotalCents: lines.reduce((n, l) => n + l.lineTotalCents, 0),
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQty: (slug, qty) => dispatch({ type: "setQty", slug, qty }),
      remove: (slug) => dispatch({ type: "remove", slug }),
      clear: () => {
        dispatch({ type: "clear" });
        // Also empty storage synchronously: checkout redirects immediately, so
        // React's persistence effect may not flush before the navigation.
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Quota/private-mode errors must never break checkout.
        }
      },
    }),
    [lines, isOpen, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
