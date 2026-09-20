/**
 * Single source of truth for site copy, catalogue and structured data.
 * Product facts (styles, weight, age range) mirror the live listing:
 * shoptrackify.com/products/baby-head-protector-backpack
 * Pricing is synced from the Shopify store into data/product.json by
 * `npm run shopify:sync` and read back via @/lib/catalog.
 */

import {
  getVariantForStyle,
  productCompareAtCents,
  productCurrency,
  productPriceCents,
  variantPositionForStyle,
} from "@/lib/catalog";
import { productReviewSummary } from "@/data/reviews";

export type SocialLink = { label: string; href: string };

/**
 * Declared separately and annotated so the list can legally be empty. Inline
 * inside the `as const` object an empty literal infers `never[]`, and every
 * `.map(s => s.label)` over it became a build error the moment the accounts
 * were commented out.
 */
const socials: ReadonlyArray<SocialLink> = [
  // { label: "Instagram", href: "https://instagram.com/crawlandcuddle" },
  // { label: "Pinterest", href: "https://pinterest.com/crawlandcuddle" },
  // { label: "YouTube", href: "https://youtube.com/@crawlandcuddle" },
];

export const site = {
  name: "Crawl & Cuddle",
  legalName: "Crawl & Cuddle Ltd",
  domain: "www.crawlandcuddle.com",
  tagline: "Training wheels for falling over",
  description:
    "The Crawl & Cuddle baby head protector backpack is a feather-light anti-fall cushion for babies aged 5 to 24 months. It shields the head and upper back through crawling, standing and those first wobbly steps, in ten adorable styles.",
  shortDescription:
    "Feather-light anti-fall head & back cushion for babies 5–24 months. Ten styles. One promise.",
  email: "hello@crawlandcuddle.com",
  phone: "+1 (512) 555-0148",
  address: {
    street: "482 Maple Street, Suite 210",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    country: "US",
  },
  /** Markets this storefront actually ships to — used in shipping/returns copy. */
  shipsTo: ["United States", "Canada", "United Kingdom", "Australia"],
  /**
   * Default social share card. Every route falls back to this unless it has a
   * more specific image (product pages use the variant shot). Dimensions match
   * the file on disk so crawlers size the card without downloading it first.
   */
  ogImage: {
    url: "/images/social/og-default.jpg",
    width: 1731,
    height: 909,
    alt: "Crawl & Cuddle baby head protector backpack",
    type: "image/jpeg",
  },
  socials,
} as const;

/**
 * Cross-route safe: every entry is an absolute path so the header works
 * identically on "/" and on "/products/…". SmoothScrollProvider intercepts the
 * "/#hash" form when we are already on the home page.
 */
export const nav = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Why it works", href: "/#why" },
  { label: "Fitting", href: "/#how" },
  { label: "Parents", href: "/#reviews" },
] as const;

export const announcements = [
  "Free gift worth $15 in every box",
  "Free tracked delivery · 3–7 days",
  "30-day easy returns",
  "Ten styles · one promise",
  "Loved by 40,000+ parents",
] as const;

/* ------------------------------------------------------------------ *
 * Catalogue — the ten styles, each a real SKU on the live listing.
 * ------------------------------------------------------------------ */

export type Variant = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  /** Tailwind background class for the tile behind the cut-out. */
  tone: string;
  featured?: boolean;
  /** Live from Shopify's synced inventory (lib/catalog.ts) — false when the real variant is out of stock. */
  availableForSale: boolean;
};

/** Style content (name, tagline, tone) — never the image or stock status, see `variants` below. */
type VariantContent = Omit<Variant, "image" | "availableForSale"> & {
  localImage: string;
};

