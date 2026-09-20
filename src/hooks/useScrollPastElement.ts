"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True only once the shopper has scrolled DOWN past `el`, false again the
 * instant it's back in view (scrolling up) — never true purely because `el`
 * happens to be off-screen, which also covers "scrolling up from deep in the
 * page back toward the hero". Shared by StickyBuyBar and ScrollToTop so both
 * show/hide on the exact same crossing, not just similar-looking thresholds.
 *
 * rootMargin's top clears the sticky header; the small positive bottom
 * margin makes "back in view" trigger a touch before `el` is fully on
 * screen, so a fast hide-out tween has time to finish right around when the
 * real element is visible instead of lingering over it.
 */
export function useScrollPastElement(
  elRef: RefObject<HTMLElement | null>,
  rootMargin = "-72px 0px 80px 0px",
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let lastScrollY = window.scrollY;
    let skippedInitial = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // IntersectionObserver fires its first callback synchronously on
        // observe(), reporting whatever `el`'s on-load position already is
        // — on a short viewport that can be "not intersecting" before the
        // shopper has scrolled at all. That first, pre-scroll reading is
        // never a real crossing, so it's ignored.
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
        // scrolling up never shows it, and re-entering view always hides it
        // regardless of direction.
        setVisible(!entry.isIntersecting && scrollingDown);
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [elRef, rootMargin]);

  return visible;
}
