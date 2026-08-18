"use client";

import { useRef } from "react";

import { Blob } from "@/components/art/Blob";
import { LineArt, type LineArtName } from "@/components/art/LineArt";
import { WaveDivider } from "@/components/art/WaveDivider";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { milestones } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

const cardArt: LineArtName[] = [
  "teddy",
  "footprints",
  "rattle",
  "pram",
  "butterfly",
];

/**
 * Horizontal card rail on the bold section band — the Pa'lais "recipes"
 * moment. On desktop the section pins at exactly one viewport tall and the rail
 * scrubs sideways; on touch it degrades to a native snap-scroller so nothing is
 * trapped behind JS.
 *
 * The pinned height is a full 100svh and deliberately does NOT subtract
 * --announce-height. The announcement bar is not sticky, so by the time this
 * section pins to the top of the viewport that bar has already scrolled away.
 * Subtracting it left a 34px strip of the *next* section visible beneath the
 * rail for the entire horizontal scrub — the wave divider only appeared to
 * "attach" once the pin released on the last card. Top padding clears the
 * sticky header instead.
 */
export function Milestones() {
  const root = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLUListElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    const rail = railRef.current;
    if (!el || !rail || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const distance = () => rail.scrollWidth - rail.clientWidth;
        if (distance() <= 0) return;

        const tween = gsap.to(rail, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${distance() + window.innerHeight * 0.4}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        return () => tween.kill();
      });

      return () => mm.revert();
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* bg-paper fills the sliver above the wave curve — without it that gap
          shows the page's cream body colour instead of the white section
          (WhyItWorks) actually sitting above, which read as a mismatched seam. */}
      <WaveDivider
        className="-mb-px bg-paper text-rose-500"
        shape="drip"
        height={110}
      />

      <section
        ref={root}
        id="milestones"
        aria-labelledby="milestones-heading"
        className="paper-grain relative flex flex-col justify-center overflow-hidden bg-rose-500 py-20 text-paper lg:h-svh lg:py-0 lg:pt-(--nav-height)"
      >
        <Blob
          shape="a"
          spin={-25}
          className="pointer-events-none absolute -top-24 right-1/4 w-120 text-rose-400/50"
        />

        <div className="container-page relative z-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="milestones-heading"
              tone="light"
              eyebrow="Milestone by milestone"
              title={["Every wobble", "has a season"]}
              script="and every season has a landing"
              body="Five months to two years is the window where every new skill arrives with a fresh way to fall. Here is what to expect, and what the cushion is doing at each stage."
              compact
              size="sm"
              className="lg:max-w-xl"
            />
            <Button
              href="/products"
              variant="ghost-light"
              withArrow
              className="self-start lg:self-auto"
            >
              Shop the protector
            </Button>
          </div>
        </div>

        <div className="relative z-10 mt-10 overflow-hidden lg:mt-3 lg:mb-3">
          <ul
            ref={railRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-(--page-gutter) pb-4 lg:overflow-visible lg:px-[max(var(--page-gutter),calc((100vw-var(--page-max-width))/2))] scrollbar-none [&::-webkit-scrollbar]:hidden"
          >
            {milestones.map((item, i) => (
              <li
                key={item.month}
                className="group relative flex w-76 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-card bg-paper p-7 text-ink sm:w-84 lg:h-auto lg:min-h-[min(20rem,42vh)] lg:w-92"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 -right-10 w-40 text-rose-50 transition-transform duration-700 ease-out-soft group-hover:scale-110"
                >
                  <Blob shape="e" spin={i * 55} />
                </span>

                <div className="relative">
                  <span className="eyebrow inline-flex items-center gap-2 rounded-tag bg-lilac-100 px-3 py-2 text-lilac-600">
                    {item.month}
                  </span>
                  <h3 className="mt-6 font-display text-heading-sm text-ink uppercase">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-body-sm text-ink-soft">{item.body}</p>
                </div>

                <div className="relative mt-6 flex items-end justify-between">
                  <span className="font-mega text-5xl leading-none font-black text-rose-100">
                    0{i + 1}
                  </span>
                  <span className="w-14 text-lilac-400">
                    <LineArt name={cardArt[i] ?? "star"} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="container-page relative z-10 mt-6 font-label text-[0.7rem] tracking-[0.2em] text-paper/60 uppercase lg:hidden">
          Swipe to explore →
        </p>
      </section>

      <WaveDivider
        className="-mt-px bg-cream text-rose-500"
        shape="wave"
        flip
        height={110}
      />
    </>
  );
}
