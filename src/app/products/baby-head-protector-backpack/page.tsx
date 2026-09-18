import type { Metadata } from "next";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductReviews } from "@/components/product/ProductReviews";
import { QualityChecks } from "@/components/product/QualityChecks";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  defaultVariant,
  faqs,
  product,
  productPath,
  site,
  variants,
} from "@/content/site";
import { productReviews, productReviewSummary } from "@/data/reviews";
import { absoluteUrl, formatPrice } from "@/lib/utils";

/**
 * Mirrors the reference's product page: an ISR window as the fallback for the
 * tag/path purges the products/create|update webhook fires. NOTE this page
 * still resolves pricing through `lib/catalog.ts`'s static import (as the
 * reference's does too), so a purge re-renders the same bytes until the
 * pricing path is converted to live reads — see `lib/product-live.ts`.
 */
export const revalidate = 3600;

export const metadata: Metadata = (() => {
  const hero = defaultVariant();
  const title = product.shortName;
  const description = `${site.shortDescription} A 190 g breathable anti-fall cushion that protects the head and back from 5 to 24 months. ${formatPrice(product.priceCents)} with a free gift and free tracked shipping. Ten styles to choose from.`;

  return {
    title,
    description,
    alternates: { canonical: productPath },
    openGraph: {
      type: "website",
      url: absoluteUrl(productPath),
      siteName: site.name,
      title: `${title} — ${site.name}`,
      description,
      locale: "en_US",
      images: [
        { url: hero.image, width: 800, height: 800, alt: title },
        { ...site.ogImage },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        { url: hero.image, width: 800, height: 800, alt: title },
        { ...site.ogImage },
      ],
    },
  };
})();

export default async function ProductDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;
  const initialSlug = variants.find((v) => v.slug === style)?.slug;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": absoluteUrl(`${productPath}#product`),
    name: product.name,
    productGroupID: product.sku,
    description: site.description,
    image: variants.map((v) => absoluteUrl(v.image)),
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
    variesBy: ["https://schema.org/pattern"],
    hasVariant: variants.map((v) => ({
      "@type": "Product",
      "@id": absoluteUrl(`${productPath}#${v.slug}`),
      name: `${product.shortName} — ${v.name}`,
      sku: `${product.sku}-${v.slug.toUpperCase()}`,
      pattern: v.name,
      image: absoluteUrl(v.image),
      offers: {
        "@type": "Offer",
        url: absoluteUrl(productPath),
        priceCurrency: product.currency,
        price: (product.priceCents / 100).toFixed(2),
        priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: site.legalName },
      },
    })),
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
        name: product.shortName,
        item: absoluteUrl(productPath),
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
              { label: product.shortName },
            ]}
          />

          <ProductPurchase variants={variants} initialSlug={initialSlug} />
        </div>
      </section>

      <QualityChecks />

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

      <ProductReviews reviews={productReviews} summary={productReviewSummary} />
    </>
  );
}
