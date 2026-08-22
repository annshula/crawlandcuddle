"use client";

import type Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { onIdle } from "@/lib/defer";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { registerScrollLockTarget } from "@/lib/scroll-lock";

/**
 * Drives Lenis inertial scrolling from the GSAP ticker so scroll-linked tweens
 * and the scrollbar position never drift apart (two rAF loops is the classic
 * cause of jittery pinned sections).
 *
 * Lenis is imported and started only once the page is idle: inertial scrolling
 * is a refinement of a page that already scrolls natively, so neither its chunk
 * nor its rAF loop belongs in the load window. Until it boots the browser does
 * the scrolling, and anchor links fall back to native behaviour.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;
    let onAnchorClick: ((event: MouseEvent) => void) | null = null;

    const cancelIdle = onIdle(() => {
      void import("lenis").then(({ default: Lenis }) => {
        lenis = new Lenis({
          duration: 1.1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.6,
          wheelMultiplier: 0.9,
        });
        lenisRef.current = lenis;
        // Overlays pause inertial scrolling through this — body overflow alone
        // never reaches Lenis.
        registerScrollLockTarget(lenis);

        lenis.on("scroll", ScrollTrigger.update);

        tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        /**
         * In-page anchors must go through Lenis or native smooth scrolling
         * fights the inertial loop. Handles both "#why" and the cross-route
         * "/#why" form the header uses — the latter only when we are already
         * on that page.
         */
        onAnchorClick = (event: MouseEvent) => {
          if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;

          const anchor = (
            event.target as HTMLElement | null
          )?.closest<HTMLAnchorElement>("a[href*='#']");
          if (!anchor) return;

          const url = new URL(anchor.href, window.location.origin);
          // Only hijack hashes that resolve to a target on the page we are on.
          if (url.pathname !== window.location.pathname || !url.hash) return;

          const target = document.getElementById(url.hash.slice(1));
          if (!target) return;

          event.preventDefault();
          lenis?.scrollTo(target, { offset: -96, duration: 1.3 });
          history.replaceState(null, "", url.hash);
        };

        document.addEventListener("click", onAnchorClick);
      });
    });

    return () => {
      cancelIdle();
      if (onAnchorClick) document.removeEventListener("click", onAnchorClick);
      if (tick) {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
      }
      lenis?.destroy();
      registerScrollLockTarget(null);
      lenisRef.current = null;
    };
  }, []);

  /* App Router keeps the DOM alive across navigations: reset the inertial
     position and re-measure every ScrollTrigger for the new page. A nav link
     like "/#why" clicked from a different route (e.g. /products) lands here
     as a real navigation, not a same-page anchor click — Next.js does not
     reliably scroll to the hash itself once Lenis owns the scroll position,
     so do it explicitly once the new page's content has painted. */
  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) {
      lenisRef.current?.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
      const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(target, { offset: -96, immediate: true });
        } else {
          target.scrollIntoView({ block: "start" });
        }
      }
      ScrollTrigger.refresh();
    }, 150);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}