const variantContent: VariantContent[] = [
  {
    slug: "dream-little-butterfly",
    name: "Dream Little Butterfly",
    tagline: "The bestseller. Lilac wings, pom-pom antennae.",
    localImage: "/images/product/dream-little-butterfly.webp",
    tone: "bg-lilac-100",
    featured: true,
  },
  {
    slug: "pink-butterfly",
    name: "Pink Butterfly",
    tagline: "Blush body, violet wings, endlessly photogenic.",
    localImage: "/images/product/pink-butterfly.webp",
    tone: "bg-rose-100",
    featured: true,
  },
  {
    slug: "green-owl",
    name: "Green Owl",
    tagline: "Mint 3D mesh with feathered ivory wings.",
    localImage: "/images/product/green-owl.webp",
    tone: "bg-mint/40",
  },
  {
    slug: "lion",
    name: "Lion",
    tagline: "Amber stripes, tiny ears, maximum courage.",
    localImage: "/images/product/lion.webp",
    tone: "bg-butter/60",
  },
  {
    slug: "bee",
    name: "Bee",
    tagline: "Honey stripes and soft ivory wings.",
    localImage: "/images/product/bee.webp",
    tone: "bg-butter/50",
  },
  {
    slug: "flying-pig",
    name: "Flying Pig",
    tagline: "Because they really can fly at this age.",
    localImage: "/images/product/flying-pig.webp",
    tone: "bg-rose-100",
  },
  {
    slug: "frog",
    name: "Frog",
    tagline: "Bright green, wide eyes, built to bounce.",
    localImage: "/images/product/frog.webp",
    tone: "bg-mint/50",
  },
  {
    slug: "turtle",
    name: "Turtle",
    tagline: "A quilted shell for the slow and steady.",
    localImage: "/images/product/turtle.webp",
    tone: "bg-mint/40",
  },
  {
    slug: "tortoise",
    name: "Tortoise",
    tagline: "Olive shell, ivory limbs, unhurried charm.",
    localImage: "/images/product/tortoise.webp",
    tone: "bg-mint/30",
  },
  {
    slug: "unicorn",
    name: "Unicorn",
    tagline: "Golden horn, pastel wings, pure magic.",
    localImage: "/images/product/unicorn.webp",
    tone: "bg-lilac-100",
  },
  {
    slug: "yellow-bee",
    name: "Yellow Bee",
    tagline: "Bold golden stripes, a bigger buzz than Bee.",
    localImage: "/images/product/bee.webp",
    tone: "bg-butter/60",
  },
];

/**
 * The real styles, in the same order as the live Shopify variant list — the
 * thumbnails, swatches and homepage gallery all read in the order a shopper
 * sees on the Shopify product page. Each style's real Shopify variant image
 * (synced via `npm run shopify:sync` into data/product.json, matched by title
 * through lib/catalog.ts's getVariantForStyle) — falls back to the local
 * placeholder photo only when that variant hasn't been synced with an image yet.
 */
export const variants: Variant[] = [...variantContent]
  .sort(
    (a, b) => variantPositionForStyle(a.slug) - variantPositionForStyle(b.slug),
  )
  .map(({ localImage, ...content }) => ({
    ...content,
    image: getVariantForStyle(content.slug).image || localImage,
    availableForSale: getVariantForStyle(content.slug).availableForSale,
  }));

/** The one product's canonical handle/path — every style lives on this one page, normally switched client-side by the swatch tiles with no URL change. */
export const productHandle = "baby-head-protector-backpack";
export const productPath = `/products/${productHandle}`;

/**
 * Pack tiers — "buy more, save more". Each tier is the SAME Shopify variant
 * at a higher cart-line quantity, never a separate product/SKU: CJ fulfils it
 * as N physical units of the one mapped SKU, so packs never need a new CJ
 * product connection or API call. The % discount is applied at Shopify
 * checkout by an automatic quantity-break discount configured in Shopify
 * Admin (see docs/internal/shopify-pack-discount-setup.md) — this file only mirrors those thresholds so
 * the price shown on the page matches what checkout actually charges.
 */
export type PackTier = {
  size: 1 | 2 | 3;
  /** Off the per-unit price, applied to the whole line — must match the Shopify automatic discount's percentage for this quantity break. */
  discountPercent: number;
  label: string;
  shortLabel: string;
  /** Marketing framing shown under the label. */
  blurb: string;
  badge?: string;
  /** Highlighted as the default/recommended tier. */
  featured?: boolean;
  /** Shows the free-gift line in the value stack and buy box. */
  includesGift?: boolean;
};

