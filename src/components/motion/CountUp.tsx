"use client";

import { useRef } from "react";

import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  duration = 1.8,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const formatted = `${prefix}${value.toFixed(decimals)}${suffix}`;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const counter = { n: 0 };
      gsap.to(counter, {
        n: value,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = `${prefix}${counter.n.toFixed(decimals)}${suffix}`;
        },
        onComplete: () => {
          el.textContent = formatted;
        },
      });
    }, el);

    return () => ctx.revert();
  }, [value, decimals, prefix, suffix, duration, formatted]);

  return (
    <span ref={ref} className={cn(className)}>
      {formatted}
    </span>
  );
}
