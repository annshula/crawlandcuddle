"use client";

import { useRef } from "react";

import Image from "next/image";

import { Blob } from "@/components/art/Blob";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { howItWorks } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * Sticky product column with a scroll-linked progress rail. The illustration
 * stays put while the three fitting steps scroll past it.
 */
export function HowItWorks() {
  const root = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");

      steps.forEach((step) => {
        gsap.fromTo(
          step,
          { opacity: 0.25, x: 40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 78%", once: true },
          },
        );
      });

      gsap.fromTo(
        "[data-progress]",
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: "[data-steps]",
            start: "top 70%",
            end: "bottom 75%",
            scrub: 0.6,
          },
        },
      );

      gsap.to("[data-how-product]", {
        rotate: 4,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="how"
      aria-labelledby="how-heading"
      className="relative overflow-hidden bg-cream section-y"
    >
      <Blob
        shape="c"
        spin={70}
        className="pointer-events-none absolute top-1/3 -right-56 w-[40rem] text-lilac-100"
      />

      <div className="container-page relative z-10">
        <SectionHeading
          id="how-heading"
          eyebrow="Fitting guide"
          title={["On in ten", "seconds flat"]}
          script="before the crawl-off begins"
          align="center"
        />

        <div className="mt-20 grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
          <div className="relative lg:sticky lg:top-32">
            <div
              data-how-product
              className="relative mx-auto aspect-square w-[min(100%,26rem)] overflow-hidden rounded-panel bg-mint/30 shadow-drift"
            >
              <Image
                src="/images/product/green-owl.jpg"
                alt="Green Owl baby head protector backpack shown from the back with its adjustable shoulder harness"
                fill
                loading="eager"
                sizes="(min-width: 1024px) 42vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>

          <ol data-steps className="relative flex flex-col gap-14 lg:pl-12">
            <span
              aria-hidden="true"
              className="absolute top-2 left-0 hidden h-full w-px bg-hairline lg:block"
            >
              <span
                data-progress
                className="absolute inset-0 block bg-rose-500"
              />
            </span>

            {howItWorks.map((step, i) => (
              <li key={step.title} data-step className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-12 hidden size-3 -translate-x-1/2 rounded-full bg-rose-500 ring-4 ring-cream lg:block"
                />
                <p className="eyebrow text-rose-600">{step.step}</p>
                <h3 className="mt-4 font-display text-heading-sm text-ink uppercase">
                  <span className="mr-3 text-rose-200">0{i + 1}</span>
                  {step.title}
                </h3>
                <p className="mt-4 max-w-md text-body text-ink-soft">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
