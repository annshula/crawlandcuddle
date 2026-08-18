import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { BuyBox } from "@/components/product/BuyBox";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import {
  faqs,
  getVariant,
  product,
  site,
  specs,
  variantHref,
  variants,
} from "@/content/site";
import { absoluteUrl, cn, formatPrice } from "@/lib/utils";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return variants.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const variant = getVariant(slug);
  if (!variant) return {};

  const title = `${variant.name} Baby Head Protector Backpack`;
  const description = `${variant.tagline} A 190 g breathable anti-fall cushion that protects the head and back from 5 to 24 months. ${formatPrice(product.priceCents)} with a free gift and free tracked shipping.`;

  return {
    title,
    description,
    alternates: { canonical: variantHref(slug) },
    openGraph: {
      type: "website",
      url: absoluteUrl(variantHref(slug)),
      title: `${title} — ${site.name}`,
      description,
      images: [{ url: variant.image, width: 800, height: 800, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [variant.image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const variant = getVariant(slug);
  if (!variant) notFound();

  const saving = product.compareAtCents - product.priceCents;
  const savingPct = Math.round((saving / product.compareAtCents) * 100);
  const related = variants.filter((v) => v.slug !== slug).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`${variantHref(slug)}#product`),
    name: `${product.shortName} — ${variant.name}`,
    sku: `${product.sku}-${slug.toUpperCase()}`,
    pattern: variant.name,
    description: `${variant.tagline} ${site.description}`,
    image: [absoluteUrl(variant.image)],
    brand: { "@type": "Brand", name: site.name },
    weight: { "@type": "QuantitativeValue", value: 190, unitCode: "GRM" },
    material: "Breathable 3D air mesh with high-elastic cotton filler",
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: 0.4,
      suggestedMaxAge: 2,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating.value,
      reviewCount: product.rating.count,
      bestRating: 5,
      worstRating: 1,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(variantHref(slug)),
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: site.legalName },
    },
    isVariantOf: { "@id": absoluteUrl("/products#product") },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: absoluteUrl("/products"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: variant.name,
        item: absoluteUrl(variantHref(slug)),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/*
        Full-screen like the home hero (min-height, never fixed — this panel
        carries far more content than the home fold, so it is free to grow
        past 100vh rather than clip). clip-path (not overflow-hidden) lets the
        blobs bleed up into the transparent nav while still being cut clean at
        the section's own bottom edge, matching the home hero's rule: no shape
        may spill into the section after it.
      */}
      <section
        style={{ clipPath: "inset(-160px 0 0 0)" }}
        className="relative -mt-(--nav-height) flex min-h-[calc(100svh-var(--announce-height))] flex-col justify-center bg-cream pt-[calc(var(--nav-height)+2.5rem)] pb-20 md:pb-28"
      >
        <Blob
          shape="d"
          spin={22}
          className="pointer-events-none absolute -top-28 -left-40 w-120 text-rose-50"
        />
        <Blob
          shape="a"
          spin={-18}
          className="pointer-events-none absolute -right-56 -bottom-40 w-136 text-lilac-100"
        />
        <LineArt
          name="butterfly"
          className="pointer-events-none absolute top-24 right-[6%] hidden w-16 rotate-6 text-rose-200 lg:block"
        />

        <div className="container-page relative z-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: variant.name },
            ]}
          />

          <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            {/* --- imagery --- */}
            <div className="min-w-0">
              <div
                className={cn(
                  "relative aspect-square w-full overflow-hidden rounded-panel shadow-drift",
                  variant.tone,
                )}
              >
                <Image
                  src={variant.image}
                  alt={`${variant.name} baby head protector backpack shown from the back with wings and adjustable harness`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="object-cover"
                />
                <span className="eyebrow absolute top-4 left-4 rounded-tag bg-paper/90 px-3 py-2 text-rose-600 backdrop-blur-sm">
                  Save {savingPct}%
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="relative aspect-square overflow-hidden rounded-card bg-blush">
                  <Image
                    src="/images/lifestyle/hero-baby-butterfly.png"
                    alt="Toddler walking while wearing the butterfly head protector backpack"
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-card bg-lilac-100">
                  <Image
                    src="/images/product/mesh-detail.jpg"
                    alt="Close-up of the breathable 3D air-mesh shell"
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-card bg-mint/30">
                  <Image
                    src="/images/product/green-owl.jpg"
                    alt="The adjustable shoulder harness seen from behind"
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* --- buy panel --- */}
            <div className="min-w-0">
              <p className="eyebrow text-rose-600">{site.name}</p>
              <h1 className="mt-4 font-display text-heading text-ink uppercase">
                {variant.name}
              </h1>
              <p className="mt-3 font-script text-3xl text-lilac-500">
                {product.shortName}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <span className="flex items-center gap-1 text-rose-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      className="size-4 fill-current"
                      strokeWidth={1}
                    />
                  ))}
                </span>
                <p className="text-body-sm text-ink-soft">
                  <span className="font-headline text-ink">
                    {product.rating.value}
                  </span>{" "}
                  from{" "}
                  <span className="font-headline text-ink">
                    {product.rating.count.toLocaleString(product.locale)}
                  </span>{" "}
                  parents
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-baseline gap-4">
                <p className="font-mega text-5xl leading-none font-black text-ink">
                  {formatPrice(product.priceCents)}
                </p>
                <p className="text-body text-ink-faint line-through">
                  {formatPrice(product.compareAtCents)}
                </p>
                <span className="eyebrow rounded-tag bg-rose-50 px-3 py-2 text-rose-600">
                  In stock
                </span>
              </div>

              <p className="mt-6 max-w-lg text-body text-ink-soft">
                {variant.tagline} Underneath the design it is the same protector
                every parent trusts: an impact-absorbing ring behind the head, a
                breathable 3D air-mesh shell and a harness that adjusts from the
                first crawl to confident walking.
              </p>

              <BuyBox variant={variant} />

              <div className="mt-10">
                <p className="eyebrow text-ink-faint">Other styles</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {variants.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={variantHref(item.slug)}
                        aria-current={item.slug === slug ? "page" : undefined}
                        className={cn(
                          "block rounded-btn border px-4 py-2.5 text-body-sm transition-colors duration-300",
                          item.slug === slug
                            ? "border-rose-600 bg-rose-600 text-paper"
                            : "border-hairline text-ink hover:border-rose-400",
                        )}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="border-t border-hairline pt-3"
                  >
                    <dt className="eyebrow text-ink-faint">{spec.label}</dt>
                    <dd className="mt-1.5 font-headline text-base text-ink">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* --- details + FAQ --- */}
      <section
        aria-labelledby="details-heading"
        className="bg-paper py-16 md:py-24"
      >
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2
              id="details-heading"
              className="font-display text-heading-sm text-ink uppercase"
            >
              Good to know
            </h2>
            <p className="mt-4 font-script text-3xl text-rose-500">
              before the first wobble
            </p>
          </div>

          <ul className="flex flex-col">
            {faqs.map((faq) => (
              <li
                key={faq.q}
                className="border-b border-hairline py-6 first:border-t first:pt-6"
              >
                <h3 className="font-headline text-lg text-ink">{faq.q}</h3>
                <p className="mt-3 max-w-2xl text-body text-ink-soft">
                  {faq.a}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- related --- */}
      <section
        aria-labelledby="related-heading"
        className="bg-cream py-16 md:py-20"
      >
        <div className="container-page">
          <div className="flex items-end justify-between gap-6">
            <h2
              id="related-heading"
              className="font-display text-heading-sm text-ink uppercase"
            >
              You may also like
            </h2>
            <Link
              href="/products"
              className="link-underline font-label text-[0.72rem] tracking-[0.2em] text-rose-600 uppercase"
            >
              All ten styles
            </Link>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.slug} className="group">
                <Link
                  href={variantHref(item.slug)}
                  className="flex flex-col gap-3"
                >
                  <span
                    className={cn(
                      "relative block aspect-square overflow-hidden rounded-panel transition-shadow duration-500 group-hover:shadow-drift",
                      item.tone,
                    )}
                  >
                    <Image
                      src={item.image}
                      alt={`${item.name} baby head protector backpack`}
                      fill
                      sizes="(min-width: 1024px) 22vw, 45vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  </span>
                  <span className="font-headline text-base text-ink transition-colors group-hover:text-rose-600">
                    {item.name}
                  </span>
                  <span className="text-body-sm text-ink-faint">
                    {formatPrice(product.priceCents)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
