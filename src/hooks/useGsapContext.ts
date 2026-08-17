"use client";

import { useRef, type RefObject } from "react";

import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

type SetupFn = (ctx: gsap.Context) => void;

/**
 * Scopes a GSAP animation set to a container element and reverts every tween,
 * ScrollTrigger and inline style it created on unmount. Bails out entirely when
 * the visitor has asked for reduced motion, leaving the CSS resting state.
 */
export function useGsapContext<T extends HTMLElement = HTMLDivElement>(
  setup: SetupFn,
  deps: unknown[] = [],
): RefObject<T | null> {
  const scope = useRef<T | null>(null);
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useIsomorphicLayoutEffect(() => {
    if (!scope.current || prefersReducedMotion()) return;

    const ctx = gsap.context((self) => setupRef.current(self), scope);
    return () => ctx.revert();
  }, deps);

  return scope;
}
