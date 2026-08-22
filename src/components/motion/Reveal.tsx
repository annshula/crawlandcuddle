"use client";

import { useRef, type ElementType, type ReactNode } from "react";

import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { REVEAL_MARGIN, observeOnce } from "@/lib/in-view";
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
  /** How far up the viewport the element must travel before it plays, as a
      percentage of viewport height. 85 matches the old "top 85%" trigger. */
  startPercent?: number;
}

export function Reveal({
  children,
  as: Tag = "div",
  className,
  variant = "up",
  delay = 0,
  duration = 1.1,
  stagger,
  startPercent,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1, clearProps: "all" });
      return;
    }

    const targets = stagger !== undefined ? Array.from(el.children) : [el];
    if (!targets.length) return;

    // The resting (hidden) state is written before paint, exactly as before —
    // only the *trigger* is deferred, so nothing flashes in on load.
    gsap.set(targets, variants[variant]);

    let tween: gsap.core.Tween | null = null;

    /* An IntersectionObserver rather than a ScrollTrigger: this reveal plays
       once and never reads scroll position again, so it does not need to join
       ScrollTrigger's per-frame update loop or pay for its layout measurement
       during hydration. */
    const cancel = observeOnce(
      el,
      () => {
        tween = gsap.to(targets, {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration,
          delay,
          stagger: stagger ?? 0,
          ease: "power3.out",
        });
      },
      startPercent === undefined
        ? REVEAL_MARGIN
        : `0px 0px -${100 - startPercent}% 0px`,
    );

    return () => {
      cancel();
      tween?.kill();
      gsap.set(targets, { clearProps: "all" });
    };
  }, [variant, delay, duration, stagger, startPercent]);

  return (
    <Tag ref={ref} className={cn(className)} data-reveal={variant}>
      {children}
    </Tag>
  );
}
