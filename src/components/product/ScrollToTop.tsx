"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui/Icon";
import { useScrollPastElement } from "@/hooks/useScrollPastElement";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * A small circular "back to top" button, bottom-right — the product detail
 * page runs long (gallery, compare table, quality checks, FAQ, reviews).
 * Shares `ctaRef` with StickyBuyBar and the same `useScrollPastElement`
 * hook, so this shows and hides on the exact same crossing as the buy bar
 * (visible once BuyBox's CTA scrolls out of view scrolling down, hidden the
 * instant it's back in view) instead of a separately-tuned scroll threshold
 * that could drift out of sync with it.
 *
 * StickyBuyBar is a full-width card on mobile (not confined to one corner),
 * so avoiding it there means stacking above it, not moving sideways: this
 * button sits at a fixed offset tall enough to clear the buy bar's stacked
 * mobile height (thumbnail row + full-width button row), then drops back to
 * a normal corner offset from `sm` up, where the buy bar is a lower, inline
 * row instead. Portalled to `document.body` for the same reason as
 * StickyBuyBar: the hero section's `clip-path` would otherwise clip a
 * `position: fixed` descendant to its own box. Same fade/slide language as
 * the rest of the page's floating chrome.
 */
export function ScrollToTop({
  ctaRef,
}: {
  /** BuyBox's own CTA row — same ref StickyBuyBar watches. */
  ctaRef: RefObject<HTMLElement | null>;
}) {
  const visible = useScrollPastElement(ctaRef);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMounted(true), []);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: visible ? 1 : 0 });
      return;
    }

    const tween = gsap.to(el, {
      y: visible ? "0%" : "20%",
      autoAlpha: visible ? 1 : 0,
      duration: visible ? 0.35 : 0.2,
      ease: visible ? "power3.out" : "power2.in",
    });
    return () => {
      tween.kill();
    };
  }, [visible]);

  if (!mounted) return null;

  return createPortal(
    <button
      ref={ref}
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        })
      }
      aria-label="Back to top"
      /* `invisible` + no static transform class, same reasoning as
         StickyBuyBar/CartDrawer: GSAP owns the transform outright so its
         own tween isn't stacking on top of a CSS one. Mobile offset (9rem)
         clears StickyBuyBar's stacked full-width card with room to spare;
         sm+ drops to a normal corner offset since the buy bar is a lower
         inline row there. */
      className="invisible fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+9rem)] z-70 grid size-11 place-items-center rounded-full border border-hairline bg-cream text-ink shadow-drift transition-colors duration-300 hover:border-rose-600 hover:text-rose-600 sm:right-6 sm:bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:size-12"
    >
      <Icon name="arrow-down" className="size-4 rotate-180" strokeWidth={2} />
    </button>,
    document.body,
  );
}