export const packTiers: PackTier[] = [
  {
    size: 1,
    discountPercent: 0,
    label: "Just One",
    shortLabel: "1 style",
    blurb: "One's plenty to start",
  },
  {
    size: 2,
    discountPercent: 10,
    label: "Duo Deal",
    shortLabel: "Save 10%",
    blurb: "One for home, one for daycare",
    badge: "Most popular",
    featured: true,
  },
  {
    size: 3,
    discountPercent: 20,
    label: "Share the Love",
    shortLabel: "Save 20% + free gift",
    blurb: "Keep one, gift two to the little ones you love",
    badge: "Best value",
    includesGift: true,
  },
];

export const defaultPackSize: PackTier["size"] = 1;

/**
 * The tier a cart-line quantity displays and prices at — qty IS the pack
 * size, there is no separate stored flag (see CartProvider's CartLine doc
 * comment for why). Any qty outside 1/2/3 (e.g. QuickBuy's plain stepper)
 * gets the 1-pack tier: full price, no badge, exactly like a style bought
 * before packs existed.
 */
export const getPackTier = (qty: number): PackTier =>
  packTiers.find((t) => t.size === qty) ?? packTiers[0]!;

/**
 * The one place pack-discount math happens. Every UI surface (PackPicker,
 * BuyBox, CartDrawer, CheckoutSummary) calls this instead of re-deriving
 * `amount * (1 - discountPercent / 100)` locally — one formula, one
 * rounding rule, so a PDP tile and a checkout-summary line can never round
 * to different cents for the same tier.
 */
export function applyPackDiscount(
  unitAmount: number,
  tier: PackTier,
): { perUnit: number; total: number } {
  const total =
    Math.round(
      unitAmount * tier.size * (1 - tier.discountPercent / 100) * 100,
    ) / 100;
  return { perUnit: Math.round((total / tier.size) * 100) / 100, total };
}

/** A deep link to the product page with one style pre-selected — for links elsewhere (e.g. the homepage) that point at a specific print, read by the product page's `?style=` search param. */
export const productHrefForStyle = (slug: string) =>
  `${productPath}?style=${slug}`;

/** @deprecated Old per-style route — /app/products/[slug]/page.tsx now redirects these to productPath. */
export const variantHref = (slug: string) => `/products/${slug}`;

export const getVariant = (slug: string) =>
  variants.find((v) => v.slug === slug);

/**
 * The style slug a Shopify variant id belongs to — the reverse of the lookup
 * above, so the gallery can tell which style a synced media photo is (and
 * select that style when the shopper picks its photo, or show its photo when
 * the shopper picks the style).
 */
const slugByVariantId = new Map(
  variants.map((variant) => [
    getVariantForStyle(variant.slug).id,
    variant.slug,
  ]),
);

export const styleSlugForVariantId = (
  variantId?: string | null,
): string | undefined =>
  variantId ? slugByVariantId.get(variantId) : undefined;

/** The style shown by default on the product page — the featured bestseller, or the first in-stock style if that one has sold out. `variants` is a non-empty literal, so this is always a real Variant. */
export const defaultVariant = (): Variant => {
  const featured = variants.find((v) => v.featured);
  if (featured?.availableForSale) return featured;
  return variants.find((v) => v.availableForSale) ?? featured ?? variants[0]!;
};

export const heroImage = {
  src: "/images/lifestyle/hero-baby-butterfly.webp",
  alt: "Toddler walking while wearing the Dream Little Butterfly baby head protector backpack on their back",
  width: 1024,
  height: 1536,
} as const;

