"use client";

import { useRef, type ReactNode } from "react";

import { gsap, prefersReducedMotion } from "@/lib/gsap";
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
      gsap.set(inner, { yPercent: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(inner, { yPercent: 115, opacity: 0 });
      gsap.to(inner, {
        yPercent: 0,
        opacity: 1,
        duration: 1.25,
        delay,
        stagger,
        ease: "expo.out",
        ...(immediate
          ? {}
          : { scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
      });
    }, el);

    return () => ctx.revert();
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
