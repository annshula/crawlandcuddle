import {
  faqs,
  product,
  reviews,
  site,
  variantHref,
  variants,
} from "@/content/site";
import { absoluteUrl } from "@/lib/utils";

const price = (product.priceCents / 100).toFixed(2);
const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;

/**
 * Structured data for rich results, emitted server-side so crawlers see it in
 * the initial HTML. The catalogue is modelled as a ProductGroup with ten
 * hasVariant entries — the shape Google expects for "same product, many
 * styles" — plus Organization, WebSite, Breadcrumb, ItemList and FAQPage.
 */
export function JsonLd() {
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
    sameAs: site.socials.map((s) => s.href),
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
        addressCountry: site.address.country,
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

  const aggregateRating = {
    "@type": "AggregateRating",
    ratingValue: product.rating.value,
    reviewCount: product.rating.count,
    bestRating: 5,
    worstRating: 1,
  };

  const productGroup = {
    "@type": "ProductGroup",
    "@id": absoluteUrl("/#product"),
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
    aggregateRating,
    review: reviews.map((review) => ({
      "@type": "Review",
      reviewBody: review.quote,
      author: { "@type": "Person", name: review.name },
      reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5 },
    })),
    hasVariant: variants.map((variant) => ({
      "@type": "Product",
      "@id": absoluteUrl(variantHref(variant.slug)),
      name: `${product.shortName} — ${variant.name}`,
      sku: `${product.sku}-${variant.slug.toUpperCase()}`,
      pattern: variant.name,
      description: variant.tagline,
      image: absoluteUrl(variant.image),
      brand: { "@type": "Brand", name: site.name },
      aggregateRating,
      offers: offer(
        variant.name,
        `${product.sku}-${variant.slug.toUpperCase()}`,
        absoluteUrl(variantHref(variant.slug)),
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
      item: absoluteUrl(variantHref(variant.slug)),
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
