"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui/Icon";
import { product } from "@/content/site";
import { formatMoney } from "@/lib/money";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * "Here's what you get" — every included item with its own worth, summing to
 * more than the sale price. A compact trigger sits inline next to the
 * "N checks passed" link (a `|` divider between them) instead of a standalone
 * card, so it never displaces the buy button. Clicking it opens a popover on
 * desktop, anchored under the trigger, and a bottom sheet on mobile — same
 * desktop/mobile split as the currency selector
 * (components/localization/CurrencySelector.tsx). Values are placeholders
 * (see content/site.ts's product.valueStack) — swap in real per-item figures
 * when available.
 */
export function ValueStack() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const totalCents = product.valueStack.reduce(
    (sum, item) => sum + item.valueCents,
    0,
  );

  useEffect(() => setMounted(true), []);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
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

  const list = (
    <ul className="flex flex-col gap-2">
      {product.valueStack.map((item) => (
        <li
          key={item.label}
          className="flex items-center justify-between gap-4 text-body-sm"
        >
          <span className="flex items-center gap-2 text-ink-soft">
            <Icon
              name="check"
              className="size-3.5 shrink-0 text-rose-500"
              strokeWidth={2.2}
            />
            {item.label}
          </span>
          <span className="shrink-0 text-ink-faint tabular-nums">
            {formatMoney(item.valueCents / 100, product.currency)}
          </span>
        </li>
      ))}
      <li className="mt-1 flex items-center justify-between gap-4 border-t border-hairline pt-2 text-body-sm">
        <span className="font-headline text-ink">Total value</span>
        <span className="font-headline text-ink tabular-nums">
          {formatMoney(totalCents / 100, product.currency)}
        </span>
      </li>
    </ul>
  );

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group inline-flex items-center gap-1.5 text-ink-soft underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
      >
        <Icon name="gift" className="size-3.5 shrink-0 text-rose-500" />
        <span className="font-headline text-ink tabular-nums">
          {formatMoney(totalCents / 100, product.currency)}
        </span>{" "}
        worth of value
      </button>

      {/* Desktop popover, anchored under the trigger. */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 hidden w-72 rounded-panel border border-hairline bg-cream p-4 shadow-drift sm:block">
          {list}
        </div>
      )}

      {/* Mobile bottom sheet, portalled to <body>. */}
      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-100 sm:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="What you get"
          >
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            />
            <div
              ref={sheetRef}
              className="absolute inset-x-0 bottom-0 flex max-h-[70svh] flex-col overflow-hidden rounded-t-[1.75rem] bg-cream pb-[env(safe-area-inset-bottom)] shadow-drift"
            >
              <span
                aria-hidden="true"
                className="mx-auto mt-3 h-1 w-11 shrink-0 rounded-pill bg-hairline"
              />
              <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-4 pb-1">
                <h2 className="font-display text-lg text-ink uppercase">
                  What you get
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid size-10 place-items-center rounded-pill border border-hairline text-ink transition-colors duration-300 hover:border-ink"
                >
                  <Icon name="close" className="size-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-6">
                {list}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
