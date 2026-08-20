import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { Reveal } from "@/components/motion/Reveal";
import { ProductPrice } from "@/components/product/ProductPrice";
import { PromiseStrip } from "@/components/product/PromiseStrip";
import { QuickBuy } from "@/components/product/QuickBuy";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { site, trustBadges, variantHref, variants } from "@/content/site";
import { absoluteUrl, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Products — Baby Head Protector Backpack, 10 Styles",
  description:
    "Browse all ten styles of the Crawl & Cuddle baby head protector backpack. Identical anti-fall protection, 190 g, breathable 3D mesh, 5–24 months. Free gift and free tracked shipping.",
  alternates: { canonical: "/products" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/products"),
    siteName: site.name,
    title: "All Products — Baby Head Protector Backpack, 10 Styles",
    description: site.shortDescription,
    locale: "en_US",
    images: [{ ...site.ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Products — Baby Head Protector Backpack, 10 Styles",
    description: site.shortDescription,
    images: [{ ...site.ogImage }],
  },
};

export default function ProductsPage() {
  return (
    <>
      <section
        style={{ clipPath: "inset(-160px 0 0 0)" }}
        className="relative -mt-(--nav-height) flex min-h-[calc(100svh-var(--announce-height))] flex-col justify-center bg-cream pt-[calc(var(--nav-height)+clamp(0.75rem,2.2vh,2.5rem))] pb-[clamp(4rem,9.5vh,6rem)]"
      >
        <Blob
          shape="c"
          spin={25}
          className="pointer-events-none absolute -top-40 -right-48 w-xl text-lilac-100"
        />
        <LineArt
          name="butterfly"
          className="pointer-events-none absolute right-10 bottom-6 hidden w-24 text-rose-200 lg:block"
        />

        <div className="container-page relative z-10">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Products" }]}
          />

          {/* Copy and the hero product shot. On a phone the photo leads —
              the same order as the home hero — with the copy following;
              from lg the copy takes the left column and the shot sits right. */}
          <div className="mt-6 grid items-center gap-8 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
            <div className="order-2 min-w-0 lg:order-1">
              <h1 className="max-w-3xl font-display text-heading uppercase">
                Ten styles of the baby head protector backpack
              </h1>
              <p className="mt-5 max-w-2xl text-body text-ink-soft">
                Every style carries the same impact-absorbing ring, breathable
                3D air-mesh shell and adjustable harness. Choose the one your
                little explorer will ask for by name.
              </p>

              <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {trustBadges.map((badge) => (
                  <li
                    key={badge.label}
                    className="flex items-center gap-2 text-body-sm text-ink-soft"
                  >
                    <Icon
                      name="check"
                      className="size-4 text-rose-600"
                      strokeWidth={2.2}
                    />
                    {badge.label}
                  </li>
                ))}
              </ul>

              <PromiseStrip className="mt-9 max-w-2xl" />
            </div>

            {/* --- Hero product visual -----------------------------------
                 The same treatment as the home hero photo: an uncropped
                 portrait figure that fits the screen (never taller than
                 74vh) with organic blobs as the backdrop and line art around.
                 The photo's own backdrop has been cut out, so the product
                 floats on the halo instead of sitting in a box. */}
            <div className="relative order-1 min-w-0 lg:order-2">
              <div className="relative mx-auto aspect-3/4 w-[min(100%,21rem)] sm:w-[min(100%,25rem)] lg:h-[min(68vh,35rem)] lg:w-auto lg:max-w-full">
                <Blob
                  shape="b"
                  className="absolute inset-[-18%] h-[136%] w-[136%] text-blush"
                />
                <Blob
                  shape="e"
                  spin={-20}
                  className="absolute inset-[6%] h-[88%] w-[88%] text-lilac-100/70"
                />

                <div className="relative h-full w-full animate-float-slow">
                  <Image
                    src="/images/product/pink-pig.webp"
                    alt="Baby head protector backpack in the Flying Pig design, on a soft plain background"
                    fill
                    priority
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

      <section
        aria-label="All styles"
        className="relative bg-paper py-16 md:py-20"
      >
        <div className="container-page">
          <p className="eyebrow text-ink-faint">{variants.length} products</p>

          <Reveal
            as="ul"
            variant="up"
            stagger={0.05}
            className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          >
            {variants.map((variant) => (
              <li key={variant.slug} className="group flex flex-col">
                <Link
                  href={variantHref(variant.slug)}
                  className="flex flex-1 flex-col gap-4"
                >
                  <span
                    className={cn(
                      "relative block aspect-square overflow-hidden rounded-panel transition-shadow duration-500 ease-out-soft group-hover:shadow-drift",
                      variant.tone,
                    )}
                  >
                    <Image
                      src={variant.image}
                      alt={`${variant.name} baby head protector backpack, toddler anti-fall cushion pillow`}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                      className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.05]"
                    />
                    {variant.featured && (
                      <span className="eyebrow absolute top-3 left-3 rounded-tag bg-paper/90 px-2.5 py-1.5 text-[0.6rem] text-rose-600 backdrop-blur-sm">
                        Bestseller
                      </span>
                    )}
                  </span>

                  <span className="flex flex-1 flex-col">
                    <span className="font-headline text-lg text-ink transition-colors duration-300 group-hover:text-rose-600">
                      {variant.name}
                    </span>
                    <span className="mt-1 flex-1 text-body-sm text-ink-soft">
                      {variant.tagline}
                    </span>
                    <span className="mt-4 flex items-center justify-between gap-3">
                      <ProductPrice slug={variant.slug} size="sm" />
                      <span className="eyebrow flex items-center gap-1 text-rose-600">
                        View
                        <Icon
                          name="arrow-right"
                          className="size-3.5 transition-transform duration-500 group-hover:translate-x-1"
                        />
                      </span>
                    </span>
                  </span>
                </Link>

                <QuickBuy slug={variant.slug} />
              </li>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
