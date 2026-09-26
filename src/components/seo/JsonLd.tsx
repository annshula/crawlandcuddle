import {
  faqs,
  product,
  productHandle,
  productPath,
  reviews,
  site,
  variants,
} from "@/content/site";
import { productReviewSummary } from "@/data/reviews";
import { getLiveReviews } from "@/lib/judgeme/reviews";
import { absoluteUrl } from "@/lib/utils";

const price = (product.priceCents / 100).toFixed(2);
const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;

/**
 * Structured data for rich results, emitted server-side so crawlers see it in
 * the initial HTML. The catalogue is modelled as a ProductGroup with ten
 * hasVariant entries — the shape Google expects for "same product, many
 * styles" — plus Organization, WebSite, Breadcrumb, ItemList and FAQPage.
 */
export async function JsonLd() {
  // Same live-with-fallback pattern as the product page itself — see
  // lib/judgeme/reviews.ts's doc comment. `aggregateRating` below is only
  // included when this resolves to real Judge.me data; the placeholder
  // dataset's own numbers must never be emitted as schema.org markup.
  const live = await getLiveReviews(productHandle);
  const reviewSummary = live?.summary ?? productReviewSummary;

  const organization = {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: site.name,
    legalName: site.legalName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon"),
    image: absoluteUrl("/opengraph-image"),
    email: site.email,
    telephone: site.phone,
    description: site.description,
    // Omitted entirely when there are no profiles — an empty sameAs is invalid.
    ...(site.socials.length > 0
      ? { sameAs: site.socials.map((s) => s.href) }
      : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
  };

  const website = {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: absoluteUrl("/"),
    name: site.name,
    description: site.description,
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en",
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": absoluteUrl("/#breadcrumb"),
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
    ],
  };

  const offer = (name: string, sku: string, url: string) => ({
    "@type": "Offer",
    url,
    name,
    sku,
    priceCurrency: product.currency,
    price,
    priceValidUntil,
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": absoluteUrl("/#organization") },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0",
        currency: product.currency,
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: ["US", "CA", "GB", "AU"],
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: site.address.country,
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 30,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
  });

  // Only built (and only ever spread in below) when reviews are genuinely
  // live from Judge.me — see the getLiveReviews() call above.
  const aggregateRating = live
    ? {
        "@type": "AggregateRating",
        ratingValue: reviewSummary.average,
        reviewCount: reviewSummary.count,
        bestRating: 5,
        worstRating: 1,
      }
    : null;

  const productGroup = {
    "@type": "ProductGroup",
    "@id": absoluteUrl("/products#product"),
    name: product.name,
    description: site.description,
    productGroupID: product.sku,
    variesBy: ["https://schema.org/pattern"],
    brand: { "@type": "Brand", name: site.name },
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: 0.4,
      suggestedMaxAge: 2,
    },
    weight: { "@type": "QuantitativeValue", value: 190, unitCode: "GRM" },
    material: "Breathable 3D air mesh with high-elastic cotton filler",
    ...(aggregateRating && { aggregateRating }),
    review: reviews.map((review) => ({
      "@type": "Review",
      reviewBody: review.quote,
      author: { "@type": "Person", name: review.name },
      reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5 },
    })),
    hasVariant: variants.map((variant) => ({
      "@type": "Product",
      "@id": absoluteUrl(`${productPath}#${variant.slug}`),
      name: `${product.shortName} — ${variant.name}`,
      sku: `${product.sku}-${variant.slug.toUpperCase()}`,
      pattern: variant.name,
      description: variant.tagline,
      image: absoluteUrl(variant.image),
      brand: { "@type": "Brand", name: site.name },
      ...(aggregateRating && { aggregateRating }),
      offers: offer(
        variant.name,
        `${product.sku}-${variant.slug.toUpperCase()}`,
        absoluteUrl(productPath),
      ),
    })),
  };

  const itemList = {
    "@type": "ItemList",
    "@id": absoluteUrl("/#styles"),
    name: "Baby head protector backpack — ten styles",
    numberOfItems: variants.length,
    itemListElement: variants.map((variant, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: variant.name,
      item: absoluteUrl(productPath),
      image: absoluteUrl(variant.image),
    })),
  };

  const faqSchema = {
    "@type": "FAQPage",
    "@id": absoluteUrl("/#faq"),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      breadcrumb,
      productGroup,
      itemList,
      faqSchema,
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Content is authored locally, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