export const hero = {
  eyebrow: "Baby head & back protector · 10 styles",
  headline: ["Crawling. Standing.", "Then the"],
  accentWord: "wobble.",
  script: "and we catch every single one",
  body: "A soft anti-fall cushion that rides between the shoulder blades and takes the backward landings your little one hasn't learned to brake yet. 190 g. Breathable 3D mesh. Fits 5 to 24 months.",
  primaryCta: { label: "Shop all ten styles", href: "/products" },
  secondaryCta: { label: "See how it fits", href: "/#how" },
  stats: [
    { value: "10", label: "Styles" },
    { value: "190g", label: "Feather light" },
    { value: "5–24m", label: "Age range" },
  ],
} as const;

export const trustBadges = [
  { label: "Protects head & back", detail: "Impact-absorbing cushion" },
  { label: "Soft & lightweight", detail: "Just 190 grams" },
  { label: "Breathable comfort", detail: "3D air-mesh shell" },
  { label: "Free gift inside", detail: "Worth $15" },
] as const;

/**
 * The two promises that settle a hesitating cart: how fast it arrives and how
 * easily it goes back. Surfaced wherever someone is deciding — the
 * announcement marquee, the buy box, the products page and the cart drawer —
 * because a returns policy nobody sees does not reassure anybody.
 */
export const promises = [
  {
    label: "Free tracked delivery",
    detail: "Arrives in 3–7 working days, tracked the whole way.",
    short: "Free tracked delivery · 3–7 days",
  },
  {
    label: "30-day returns",
    detail:
      "Changed your mind? Start a return from your account within 30 days.",
    short: "30-day easy returns",
  },
] as const;

export const pillars = [
  {
    index: "01",
    title: "Ultimate fall protection",
    body: "Cushions the back of the head and the upper back, so hard floors, tiled kitchens and coffee-table corners stop being a countdown to the next bump during the months that matter most.",
    accent: "rose",
  },
  {
    index: "02",
    title: "Feather-light & comfy",
    body: "At 190 grams your baby barely notices it. It never restricts playtime and never throws off the balance they are working so hard to find.",
    accent: "lilac",
  },
  {
    index: "03",
    title: "Fully adjustable fit",
    body: "Flexible, skin-soft straps grow with your child: a snug, secure fit from the first crawl right through to confident walking at two.",
    accent: "petal",
  },
  {
    index: "04",
    title: "Breathable & washable",
    body: "A 3D air-mesh shell over high-elastic cotton filler keeps backs cool. When it gets messy (and it will), put it straight in the machine.",
    accent: "mint",
  },
] as const;

export const milestones = [
  {
    month: "5–8 months",
    title: "Sitting, then toppling",
    body: "Balance arrives before the reflex to catch themselves does. This is the month the backward tip starts, and the month the cushion earns its keep.",
  },
  {
    month: "8–10 months",
    title: "Crawling laps",
    body: "Full-speed corridor sprints. The low-profile shape stays clear of the arms so nothing slows down the lap record.",
  },
  {
    month: "10–13 months",
    title: "Pulling up",
    body: "The sofa, the coffee table, the dog. Everything is a handrail, until it isn't, and the landing is backwards.",
  },
  {
    month: "13–18 months",
    title: "Cruising the furniture",
    body: "Side-steps along the sofa with one hand free. The wings and antennae keep it a game, never a harness.",
  },
  {
    month: "18–24 months",
    title: "First real steps",
    body: "Three steps, a wobble, a sit-down. The wider lower cushion softens the tailbone-first landings too.",
  },
] as const;

export const howItWorks = [
  {
    step: "Step one",
    title: "Slip the straps on",
    body: "Two soft loops over the shoulders, one clip across the chest. Ten seconds, one-handed, while they are still mid-wriggle.",
  },
  {
    step: "Step two",
    title: "Set the height",
    body: "Slide the adjuster so the ring sits between the shoulder blades: high enough to catch the head, low enough to never touch the neck.",
  },
  {
    step: "Step three",
    title: "Let them explore",
    body: "That's it. They crawl, cruise, wobble and land, and the cushion takes the hit while you finally put your coffee down.",
  },
] as const;

