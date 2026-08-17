"use client";

import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  /** Seconds for one full loop. Lower = faster. */
  speed?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  fade?: boolean;
}

/**
 * CSS-driven infinite ticker. The track holds two identical copies and shifts
 * by exactly -50%, so the seam is always mid-sequence and never visible.
 * Runs on the compositor — no JS on the scroll path.
 */
export function Marquee({
  children,
  className,
  trackClassName,
  speed = 40,
  reverse = false,
  pauseOnHover = true,
  fade = false,
}: MarqueeProps) {
  const items = Children.toArray(children);

  return (
    <div
      className={cn(
        "group relative flex overflow-hidden",
        fade && "marquee-mask",
        className,
      )}
    >
      <div
        className={cn(
          "marquee-track",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          trackClassName,
        )}
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}
