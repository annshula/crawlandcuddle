"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { Button } from "@/components/ui/Button";
import { getPackTier, type PackTier, type Variant } from "@/content/site";
import { usePurchaseActions } from "@/hooks/usePurchaseActions";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Floating bottom bar — a fully-rounded card with a gap from every screen
 * edge (not a docked sheet), so it reads as floating above the page rather
 * than attached to the viewport chrome. Appears once BuyBox's own CTA row
 * scrolls out of view (watched via `ctaRef`, an IntersectionObserver on the
 * real buttons above) and stays visible for the rest of the page — it only
 * hides again if the shopper scrolls back up above that row. One shared
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
  const [visible, setVisible] = useState(false);
  // The portal target (document.body) only exists client-side — mounting
  // this after the first client render (not during SSR) keeps server and
  // client markup identical, same pattern as ValueStack's mobile sheet.
  const [mounted, setMounted] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    // Direction matters, not just "is the CTA off-screen": scrolling UP
    // from further down the page (footer, reviews, back toward the hero)
    // also has the CTA off-screen the whole way, but the bar must stay
    // hidden through that — it should only ever appear as the result of
    // scrolling DOWN past the real buttons, never while heading back up
    // toward them. lastScrollY is read on each observer firing (which only
    // happens near the CTA's own boundary) to classify that one crossing.
    let lastScrollY = window.scrollY;
    let skippedInitial = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // IntersectionObserver fires its first callback synchronously on
        // observe(), reporting whatever the CTA's on-load position already
        // is — on a short viewport that can be "not intersecting" before
        // the shopper has scrolled at all. That first, pre-scroll reading
        // is never a real crossing, so it's ignored.
        if (!skippedInitial) {
          skippedInitial = true;
          lastScrollY = window.scrollY;
          return;
        }

        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        lastScrollY = currentScrollY;

        if (!entry) {
          setVisible(false);
          return;
        }
        // Show only on a downward crossing out of view; a crossing while
        // scrolling up (in either direction of intersection) never shows
        // it, and re-entering view always hides it regardless of direction.
        setVisible(!entry.isIntersecting && scrollingDown);
      },
      // Top: only count it "gone" once fully past the header, not
      // mid-scroll. Bottom: a small positive margin grows the viewport's
      // effective bottom edge, so the real CTA is treated as "back in view"
      // (and the floating bar starts hiding) a little before it's actually
      // on screen — the ~0.22s hide tween then finishes right around when
      // the real buttons are fully visible, instead of the bar lingering
      // over them.
      { rootMargin: "-72px 0px 80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ctaRef]);

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
        <div className="flex min-w-0 items-center gap-3">
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
              {tier.size > 1 && ` (×${tier.size})`}
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
          // uses on its own "Shop now" button. From sm up they sit inline
          // beside the item instead, back to the normal button size.
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:contents">
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
