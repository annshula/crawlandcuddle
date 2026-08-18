"use client";

import Image from "next/image";
import { useRef } from "react";

import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

export type PeekSide = "left" | "right";

/**
 * Both source photos are the same "peeking around a corner" pose, mirrored:
 * the child grips a vertical edge with both hands and leans out past it. The
 * gripped edge has to line up with the viewport edge for the illusion to hold,
 * so each variant records where its outermost fingertips sit as a percentage
 * of the image width. That figure — not 0 — is how far the figure travels:
 * the hand stops flush with the screen edge and nothing emerges beyond it.
 */
const PEEK: Record<
  PeekSide,
  {
    src: string;
    alt: string;
    width: number;
    height: number;
    /** Where the fingertips sit inside the image, as % from the leading edge. */
    handInset: number;
    /** How far past the screen edge the hand extends at full peek, % of figure
        width — the fingertips may be cut off-screen. */
    overhang: number;
    /** Figure width classes — chosen so both babies render at the same on-screen size. */
    size: string;
    sizes: string;
    mask: string;
  }
> = {
  left: {
    src: "/images/lifestyle/baby-peek-left.png",
    alt: "",
    width: 690,
    height: 1536,
    // Source is cropped tight to the baby — fingertips sit ~2% in from the
    // left edge of the image.
    handInset: 2,
    overhang: 8,
    size: "w-40 xl:w-44",
    sizes: "(min-width: 1280px) 11rem, 10rem",
    mask: "radial-gradient(ellipse 92% 96% at 50% 48%, black 62%, transparent 100%)",
  },
  right: {
    src: "/images/lifestyle/baby-peek-right.png",
    alt: "",
    width: 502,
    height: 1535,
    // Replaced with the newly uploaded right peek, cropped tight to the baby —
    // fingertips sit ~2% in from the image's right edge. This baby is taller &
    // slimmer than the left, so its figure width is scaled to land at the same
    // on-screen height as the left peek.
    handInset: 2,
    overhang: 4,
    size: "w-[7.3rem] xl:w-[8rem]",
    sizes: "(min-width: 1280px) 8rem, 7.3rem",
    mask: "radial-gradient(ellipse 92% 96% at 50% 48%, black 62%, transparent 100%)",
  },
};

interface PeekingBabyProps {
  side?: PeekSide;
  className?: string;
  /**
   * CSS selectors (resolved inside the peek range) for sections the baby
   * should retreat from — it slides out as each enters, stays hidden while it
   * fills the viewport, and slides back in as it leaves.
   */
  hide?: string[];
}

/**
 * The child grips the screen edge for the whole scroll of its parent range.
 * Place this component as the FIRST child of a plain `relative` wrapper that
 * spans the sections you want the baby visible over (the wrapper becomes the
 * scroll range and the sticky containing block).
 *
 * A sticky zero-height wrapper holds the figure at a fixed viewport height
 * while the sections scroll past, and a scrubbed timeline slides the figure in
 * at the top of the range, holds it straight at hand level, then slides it
 * back out before the range ends — so the peek simply rides along for
 * multiple sections of scrolling instead of flashing at a single seam.
 *
 * Peek limit: the figure slides out until the hand extends a little PAST the
 * screen edge (`overhang`) — the baby grips the edge from slightly outside, so
 * the fingertips may be cut off-screen. It holds straight (no rotation) at
 * full peek and nothing more emerges beyond it.
 *
 * Pass `hide` with CSS selectors (relative to the range) for any sections the
 * baby should never cover: it slides out as that section enters, stays hidden
 * while it fills the viewport, then slides back in as it leaves.
 */
