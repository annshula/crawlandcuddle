"use client";

import Image from "next/image";
import { useRef } from "react";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { Magnetic } from "@/components/motion/Magnetic";
import { SplitLines } from "@/components/motion/SplitLines";
import { Button } from "@/components/ui/Button";
import { hero, heroImage } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * First screen. Locked to the viewport height (minus the sticky chrome) so the
 * whole proposition — headline, price-free promise, both CTAs and the product —
 * lands without a scroll. Internal rhythm is viewport-height driven (vh clamps)
 * so the fold stays one screen on a 13" laptop and a 27" monitor alike, and the
 * section is min-height — never fixed — so nothing is ever clipped.
 */
export function Hero() {
  const root = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        "[data-hero='eyebrow']",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        0.1,
      )
        .fromTo(
          "[data-hero='underline']",
          { strokeDashoffset: 460 },
          { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" },
          0.8,
        )
        .fromTo(
          "[data-hero='script']",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9 },
          0.9,
        )
        .fromTo(
          "[data-hero='body']",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9 },
          1,
        )
        .fromTo(
          "[data-hero='cta'] > *",
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.09 },
          1.1,
        )
        .fromTo(
          "[data-hero='product']",
          { y: 56, scale: 0.92, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 1.5 },
          0.25,
        )
        .fromTo(
          "[data-hero='blob']",
          { scale: 0.75, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.5, stagger: 0.1 },
          0,
        );

      // The composition drifts and eases out as the fold leaves — kept gentle
      // (small drift, never below ~65% opacity) so the headline and both CTAs
      // stay fully readable while the hero scrolls away.
      gsap.to("[data-hero='fold']", {
        yPercent: 3,
        opacity: 0.65,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="top"
      aria-labelledby="hero-heading"
      /* clip-path, not overflow-hidden: `inset(-160px 0 0 0)` clips normally on
         the right/bottom/left edges but lets content render up to 160px above
         the box — enough for the decorative blobs to bleed into the
         transparent nav above (intentional). At the bottom the hero cuts
         cleanly: the shapes behind the main image are allowed to be trimmed by
         the section below rather than spilling over it. */
      style={{ clipPath: "inset(-160px 0 0 0)" }}
      className="relative -mt-(--nav-height) flex min-h-[calc(100svh-var(--announce-height))] flex-col justify-center pt-[calc(var(--nav-height)+clamp(0.75rem,2.2vh,2.5rem))] pb-[clamp(4rem,9.5vh,6rem)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          data-hero="blob"
          className="absolute -top-32 -left-40 w-136 text-blush animate-drift"
        >
          <Blob shape="c" />
        </div>
        <div
          data-hero="blob"
          className="absolute top-1/4 -right-40 w-160 text-lilac-100 animate-drift"
        >
          <Blob shape="b" spin={30} />
        </div>
        <div
          data-hero="blob"
          className="absolute bottom-0 left-1/3 w-md text-rose-50"
        >
          <Blob shape="e" spin={-15} />
        </div>
      </div>

      <div className="container-page relative z-10">
        <div
          data-hero="fold"
          className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10"
        >
          {/* ---------------- copy ---------------- */}
          <div className="relative order-2 lg:order-1">
            <p
              data-hero="eyebrow"
              className="eyebrow flex items-center gap-3 text-rose-600 opacity-0"
            >
              <span className="inline-block h-px w-8 bg-rose-600/40" />
              {hero.eyebrow}
            </p>

            <h1
              id="hero-heading"
              className="mt-[clamp(0.75rem,2vh,1.25rem)] font-mega text-[clamp(2.5rem,min(6.6vw,8.6vh),5.25rem)] leading-[1.02] font-black tracking-[-0.01em] text-ink"
            >
              <SplitLines lines={[...hero.headline]} immediate delay={0.2} />
              <span className="relative mt-1 inline-block overflow-visible">
                <SplitLines
                  lines={[hero.accentWord]}
                  immediate
                  delay={0.5}
                  lineClassName="text-rose-500"
                />
                <svg
                  viewBox="0 0 420 24"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-4 w-full text-rose-400"
                >
                  <path
                    data-hero="underline"
                    d="M6 16C74 6 168 4 240 10c56 5 116 4 174-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="460"
                    strokeDashoffset="460"
                  />
                </svg>
              </span>
            </h1>

            <p
              data-hero="script"
              className="mt-[clamp(0.75rem,1.8vh,1.25rem)] font-script text-2xl text-lilac-500 opacity-0 md:text-3xl"
            >
              {hero.script}
            </p>

            <p
              data-hero="body"
              className="mt-[clamp(0.75rem,1.8vh,1.25rem)] max-w-lg text-body text-ink-soft opacity-0"
            >
              {hero.body}
            </p>

            <div
              data-hero="cta"
              className="mt-[clamp(1.25rem,3vh,2rem)] flex flex-wrap items-center gap-3"
            >
              <Magnetic>
                <Button href={hero.primaryCta.href} withArrow>
                  {hero.primaryCta.label}
                </Button>
              </Magnetic>
              <Button href={hero.secondaryCta.href} variant="outline" withArrow>
                {hero.secondaryCta.label}
              </Button>
            </div>
          </div>

          {/* ---------------- lifestyle photograph ---------------- */}
          <div className="relative order-1 lg:order-2">
            <div
              data-hero="product"
              className="relative mx-auto aspect-3/4 w-[min(100%,21rem)] opacity-0 sm:w-[min(100%,25rem)] lg:h-[min(74vh,36rem)] lg:w-auto lg:max-w-full"
            >
              {/* Organic halo fills the space the photo's own background used
                  to occupy — the halo IS the background now. */}
              <Blob
                shape="b"
                className="absolute inset-[-18%] h-[136%] w-[136%] text-blush"
              />
              <Blob
                shape="e"
                spin={-20}
                className="absolute inset-[6%] h-[88%] w-[88%] text-lilac-100/70"
              />

              {/* No photo background survives here: a soft radial mask fades
                  the source photo's own dark backdrop to nothing at the edges.
                  The ellipse is sized generously (70% / 92%) and the image is
                  never scaled beyond its natural contain-fit, so the whole
                  figure — head to feet — clears the fade instead of being
                  cropped by it. */}
              <div
                className="relative h-full w-full animate-float-slow"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(ellipse 70% 92% at 50% 46%, black 66%, transparent 100%)",
                  maskImage:
                    "radial-gradient(ellipse 70% 92% at 50% 46%, black 66%, transparent 100%)",
                }}
              >
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 26rem, (min-width: 640px) 24rem, 80vw"
                  className="object-contain object-center"
                />
              </div>

              <LineArt
                name="star"
                className="absolute -bottom-2 left-0 w-10 text-rose-400/70 animate-wobble"
              />
              <LineArt
                name="heart"
                className="absolute top-6 -left-6 w-8 text-lilac-400/60 animate-float"
              />
              <LineArt
                name="butterfly"
                className="absolute right-0 -bottom-6 w-14 rotate-12 text-mint/80"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
