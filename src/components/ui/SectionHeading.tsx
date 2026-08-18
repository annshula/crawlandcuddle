import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { SplitLines } from "@/components/motion/SplitLines";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Applied to the <h2> so a section can reference it with aria-labelledby. */
  id?: string;
  eyebrow?: string;
  title: ReactNode[];
  script?: string;
  body?: string;
  align?: "left" | "center";
  tone?: "ink" | "light";
  /** Tighten the vertical rhythm — for pinned sections with little headroom. */
  compact?: boolean;
  /** Scale type by viewport height so the heading fits pinned full-screen
   *  sections on shorter windows without shrinking the cards below. */
  size?: "default" | "sm";
  className?: string;
  children?: ReactNode;
}

/**
 * The two-voice headline pattern from DESIGN.md: condensed all-caps display
 * type paired with a handwritten script line. Script is decoration only — the
 * heading element carries the real text.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  script,
  body,
  align = "left",
  tone = "ink",
  compact = false,
  size = "default",
  className,
  children,
}: SectionHeadingProps) {
  const light = tone === "light";
  const sm = size === "sm";

  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col",
        compact ? (sm ? "gap-2" : "gap-3") : "gap-5",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <Reveal variant="fade" duration={0.8}>
          <p
            className={cn(
              "eyebrow flex items-center gap-3",
              light ? "text-rose-200" : "text-rose-600",
            )}
          >
            <span
              className={cn(
                "inline-block h-px w-8",
                light ? "bg-rose-200/60" : "bg-rose-600/40",
              )}
              aria-hidden="true"
            />
            {eyebrow}
          </p>
        </Reveal>
      )}

      <h2
        id={id}
        className={cn(
          "font-display uppercase",
          sm
            ? "text-[clamp(2rem,min(5vw,7.4vh),3.5rem)] leading-[1.02]"
            : "text-heading",
          light ? "text-paper" : "text-ink",
        )}
      >
        <SplitLines lines={title} />
      </h2>

      {script && (
        <Reveal variant="up" delay={0.15}>
          <p
            className={cn(
              "font-script leading-tight",
              sm
                ? "text-[clamp(1.35rem,min(3vw,4.2vh),2.25rem)]"
                : "text-3xl md:text-4xl",
              light ? "text-rose-200" : "text-rose-500",
            )}
            aria-hidden="true"
          >
            {script}
          </p>
        </Reveal>
      )}

      {body && (
        <Reveal variant="up" delay={0.1}>
          <p
            className={cn(
              "max-w-xl",
              sm
                ? "text-[clamp(0.875rem,min(1.5vw,1.9vh),1.0625rem)] leading-relaxed"
                : "text-body",
              light ? "text-paper/75" : "text-ink-soft",
              align === "center" && "mx-auto",
            )}
          >
            {body}
          </p>
        </Reveal>
      )}

      {children}
    </div>
  );
}