export function PeekingBaby({
  side = "left",
  className,
  hide = [],
}: PeekingBabyProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const figureRef = useRef<HTMLDivElement | null>(null);
  const config = PEEK[side];

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const figure = figureRef.current;
    // The sticky containing block / scroll range is the wrapper's parent.
    const range = wrap?.parentElement ?? null;
    if (!wrap || !figure || !range) return;

    // Off-screen is -100%/+100%; the peak pushes the hand a little PAST the
    // screen edge (handInset + overhang) so the baby grips the edge naturally
    // and the fingertips may be cut off-screen.
    const dir = side === "left" ? -1 : 1;
    const hidden = dir * 100;
    const limit = dir * (config.handInset + config.overhang);

    // Reduced motion: no scrubbing — park the figure at the hand limit so it
    // still reads as a static peek instead of sitting fully on-screen.
    gsap.set(figure, { xPercent: limit, rotate: 0 });
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Map the peek range and any `hide` sections into timeline fractions
      // [0..1] — the whole range scrubs across one timeline.
      const vh = window.innerHeight;
      const rangeTop = range.getBoundingClientRect().top + window.scrollY;
      const start = rangeTop - vh; // "top bottom"
      const total =
        range.getBoundingClientRect().bottom + window.scrollY - start;

      // Each hide section carves a dip out of the hold: [a,b] retreat as it
      // enters, hidden while it fills the viewport, [c,d] re-peek as it
      // leaves.
      const dips = hide
        .map((selector) => range.querySelector(selector))
        .filter((el): el is HTMLElement => Boolean(el))
        .map((el) => {
          const top = el.getBoundingClientRect().top + window.scrollY;
          const bottom = el.getBoundingClientRect().bottom + window.scrollY;
          return {
            a: Math.max(0.08, (top - vh - start) / total),
            b: Math.min(0.92, (top - start) / total),
            c: Math.max(0.08, (bottom - vh - start) / total),
            d: Math.min(0.92, (bottom - start) / total),
          };
        })
        .filter((dip) => dip.b - dip.a > 0.001 && dip.d - dip.c > 0.001);

      const tl = gsap.timeline({
        scrollTrigger: {
          // Range top reaches the viewport bottom -> range bottom reaches the
          // viewport top: the figure is out before the following section lands.
          trigger: range,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
          // Re-measure the range on refresh — keeps the run correct when the
          // pinned milestone band above reflows the page on load/resize.
          invalidateOnRefresh: true,
        },
      });

      const easeOut = "power1.out";
      const easeIn = "power1.in";

      tl.fromTo(
        figure,
        { xPercent: hidden, rotate: dir * 4 },
        { xPercent: limit, rotate: 0, ease: easeOut, duration: 0.08 },
        0,
      );

      for (const dip of dips) {
        tl.to(
          figure,
          {
            xPercent: hidden,
            rotate: dir * 3,
            ease: easeIn,
            duration: dip.b - dip.a,
          },
          dip.a,
        );
        tl.to(
          figure,
          {
            xPercent: limit,
            rotate: 0,
            ease: easeOut,
            duration: dip.d - dip.c,
          },
          dip.c,
        );
      }

      // Final retreat at the end of the range.
      tl.to(
        figure,
        { xPercent: hidden, rotate: dir * 3, ease: easeIn, duration: 0.08 },
        0.92,
      );
    }, wrap);

    return () => ctx.revert();
  }, [side, config.handInset, config.overhang, hide]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none sticky z-30 hidden h-0 lg:block",
        className,
      )}
      style={{ top: "clamp(6rem, 38vh, 24rem)" }}
    >
      <div
        ref={figureRef}
        className={cn(
          "absolute top-0",
          config.size,
          side === "left" ? "left-0" : "right-0",
        )}
      >
        {/* The source photo carries its own dark vignette; a radial mask
            dissolves it so only the child reads against the section behind. */}
        <div style={{ WebkitMaskImage: config.mask, maskImage: config.mask }}>
          <Image
            src={config.src}
            alt={config.alt}
            width={config.width}
            height={config.height}
            loading="lazy"
            sizes={config.sizes}
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
