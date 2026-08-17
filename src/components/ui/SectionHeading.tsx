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
  className,
  children,
}: SectionHeadingProps) {
  const light = tone === "light";

  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-5",
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
          "font-display text-heading uppercase",
          light ? "text-paper" : "text-ink",
        )}
      >
        <SplitLines lines={title} />
      </h2>

      {script && (
        <Reveal variant="up" delay={0.15}>
          <p
            className={cn(
              "font-script text-3xl leading-tight md:text-4xl",
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
              "max-w-xl text-body",
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
