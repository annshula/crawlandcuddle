"use client";

import { useRef, type ElementType, type ReactNode } from "react";

import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "down" | "left" | "right" | "fade" | "scale" | "blur";

const variants: Record<RevealVariant, gsap.TweenVars> = {
  up: { y: 48, opacity: 0 },
  down: { y: -48, opacity: 0 },
  left: { x: 56, opacity: 0 },
  right: { x: -56, opacity: 0 },
  fade: { opacity: 0 },
  scale: { scale: 0.92, opacity: 0, transformOrigin: "50% 60%" },
  blur: { opacity: 0, y: 24, filter: "blur(12px)" },
};

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  /** Stagger the element's direct children instead of the element itself. */
  stagger?: number;
  start?: string;
}

export function Reveal({
  children,
  as: Tag = "div",
  className,
  variant = "up",
  delay = 0,
  duration = 1.1,
  stagger,
  start = "top 85%",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1, clearProps: "all" });
      return;
    }

    const targets =
      stagger !== undefined ? Array.from(el.children) : [el];
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.set(targets, variants[variant]);
      gsap.to(targets, {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        duration,
        delay,
        stagger: stagger ?? 0,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [variant, delay, duration, stagger, start]);

  return (
    <Tag ref={ref} className={cn(className)} data-reveal={variant}>
      {children}
    </Tag>
  );
}
