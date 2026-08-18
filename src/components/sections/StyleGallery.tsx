import Image from "next/image";
import Link from "next/link";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { variantHref, variants } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * The catalogue moment: ten styles, identical protection.
 * Rendered as a semantic list so crawlers read it as a product collection —
 * paired with the ItemList JSON-LD in components/seo/JsonLd.tsx.
 */
export function StyleGallery() {
  return (
    <section
      id="styles"
      aria-labelledby="styles-heading"
      className="relative overflow-hidden bg-cream section-y"
    >
      <Blob
        shape="c"
        spin={35}
        className="pointer-events-none absolute -top-40 -right-52 w-xl text-lilac-100"
      />
      <LineArt
        name="butterfly"
        className="pointer-events-none absolute bottom-16 -left-6 hidden w-28 rotate-12 text-lilac-200 lg:block"
      />

      <div className="container-page relative z-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="styles-heading"
            eyebrow="Ten prints · one promise"
            title={["Same protection.", "Ten personalities."]}
            script="pick the one they'll ask for by name"
            body="Every style shares the identical impact-absorbing ring, 3D air-mesh shell and adjustable harness. Only the outside changes — because safety they actually want to wear is safety they keep on."
            className="lg:max-w-2xl"
          />
          <Button href="/products" withArrow className="self-start lg:mb-2">
            Shop the range
          </Button>
        </div>

        <Reveal
          as="ul"
          variant="up"
          stagger={0.06}
          className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5"
        >
          {variants.map((variant) => (
            <li key={variant.slug} className="group">
              <Link
                href={variantHref(variant.slug)}
                className="flex h-full flex-col gap-4"
                aria-label={`${variant.name} style — ${variant.tagline}`}
              >
                <span
                  className={cn(
                    "relative block aspect-square overflow-hidden rounded-panel transition-shadow duration-500 ease-out-soft group-hover:shadow-drift",
                    variant.tone,
                  )}
                >
                  <Image
                    src={variant.image}
                    alt={`${variant.name} baby head protector backpack, anti-fall cushion pillow`}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                    className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.06]"
                  />
                  {variant.featured && (
                    <span className="eyebrow absolute top-3 left-3 rounded-tag bg-paper/90 px-2.5 py-1.5 text-[0.6rem] text-rose-600 backdrop-blur-sm">
                      Bestseller
                    </span>
                  )}
                </span>
                <span className="block">
                  <span className="block font-headline text-base text-ink transition-colors duration-300 group-hover:text-rose-600">
                    {variant.name}
                  </span>
                  <span className="mt-1 block text-body-sm text-ink-soft">
                    {variant.tagline}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
