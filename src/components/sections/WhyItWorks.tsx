import Image from "next/image";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pillars } from "@/content/site";
import { cn } from "@/lib/utils";

const accentTone: Record<string, string> = {
  rose: "text-rose-500",
  lilac: "text-lilac-400",
  petal: "text-petal",
  mint: "text-mint",
};

export function WhyItWorks() {
  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="relative overflow-hidden bg-paper section-y"
    >
      <Blob
        shape="d"
        spin={20}
        className="pointer-events-none absolute -top-36 -left-48 w-lg text-rose-50"
      />
      <Parallax
        speed={0.12}
        className="pointer-events-none absolute top-24 right-6 hidden w-24 lg:block"
      >
        <LineArt name="butterfly" className="text-lilac-300" />
      </Parallax>

      <div className="container-page relative z-10">
        <SectionHeading
          id="why-heading"
          eyebrow="Why parents love it"
          title={["Built for the", "backward landing"]}
          script="the one they never see coming"
          body="Babies fall forward onto their hands. Backwards there is nothing to break the fall — the head simply arrives first. Every part of this cushion is shaped around that one specific moment."
        />

        <div className="mt-16 grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-20">
          <ul className="grid gap-px overflow-hidden rounded-panel bg-hairline sm:grid-cols-2">
            {pillars.map((pillar, i) => (
              <Reveal
                key={pillar.index}
                as="li"
                variant="up"
                delay={i * 0.07}
                className="group relative bg-paper p-8 transition-colors duration-500 hover:bg-cream"
              >
                <span
                  className={cn(
                    "pointer-events-none absolute -top-8 -right-6 w-28 opacity-60 transition-transform duration-700 ease-out-soft group-hover:scale-110",
                    accentTone[pillar.accent] ?? "text-rose-500",
                  )}
                  aria-hidden="true"
                >
                  <Blob shape="b" spin={i * 40} />
                </span>

                <p className="relative font-display text-heading-sm text-rose-500/40">
                  {pillar.index}
                </p>
                <h3 className="relative mt-3 font-headline text-xl font-medium text-ink">
                  {pillar.title}
                </h3>
                <p className="relative mt-3 text-body-sm text-ink-soft">
                  {pillar.body}
                </p>
              </Reveal>
            ))}
          </ul>

          {/* Mesh close-up — the proof behind "breathable". */}
          <Reveal variant="left">
            <figure className="relative">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-panel bg-lilac-50 shadow-drift">
                <Image
                  src="/images/product/mesh-detail.jpg"
                  alt="Close-up of the breathable 3D air-mesh shell on the baby head protector backpack"
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 34vw, 90vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-5 max-w-sm text-body-sm text-ink-soft">
                <span className="eyebrow block text-rose-600">
                  The 3D air-mesh shell
                </span>
                <span className="mt-2 block">
                  Thousands of open cells move warm air away from the back
                  instead of trapping it — the difference between an hour of
                  happy floor play and a sweaty, grizzly baby.
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
