"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Drives Lenis inertial scrolling from the GSAP ticker so scroll-linked tweens
 * and the scrollbar position never drift apart (two rAF loops is the classic
 * cause of jittery pinned sections).
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

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /**
     * In-page anchors must go through Lenis or native smooth scrolling fights
     * the inertial loop. Handles both "#why" and the cross-route "/#why" form
     * the header uses — the latter only when we are already on that page.
     */
    const onAnchorClick = (event: MouseEvent) => {
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
      lenis.scrollTo(target, { offset: -96, duration: 1.3 });
      history.replaceState(null, "", url.hash);
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /* App Router keeps the DOM alive across navigations: reset the inertial
     position and re-measure every ScrollTrigger for the new page. */
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    if (!window.location.hash) window.scrollTo(0, 0);
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}
