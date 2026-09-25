"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { Button } from "@/components/ui/Button";
import { getPackTier, type PackTier, type Variant } from "@/content/site";
import { usePurchaseActions } from "@/hooks/usePurchaseActions";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useScrollPastElement } from "@/hooks/useScrollPastElement";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Floating bottom bar — a fully-rounded card with a gap from every screen
 * edge (not a docked sheet), so it reads as floating above the page rather
 * than attached to the viewport chrome. Visibility comes from
 * `useScrollPastElement(ctaRef)` — the same hook ScrollToTop uses on the
 * same `ctaRef`, so the two show/hide on the exact same scroll crossing
 * rather than two independently-tuned thresholds drifting apart. One shared
 * `usePurchaseActions` call, so "add to bag" here behaves identically to the
 * one in BuyBox — same toast, same checkout line.
 *
 * Portalled to `document.body` (same technique as ValueStack's mobile
 * sheet): the product page's hero section sets `clip-path` for its curved
 * bottom edge, and `clip-path` on an ancestor creates a new containing block
 * for `position: fixed` descendants in modern browsers — without the
 * portal, this bar would render `fixed` relative to that clipped section
 * instead of the viewport, and vanish the moment the hero scrolled past.
 */
export function StickyBuyBar({
  variant,
  packSize,
  ctaRef,
}: {
  variant: Variant;
  packSize: PackTier["size"];
  /** BuyBox's own CTA row — the bar shows once this scrolls above the fold. */
  ctaRef: RefObject<HTMLElement | null>;
}) {
  const visible = useScrollPastElement(ctaRef);
  // The portal target (document.body) only exists client-side — mounting
  // this after the first client render (not during SSR) keeps server and
  // client markup identical, same pattern as ValueStack's mobile sheet.
  const [mounted, setMounted] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useIsomorphicLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    if (prefersReducedMotion()) {
      gsap.set(bar, { autoAlpha: visible ? 1 : 0 });
      return;
    }

    // No static `translate-y-full` class on the element (see CartDrawer's
    // own note on why): GSAP has to own the transform outright, or its own
    // `y` tween stacks on top of the CSS transform instead of replacing it,
    // leaving the bar stuck further offscreen than intended. `invisible` on
    // the element keeps it hidden until this first run positions it.
    //
    // Show eases in (there's no rush — the shopper is still reading the
    // page above). Hide is quick and immediate: the real CTA is back on
    // screen by the time this fires, so the floating bar should get out of
    // the way at once rather than lag behind it.
    const tween = gsap.to(bar, {
      y: visible ? "0%" : "110%",
      autoAlpha: visible ? 1 : 0,
      duration: visible ? 0.4 : 0.22,
      ease: visible ? "power3.out" : "power2.in",
    });
    return () => {
      tween.kill();
    };
  }, [visible]);

  const {
    amount: unitAmount,
    currencyCode,
    pending: pricePending,
  } = useStylePrice(variant.slug);

  const { totalAmount, added, buying, handleAdd, handleBuyNow, outOfStock } =
    usePurchaseActions({ variant, packSize, unitAmount, currencyCode });

  const tier = getPackTier(packSize);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={barRef}
      role="region"
      aria-label="Buy bar"
      /* `invisible` keeps it hidden (and out of layout-affecting paint)
         until the first GSAP run positions it — no static transform class
         here, see the effect above for why. A gap on every edge (inset-x-3
         sm:inset-x-6, bottom offset by the safe area) is what reads as
         "floating" rather than a docked sheet flush to the screen edges. */
      className="invisible fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-70 sm:inset-x-6"
      /* Keeps it out of the tab order while hidden, same pattern as the cart
         drawer and mobile nav panel. */
      inert={!visible}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-panel border border-hairline bg-cream p-3 shadow-drift sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-3">
        {/* flex-1 so this block grows to fill the row on desktop, pushing
            the buttons to the card's right edge instead of leaving a gap
            of empty space between two content-sized blocks. */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              "relative size-11 shrink-0 overflow-hidden rounded-card sm:size-14",
              variant.tone,
            )}
          >
            <Image
              src={variant.image}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-headline text-sm text-ink sm:text-base">
              {variant.name}
            </p>
            <p className="truncate text-body-sm text-ink-soft">
              {tier.label}
              {" · "}
              {pricePending ? (
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-14 animate-pulse rounded-pill bg-hairline align-middle"
                />
              ) : (
                formatMoney(totalAmount, currencyCode)
              )}
            </p>
          </div>
        </div>

        {outOfStock ? (
          <span className="shrink-0 text-body-sm text-ink-faint">
            Out of stock
          </span>
        ) : (
          // Phone: both buttons stack full-width below the item row — a
          // thumb-friendly tap target beats squeezing "Add to bag" out to
          // save width. The base button classes (btn-primary/btn-outline)
          // carry a fixed, generous padding plus `white-space: nowrap` —
          // fine as a normal CTA, but combined with two buttons in a narrow
          // row that minimum content width pushed past the card's edges.
          // Tighter padding here only, same override pattern Header.tsx
          // uses on its own "Shop now" button. From sm up the group itself
          // just switches to a plain inline row at the buttons' natural
          // size — no `display: contents` (it was silently discarding this
          // box's own sizing, which left the row short of the card's full
          // width and a gap of empty space at the right edge on desktop).
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:w-auto">
            <Button
              onClick={handleAdd}
              variant="outline"
              className="min-w-0 flex-1 justify-center px-3! py-2.5! text-[0.7rem]! sm:flex-none sm:px-7! sm:py-3.5! sm:text-[0.8125rem]!"
            >
              {added ? "Added" : "Add to bag"}
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={buying}
              className="min-w-0 flex-1 justify-center px-3! py-2.5! text-[0.7rem]! sm:flex-none sm:px-7! sm:py-3.5! sm:text-[0.8125rem]!"
            >
              {buying ? "…" : "Buy now"}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