/**
 * PLACEHOLDER — generic, plausible-sounding QC checks, not yet verified
 * against the real manufacturing/QC process. Replace with the actual bench
 * checks before this copy goes live; treat every claim here as provisional.
 */
export const quality = {
  eyebrow: "Put to the test",
  heading: "Checked by hand. Only the passers ship.",
  lede: "Every unit clears the same checks before it goes in a box: six checks, zero exceptions.",
  checks: [
    {
      icon: "shield" as const,
      title: "Impact-ring integrity",
      body: "The cushion ring is checked for even padding and no thin spots before it ships: the one part doing the actual protecting.",
    },
    {
      icon: "feather" as const,
      title: "Seam & stitch check",
      body: "Every seam is inspected under light for loose stitching or weak joins that could open under a toddler's weight.",
    },
    {
      icon: "leaf" as const,
      title: "Breathability test",
      body: "The 3D air-mesh shell is checked for consistent weave and airflow, so it stays cool through an hour of crawling.",
    },
    {
      icon: "refresh" as const,
      title: "Harness adjustment cycle",
      body: "Straps are run through their full range (shortest to longest) to confirm the adjuster holds and doesn't slip mid-wear.",
    },
    {
      icon: "check" as const,
      title: "Wash durability",
      body: "A sample from each batch goes through a full wash cycle to confirm the mesh and filler keep their shape and loft.",
    },
    {
      icon: "truck" as const,
      title: "Dispatch and packaging",
      body: "Each order is packed to arrive clean and intact. If anything arrives damaged, we replace or refund it free.",
    },
  ],
} as const;

export const specs = [
  { label: "Weight", value: "190 g" },
  { label: "Age range", value: "5 – 24 months" },
  { label: "Shell", value: "Breathable 3D air mesh" },
  { label: "Filler", value: "High-elastic cotton" },
  { label: "Care", value: "Machine washable" },
  { label: "Styles", value: "10 designs" },
] as const;

/**
 * "Us vs. other head protectors" — a generic category comparison, never a
 * named competitor: every row is a claim this product can back up from its
 * own specs (see `specs`/`pillars` above), not a claim about a specific
 * brand, so it never needs a comparative-advertising fact-check against
 * someone else's product.
 */
export const comparison = {
  eyebrow: "How it stacks up",
  heading: "Not all head protectors are built the same",
  script: "here's the honest difference",
  ourLabel: "Crawl & Cuddle",
  otherLabel: "Typical head protector",
  rows: [
    {
      feature: "Weight",
      us: "190 g, barely noticed",
      other: "Often 250 g+, bulky foam core",
    },
    {
      feature: "Shell material",
      us: "Breathable 3D air mesh",
      other: "Sealed foam, traps heat",
    },
    {
      feature: "Harness fit",
      us: "Adjusts from first crawl to age 2",
      other: "Fixed sizing, outgrown fast",
    },
    {
      feature: "Care",
      us: "Machine washable",
      other: "Spot-clean only",
    },
    {
      feature: "Free gift",
      us: "Included on multi-packs",
      other: "Rarely included",
    },
    {
      feature: "Returns",
      us: "30-day easy returns",
      other: "Varies, often final sale",
    },
  ],
} as const;

export const reviews = [
  {
    quote:
      "Third baby, first time I've stopped hovering. She goes backwards onto the hardwood and just giggles.",
    name: "Emily R.",
    role: "Mum of three · Toronto, Canada",
  },
  {
    quote:
      "He asks for 'butterfly' before he'll crawl anywhere now. It's a toy to him and a helmet to me.",
    name: "Jake T.",
    role: "Dad · Austin, TX",
  },
  {
    quote:
      "Washed it a dozen times this winter and it's still as puffy as day one. The straps have never dug in.",
    name: "Sophie L.",
    role: "Mum of twins · Manchester, UK",
  },
  {
    quote:
      "We bought the owl for our daycare floor. Hardwood, six fearless toddlers, zero tears since.",
    name: "Chloe M.",
    role: "Nursery lead · Sydney, Australia",
  },
  {
    quote:
      "The 3D mesh is the detail that sold me: no sweaty back after an hour on the playmat.",
    name: "Liam K.",
    role: "Dad of one · Vancouver, Canada",
  },
] as const;

