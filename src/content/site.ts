/**
 * Single source of truth for site copy, catalogue and structured data.
 * Product facts (styles, weight, age range, pricing) mirror the live listing:
 * shoptrackify.com/products/baby-head-protector-backpack
 */

export const site = {
  name: "Crawl & Cuddle",
  legalName: "Crawl & Cuddle Ltd",
  domain: "www.crawlandcuddle.com",
  tagline: "Training wheels for falling over",
  description:
    "The Crawl & Cuddle baby head protector backpack is a feather-light anti-fall cushion for babies aged 5 to 24 months. It shields the head and upper back through crawling, standing and those first wobbly steps — in ten adorable styles.",
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
  socials: [
    { label: "Instagram", href: "https://instagram.com/crawlandcuddle" },
    { label: "Pinterest", href: "https://pinterest.com/crawlandcuddle" },
    { label: "YouTube", href: "https://youtube.com/@crawlandcuddle" },
  ],
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
  "Free shipping to the US, Canada, UK & Australia",
  "Ten styles · one promise",
  "Loved by 40,000+ parents",
  "Tracked delivery · easy returns",
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
};

export const variants: Variant[] = [
  {
    slug: "dream-little-butterfly",
    name: "Dream Little Butterfly",
    tagline: "The bestseller. Lilac wings, pom-pom antennae.",
    image: "/images/product/dream-little-butterfly.jpg",
    tone: "bg-lilac-100",
    featured: true,
  },
  {
    slug: "pink-butterfly",
    name: "Pink Butterfly",
    tagline: "Blush body, violet wings, endlessly photogenic.",
    image: "/images/product/pink-butterfly.jpg",
    tone: "bg-rose-100",
    featured: true,
  },
  {
    slug: "green-owl",
    name: "Green Owl",
    tagline: "Mint 3D mesh with feathered ivory wings.",
    image: "/images/product/green-owl.jpg",
    tone: "bg-mint/40",
  },
  {
    slug: "lion",
    name: "Lion",
    tagline: "Amber stripes, tiny ears, maximum courage.",
    image: "/images/product/lion.jpg",
    tone: "bg-butter/60",
  },
  {
    slug: "bee",
    name: "Bee",
    tagline: "Honey stripes and soft ivory wings.",
    image: "/images/product/bee.jpg",
    tone: "bg-butter/50",
  },
  {
    slug: "flying-pig",
    name: "Flying Pig",
    tagline: "Because they really can fly at this age.",
    image: "/images/product/flying-pig.jpg",
    tone: "bg-rose-100",
  },
  {
    slug: "frog",
    name: "Frog",
    tagline: "Bright green, wide eyes, built to bounce.",
    image: "/images/product/frog.jpg",
    tone: "bg-mint/50",
  },
  {
    slug: "turtle",
    name: "Turtle",
    tagline: "A quilted shell for the slow and steady.",
    image: "/images/product/turtle.jpg",
    tone: "bg-mint/40",
  },
  {
    slug: "tortoise",
    name: "Tortoise",
    tagline: "Olive shell, ivory limbs, unhurried charm.",
    image: "/images/product/tortoise.jpg",
    tone: "bg-mint/30",
  },
  {
    slug: "unicorn",
    name: "Unicorn",
    tagline: "Golden horn, pastel wings, pure magic.",
    image: "/images/product/unicorn.jpg",
    tone: "bg-lilac-100",
  },
];

/** Canonical URL for a single style's product page. */
export const variantHref = (slug: string) => `/products/${slug}`;

export const getVariant = (slug: string) => variants.find((v) => v.slug === slug);

export const heroImage = {
  src: "/images/lifestyle/hero-baby-butterfly.png",
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
    body: "Flexible, skin-soft straps grow with your child — a snug, secure fit from the first crawl right through to confident walking at two.",
    accent: "petal",
  },
  {
    index: "04",
    title: "Breathable & washable",
    body: "A 3D air-mesh shell over high-elastic cotton filler keeps backs cool. When it gets messy — and it will — put it straight in the machine.",
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
    body: "The sofa, the coffee table, the dog. Everything is a handrail — until it isn't, and the landing is backwards.",
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
    body: "Slide the adjuster so the ring sits between the shoulder blades — high enough to catch the head, low enough to never touch the neck.",
  },
  {
    step: "Step three",
    title: "Let them explore",
    body: "That's it. They crawl, cruise, wobble and land, and the cushion takes the hit while you finally put your coffee down.",
  },
] as const;

export const specs = [
  { label: "Weight", value: "190 g" },
  { label: "Age range", value: "5 – 24 months" },
  { label: "Shell", value: "Breathable 3D air mesh" },
  { label: "Filler", value: "High-elastic cotton" },
  { label: "Care", value: "Machine washable" },
  { label: "Styles", value: "10 designs" },
] as const;

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
      "The 3D mesh is the detail that sold me — no sweaty back after an hour on the playmat.",
    name: "Liam K.",
    role: "Dad of one · Vancouver, Canada",
  },
] as const;

export const product = {
  name: "Baby Head Protector Backpack — Toddler Anti-Fall Cushion Pillow",
  shortName: "Baby Head Protector Backpack",
  sku: "CC-BHP-001",
  priceCents: 4500,
  compareAtCents: 5200,
  currency: "USD",
  locale: "en-US",
  includes: [
    "Head & back protector in your chosen style",
    "Adjustable shoulder harness with chest clip",
    "Free gift: muslin comforter (worth $15)",
    "Wash bag and care card",
  ],
  rating: { value: 4.9, count: 2841 },
} as const;

export const faqs = [
  {
    q: "What age is the head protector for?",
    a: "Five to twenty-four months. Five months is when most babies sit unaided and the backward tip begins; by two years the harness has run out of adjustment and most toddlers no longer need it.",
  },
  {
    q: "Will it restrict crawling or walking?",
    a: "It weighs 190 grams — roughly a large apple — and sits above the shoulder blades, clear of the arms. Babies forget they are wearing it within the first couple of minutes.",
  },
  {
    q: "Can my baby sleep or lie down in it?",
    a: "No. It is for supervised, awake play only. Take it off for naps, car seats, prams and high chairs — the cushion changes the lying angle, and we will not compromise on that.",
  },
  {
    q: "How do I wash it?",
    a: "Machine washable. Use a gentle cycle in the supplied bag and air dry. The 3D mesh shell dries quickly and the high-elastic cotton filler keeps its loft wash after wash.",
  },
  {
    q: "Which of the ten styles should I choose?",
    a: "They are identical in protection — only the outer design changes. Dream Little Butterfly and Green Owl are the two bestsellers; the Lion and Bee suit warmer neutral nurseries.",
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
      { label: "All ten styles", href: "/products" },
      { label: "Dream Little Butterfly", href: "/products/dream-little-butterfly" },
      { label: "Green Owl", href: "/products/green-owl" },
      { label: "Unicorn", href: "/products/unicorn" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Why it works", href: "/#why" },
      { label: "Milestone guide", href: "/#milestones" },
      { label: "Fitting guide", href: "/#how" },
      { label: "Parent reviews", href: "/#reviews" },
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
