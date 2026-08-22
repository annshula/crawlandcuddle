"use client";

import { useRef, type ReactNode } from "react";

import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useNearViewport } from "@/hooks/useNearViewport";
import { cn } from "@/lib/utils";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Positive drifts slower than the page, negative overtakes it. */
  speed?: number;
  rotate?: number;
  scaleTo?: number;
  disabledBelow?: number;
}

export function Parallax({
  children,
  className,
  speed = 0.18,
  rotate = 0,
  scaleTo,
  disabledBelow = 768,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  /* Scrubbed triggers must exist before the element scrolls in, but not a
     moment sooner — building them on mount put a layout read per Parallax
     into the load window. */
  const near = useNearViewport(ref);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || !near || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(`(min-width: ${disabledBelow}px)`, () => {
        gsap.to(el, {
          yPercent: speed * -100,
          rotate,
          ...(scaleTo ? { scale: scaleTo } : {}),
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
      return () => mm.revert();
    }, el);

    return () => ctx.revert();
  }, [near, speed, rotate, scaleTo, disabledBelow]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