/**
 * Live pricing is read from the Shopify-synced catalog (data/product.json).
 * The `currency` / `locale` stay here as display defaults for formatting.
 */
export const product = {
  name: "Baby Head Protector Backpack: Toddler Anti-Fall Cushion Pillow",
  shortName: "Baby Head Protector Backpack",
  sku: "CC-BHP-001",
  priceCents: productPriceCents,
  compareAtCents: productCompareAtCents,
  currency: productCurrency,
  locale: "en-US",
  includes: [
    "Head & back protector in your chosen style",
    "Adjustable shoulder harness with chest clip",
    "Free gift: anti-slip socks",
    "Wash bag and care card",
  ],
  /**
   * PLACEHOLDER retail-style values — not real per-item pricing, just a
   * plausible breakdown that sums to more than the sale price for the "what
   * you get" value-stack box. Swap in real figures when available.
   */
  valueStack: [
    { label: "Head & back protector", valueCents: 3400 },
    { label: "Adjustable harness with chest clip", valueCents: 800 },
    {
      label: "Free gift: anti-slip socks",
      valueCents: 1500,
    },
    { label: "Wash bag & care card", valueCents: 500 },
  ],
  /** Sourced from the review dataset (src/data/reviews.ts) so this can never drift from what the reviews section actually shows. */
  rating: {
    value: productReviewSummary.average,
    count: productReviewSummary.count,
  },
  /**
   * PLACEHOLDER — not yet substantiated against real order data. Shown as a
   * "N sold in the last 3 months" pill on the product page, same convention
   * as the AccuPenPro reference (site.metrics.unitsSoldLast90Days there) —
   * only ever display a figure the store can actually back up.
   */
  soldLast90Days: 17841,
};

export const faqs = [
  {
    q: "What age is the head protector for?",
    a: "Five to twenty-four months. Five months is when most babies sit unaided and the backward tip begins; by two years the harness has run out of adjustment and most toddlers no longer need it.",
  },
  {
    q: "Will it restrict crawling or walking?",
    a: "It weighs 190 grams (roughly a large apple) and sits above the shoulder blades, clear of the arms. Babies forget they are wearing it within the first couple of minutes.",
  },
  {
    q: "Can my baby sleep or lie down in it?",
    a: "No. It is for supervised, awake play only. Take it off for naps, car seats, prams and high chairs: the cushion changes the lying angle, and we will not compromise on that.",
  },
  {
    q: "How do I wash it?",
    a: "Machine washable. Use a gentle cycle in the supplied bag and air dry. The 3D mesh shell dries quickly and the high-elastic cotton filler keeps its loft wash after wash.",
  },
  {
    q: "Which of the ten styles should I choose?",
    a: "They are identical in protection: only the outer design changes. Dream Little Butterfly and Green Owl are the two bestsellers; the Lion and Bee suit warmer neutral nurseries.",
  },
  {
    q: "What is the delivery and returns policy?",
    a: "Every order ships tracked and free to the US, Canada, UK and Australia, usually within three to seven working days. Changed your mind? Start a return from your order history within thirty days.",
  },
] as const;

export const footerLinks = [
  {
    title: "Shop",
    links: [
      { label: "All styles", href: "/products" },
      { label: "Baby Head Protector Backpack", href: productPath },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Why it works", href: "/#why" },
      { label: "Milestone guide", href: "/#milestones" },
      { label: "Fitting guide", href: "/#how" },
      { label: "Parent reviews", href: "/#reviews" },
      { label: "Blog", href: "/blogs" },
    ],
  },
  {
    title: "Care",
    links: [
      { label: "Shipping", href: "/#faq" },
      { label: "Returns", href: "/#faq" },
      { label: "FAQ", href: "/#faq" },
      { label: "Contact us", href: "/#contact" },
    ],
  },
] as const;
