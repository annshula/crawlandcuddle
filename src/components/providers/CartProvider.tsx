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

import { product, variants } from "@/content/site";
import { trackAddToCart } from "@/lib/analytics";
import { useScrollLock } from "@/lib/scroll-lock";

const STORAGE_KEY = "cc.cart.v1";

export type CartLine = {
  slug: string;
  qty: number;
};

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; slug: string; qty: number }
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
            ? { ...l, qty: Math.min(l.qty + action.qty, 20) }
            : l,
        );
      }
      return [...state, { slug: action.slug, qty: action.qty }];
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
  count: number;
  subtotalCents: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, qty?: number) => void;
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
        return [
          {
            ...line,
            name: variant.name,
            image: variant.image,
            tone: variant.tone,
            unitPriceCents: product.priceCents,
            lineTotalCents: product.priceCents * line.qty,
          },
        ];
      }),
    [raw],
  );

  const add = useCallback((slug: string, qty = 1) => {
    dispatch({ type: "add", slug, qty });
    const variant = variants.find((v) => v.slug === slug);
    if (variant) {
      trackAddToCart(
        { slug, name: variant.name, quantity: qty },
        product.priceCents,
        product.currency,
      );
    }
    setOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotalCents: lines.reduce((n, l) => n + l.lineTotalCents, 0),
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQty: (slug, qty) => dispatch({ type: "setQty", slug, qty }),
      remove: (slug) => dispatch({ type: "remove", slug }),
      clear: () => dispatch({ type: "clear" }),
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
