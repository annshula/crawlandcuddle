"use client";

import { useRef, type ReactNode } from "react";

import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { observeOnce } from "@/lib/in-view";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

interface SplitLinesProps {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  /** Play on mount (hero) rather than waiting for the element to scroll in. */
  immediate?: boolean;
}

/**
 * Masked line reveal: each line sits in an overflow-hidden track and slides up
 * from below its own baseline. Markup stays semantic — the mask is a span.
 */
export function SplitLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.11,
  immediate = false,
}: SplitLinesProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const inner = el.querySelectorAll<HTMLElement>("[data-line-inner]");
    if (!inner.length) return;

    if (prefersReducedMotion()) {
      gsap.set(inner, { yPercent: 0, y: 0, opacity: 1 });
      return;
    }

    /* `y: 0` is not redundant. The resting `translateY(115%)` comes from CSS
       (globals.css, "Hero fold"), and GSAP records an existing percentage
       transform into its px-based `y` — animating `yPercent` alone then leaves
       that px offset behind and the lines stay hidden under their mask. */
    gsap.set(inner, { yPercent: 115, y: 0, opacity: 0 });

    let tween: gsap.core.Tween | null = null;
    const play = () => {
      tween = gsap.to(inner, {
        yPercent: 0,
        y: 0,
        opacity: 1,
        duration: 1.25,
        delay,
        stagger,
        ease: "expo.out",
      });
    };

    /* Plays once, so an observer replaces what used to be a ScrollTrigger —
       see Reveal. The hero passes `immediate` and never waits at all. */
    if (immediate) {
      play();
      return () => {
        tween?.kill();
        gsap.set(inner, { clearProps: "all" });
      };
    }

    const cancel = observeOnce(el, play, "0px 0px -12% 0px");

    return () => {
      cancel();
      tween?.kill();
      gsap.set(inner, { clearProps: "all" });
    };
  }, [delay, stagger, immediate]);

  return (
    <span ref={ref} className={cn("block", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.22em]">
          <span
            data-line-inner
            className={cn("block will-change-transform", lineClassName)}
          >
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}
