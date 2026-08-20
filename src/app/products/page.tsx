import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { Reveal } from "@/components/motion/Reveal";
import { ProductPrice } from "@/components/product/ProductPrice";
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
        className="relative -mt-(--nav-height) flex min-h-[calc(100svh-var(--announce-height))] flex-col justify-center bg-cream pt-[calc(var(--nav-height)+3.5rem)] pb-14"
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

          <h1 className="mt-6 max-w-3xl font-display text-heading uppercase">
            Ten styles of the baby head protector backpack
          </h1>
          <p className="mt-5 max-w-2xl text-body text-ink-soft">
            Every style carries the same impact-absorbing ring, breathable 3D
            air-mesh shell and adjustable harness. Choose the one your little
            explorer will ask for by name.
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
