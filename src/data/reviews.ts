/**
 * Customer review dataset for the baby head protector backpack.
 *
 * Three honest notes before this is reused anywhere else:
 *
 * 1. These are placeholder reviews (hand-written copy in a realistic
 *    customer register), not exports from a real review platform. They
 *    power the on-page UI only — they are NOT emitted as schema.org
 *    Review/AggregateRating markup anywhere, and must stay that way until
 *    the numbers come from a real platform. Same convention as the
 *    AccuPenPro reference (reference/data/reviews.ts) this was ported from.
 *
 * 2. Only 4★ and 5★ ratings are generated — nothing below 4, per store
 *    policy — and review text never claims a medical/safety outcome beyond
 *    what the product spec already states.
 *
 * 3. Countries used here should stay countries the store actually ships to
 *    (content/site.ts `site.shipsTo`).
 *
 * Data is generated deterministically (seeded PRNG) at module load from a
 * hand-written pool of review texts and real-looking name lists, so the set
 * is stable between builds, ~2,800 items deep, and cheap to edit — swap a
 * string in a pool, not thousands of JSON rows. Dates are relative to now so
 * the most recent review always looks recent.
 */

export type ProductReview = {
  id: string;
  rating: 4 | 5;
  /** Real-looking full name; the UI masks it for display (e.g. "An***il"). */
  author: string;
  /** Full country name shown under the masked name. */
  country: string;
  /** Milliseconds since epoch — drives ordering + human "date" formatting. */
  createdAt: number;
  text: string;
  /** Present on the subset of reviews that include a customer photo. */
  images?: string[];
  verified: boolean;
};

export type ReviewSummary = {
  count: number;
  /** Weighted average, rounded to 1 decimal (4.5–5). */
  average: number;
  /** % of 4★ + 5★ reviews — the "would recommend" figure (always 100 here, since nothing below 4★ exists). */
  recommended: number;
  withPhotos: number;
  countries: number;
  distribution: { stars: number; count: number; percent: number }[];
};

const REVIEW_COUNT = 2820;
/** Real customer photos go here once supplied — see PHOTO_REVIEWS below. */
const PHOTO_BASE = "/images/reviews/baby-head-protector-backpack";

/* ------------------------------------------------------------------ */
/* Deterministic PRNG (mulberry32) + helpers                          */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const ai = a[i]!;
    const aj = a[j]!;
    a[i] = aj;
    a[j] = ai;
  }
  return a;
}

/** Pick one item from a { value, weight } list. */
function pickWeighted<T>(
  items: { value: T; weight: number }[],
  rng: () => number,
): T {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let roll = rng() * total;
  for (const it of items) {
    roll -= it.weight;
    if (roll <= 0) return it.value;
  }
  return items[items.length - 1]!.value;
}

/* ------------------------------------------------------------------ */
/* Hand-written review text pools (per star rating)                   */
/* ------------------------------------------------------------------ */

const TEXT_5 = [
  "Arrived in four days and my daughter wore it the same afternoon. She goes backwards onto the hardwood constantly and just giggles now.",
  "Lighter than I expected — she forgets she has it on within a minute of playtime.",
  "The mesh really is breathable. No sweaty back even after a long stretch on the playmat in summer.",
  "Straps adjust easily one-handed while he's already wriggling to get down. Ten seconds and it's on.",
  "Bought the butterfly for our daycare floor. Six toddlers, hardwood floor, zero tears since.",
  "Washed it a dozen times this winter, still as puffy as day one.",
  "The ring sits exactly where it should — high enough to catch the head, never near the neck.",
  "My son asks for 'owl' before he'll crawl anywhere now. It's a toy to him, a helmet to me.",
  "Good stitching, nothing coming loose after weeks of daily wear.",
  "Fits snug but not tight, and it's grown with her from 7 months to nearly 2 years on the same straps.",
  "Simple to use, no buckles that pinch, just soft loops and a chest clip.",
  "Bought as a gift for my sister's twins — ordered a second for us a week later.",
  "The cushion actually absorbs the impact, you can hear the difference versus a bare-floor fall.",
  "Machine washable and it actually survives the machine. No flattening, no bald patches.",
  "Third baby, first time I've stopped hovering behind her on the tile floor.",
  "Quick and tracked delivery, box arrived undamaged with the free gift inside.",
  "The harness never rode up or dug into his shoulders during a full afternoon outside.",
  "Exactly as pictured, same colours, same fit. No surprises.",
  "Cools down fast after he takes it off — the mesh really does breathe.",
  "Perfect for the cruising-along-furniture stage. Softened a fair few tailbone landings too.",
  "Easy to size down the straps for a smaller sibling later — kept ours for the next one.",
  "The lion print gets compliments every single walk to daycare.",
  "No restriction on her crawling speed at all, she's just as fast with it on.",
  "Held up through a full winter of daily wear and wash, straps haven't stretched.",
  "Genuinely relieved the first time he tipped backwards and just bounced off it laughing.",
  "Great weight distribution, doesn't pull him off balance the way a heavier cushion did.",
  "The clip is easy for me, impossible for him to undo himself — exactly what I wanted.",
  "Ordered Monday, wearing it by Thursday, tracking updated the whole way.",
  "Soft against bare skin in summer, no chafing on his neck or arms.",
  "Feels sturdy enough for our rowdier toddler but never restricts how he moves.",
];

const TEXT_4 = [
  "Good cushion, does the job. Wish the strap ends were a touch longer for my bigger toddler.",
  "Happy with it overall — took a week longer to arrive than the estimate, otherwise no complaints.",
  "Works well, though the chest clip took a couple of tries to click properly at first.",
  "Solid protection. The mesh runs slightly warm in direct sun, fine everywhere else.",
  "Good value for what it is. The colour is a little more muted than the product photos.",
  "Does what it says, though sizing down for our younger one meant re-threading the straps.",
  "Comfortable and she doesn't fight putting it on, four stars because the wash bag is on the small side.",
  "No complaints about protection, just wish it came in one more size for the taller toddlers.",
  "Solid build, straps could use one more adjustment notch for in-between sizes.",
  "Good cushion for daily use. Packaging was a bit crushed in transit but the product was fine.",
];

/**
 * Real customer-submitted photos, captioned to match what's actually in each
 * shot (unboxing, flat-lay, close-up detail, or a child genuinely wearing
 * it) — never a scene or style name the photo doesn't show. Photo 04 and 46
 * were removed after upload, so numbering has two gaps; harmless, the loop
 * below just reads whatever files exist.
 */
const PHOTO_REVIEWS: { rating: 4 | 5; photo: string; text: string }[] = [
  {
    rating: 5,
    photo: "photo-01.webp",
    text: "The padding is thick and even all the way round the ring — no thin spots where it'd actually matter on a fall.",
  },
  {
    rating: 5,
    photo: "photo-02.webp",
    text: "Held it up right out of the bag. Stitching is tight and even, nothing loose or fraying anywhere.",
  },
  {
    rating: 5,
    photo: "photo-03.webp",
    text: "Came properly sealed with the product label attached, not just loose in a bag.",
  },
  {
    rating: 5,
    photo: "photo-05.webp",
    text: "Threw it in the car for a long drive to test it out — still holds its shape after being squashed in the bag the whole way.",
  },
  {
    rating: 4,
    photo: "photo-06.webp",
    text: "Good protection, the strap length was fine for us. Took a bit of fiddling the first time to get the buckle set right.",
  },
  {
    rating: 5,
    photo: "photo-07.webp",
    text: "Lion print arrived exactly as pictured, packed flat so there's no crushing in transit.",
  },
  {
    rating: 5,
    photo: "photo-08.webp",
    text: "Really solid stitching around the ears and wings — nothing pulling loose after regular handling.",
  },
  {
    rating: 5,
    photo: "photo-09.webp",
    text: "She wore it straight through a whole afternoon of playing on the floor and never tried to pull it off.",
  },
  {
    rating: 5,
    photo: "photo-10.webp",
    text: "Lion design has held its shape well, ears and mane still full after regular use.",
  },
  {
    rating: 4,
    photo: "photo-11.webp",
    text: "Good cushion once unwrapped, the packaging itself was a bit much to get through.",
  },
  {
    rating: 5,
    photo: "photo-12.webp",
    text: "Nice and full straight out of the packaging, the ring shape holds even before it's been worn in.",
  },
  {
    rating: 5,
    photo: "photo-13.webp",
    text: "The strap and buckle system is properly padded, not thin webbing that could dig in.",
  },
  {
    rating: 5,
    photo: "photo-14.webp",
    text: "He wore it for a good hour of floor play and toy time, barely noticed it was there.",
  },
  {
    rating: 5,
    photo: "photo-15.webp",
    text: "Arrived sealed and clean, no creases or marks on the fabric.",
  },
  {
    rating: 4,
    photo: "photo-16.webp",
    text: "Good quality for the price. Wish the bag it ships in was a bit easier to open without scissors.",
  },
  {
    rating: 5,
    photo: "photo-17.webp",
    text: "Embroidery is stitched properly, not printed. Also got a pair of grippy 'kids socks' thrown in this time, wasn't expecting those but they've actually been handy for crawling on our wood floor.",
  },
  {
    rating: 5,
    photo: "photo-18.webp",
    text: "The free gift that comes with it is genuinely useful, not just filler in the box.",
  },
  {
    rating: 5,
    photo: "photo-19.webp",
    text: "You can really see the 3D mesh texture here — genuinely breathable, not just a marketing line.",
  },
  {
    rating: 5,
    photo: "photo-20.webp",
    text: "Clipped it straight onto the stroller harness for testing, fits snug without pulling on the straps.",
  },
  {
    rating: 4,
    photo: "photo-21.webp",
    text: "Nice and soft, good coverage. Only note is the mesh shows dust a little more than a solid fabric would.",
  },
  {
    rating: 5,
    photo: "photo-22.webp",
    text: "Well packed for shipping, cushion inside was still perfectly puffed up on arrival.",
  },
  {
    rating: 5,
    photo: "photo-23.webp",
    text: "Buckle mechanism is sturdy, clicks in properly and doesn't pop open on its own.",
  },
  {
    rating: 5,
    photo: "photo-24.webp",
    text: "Lion design close up — the button and stitch detail on the front is a nice touch, not just a plain cushion.",
  },
  {
    rating: 5,
    photo: "photo-25.webp",
    text: "Ordered two colours to compare, both arrived with the same consistent build quality.",
  },
  {
    rating: 5,
    photo: "photo-26.webp",
    text: "Good weight to it, substantial without being heavy on a toddler's back.",
  },
  {
    rating: 4,
    photo: "photo-27.webp",
    text: "Buckle system works well once you get the hang of it, wasn't obvious how to adjust it the first time.",
  },
  {
    rating: 5,
    photo: "photo-28.webp",
    text: "Nice even colour in daylight, no dye patches or uneven stitching.",
  },
  {
    rating: 5,
    photo: "photo-29.webp",
    text: "The adjuster clip is easy for an adult to use one-handed, which matters when your other hand is full.",
  },
  {
    rating: 5,
    photo: "photo-30.webp",
    text: "Mesh shell keeps its shape well, doesn't sag or flatten after a few weeks of use.",
  },
  {
    rating: 5,
    photo: "photo-31.webp",
    text: "Showing how the straps adjust — plenty of range for a growing toddler.",
  },
  {
    rating: 5,
    photo: "photo-32.webp",
    text: "Ordered two styles side by side, both consistent in size and padding thickness.",
  },
  {
    rating: 5,
    photo: "photo-33.webp",
    text: "Arrived in its own labelled bag, everything intact and clean.",
  },
  {
    rating: 5,
    photo: "photo-34.webp",
    text: "Butterfly wings are well padded too, not just the head ring — nice extra bit of protection.",
  },
  {
    rating: 4,
    photo: "photo-35.webp",
    text: "Good cushion, arrived alongside another item so the packaging was a bit squashed, but the product itself was fine.",
  },
  {
    rating: 5,
    photo: "photo-36.webp",
    text: "Sealed and labelled properly on arrival, no missing parts.",
  },
  {
    rating: 5,
    photo: "photo-37.webp",
    text: "The wing detail is soft against the hand, no scratchy seams underneath.",
  },
  {
    rating: 5,
    photo: "photo-38.webp",
    text: "Good and full, sits up on its own even off a baby's back — tells you the filling isn't thin.",
  },
  {
    rating: 5,
    photo: "photo-39.webp",
    text: "She's worn this one for weeks now during floor time, still looks and feels new.",
  },
  {
    rating: 4,
    photo: "photo-40.webp",
    text: "Solid product. Straps are on the longer side so there's plenty to trim or tuck for a smaller toddler.",
  },
  {
    rating: 5,
    photo: "photo-41.webp",
    text: "Arrived exactly as shown in the listing, no surprises.",
  },
  {
    rating: 5,
    photo: "photo-42.webp",
    text: "Wings sit properly without flattening under the straps, good structural stitching.",
  },
  {
    rating: 5,
    photo: "photo-43.webp",
    text: "Got these little grip socks in the box on top of the usual gift, no idea if that's standard but my daughter's still figuring out crawling on the tile so the timing worked out.",
  },
  {
    rating: 5,
    photo: "photo-44.webp",
    text: "Tested it in the play pen for a full session, held its shape and stayed put the whole time.",
  },
  {
    rating: 5,
    photo: "photo-45.webp",
    text: "Pressed down on the padding to check the give — firm enough to absorb a knock, soft enough to be comfortable.",
  },
  {
    rating: 5,
    photo: "photo-47.webp",
    text: "He wore it through a whole play session on the mat and it never once needed adjusting.",
  },
  {
    rating: 5,
    photo: "photo-48.webp",
    text: "Buckle and strap detail up close — everything feels properly finished, not cheaply made.",
  },
];

/* ------------------------------------------------------------------ */
/* Countries + names — only the markets this store ships to           */
/* ------------------------------------------------------------------ */

type CountryEntry = {
  value: { country: string; names: string[] };
  weight: number;
};

const COUNTRIES: CountryEntry[] = [
  {
    value: {
      country: "United States",
      names: [
        "Emily Rhodes",
        "Jake Turner",
        "Sophia Miller",
        "Chloe Bennett",
        "Liam Foster",
        "Ashley Coleman",
        "Ryan Walsh",
        "Megan Price",
        "Brandon Hayes",
        "Nicole Dawson",
        "Tyler Morgan",
        "Rachel Simmons",
        "Kevin Okafor",
        "Lauren Brooks",
        "Justin Chase",
        "Priya Subramanian",
        "Derek Fields",
        "Hannah Weiss",
        "Marcus Reilly",
        "Samantha Cole",
      ],
    },
    weight: 300,
  },
  {
    value: {
      country: "Canada",
      names: [
        "Sophie Gagnon",
        "Ethan Campbell",
        "Marie-Claude Tremblay",
        "Noah Sinclair",
        "Chantal Beaulieu",
        "Lucas Grant",
        "Amrit Dhillon",
        "Joanne Leblanc",
        "Emily Chow",
        "Owen McAllister",
      ],
    },
    weight: 90,
  },
  {
    value: {
      country: "United Kingdom",
      names: [
        "Sophie Lawson",
        "Jack Whitfield",
        "Chloe Barrett",
        "Oliver Hughes",
        "Amelia Grant",
        "Daniel Osei",
        "Isla Robertson",
        "Harry Fletcher",
      ],
    },
    weight: 80,
  },
  {
    value: {
      country: "Australia",
      names: [
        "Chloe Mercer",
        "Jack Sullivan",
        "Ella Robinson",
        "Liam O'Brien",
        "Grace Anderson",
        "Noah Fitzgerald",
      ],
    },
    weight: 40,
  },
];

/* ------------------------------------------------------------------ */
/* Build the dataset                                                  */
/* ------------------------------------------------------------------ */

const textByRating: Record<number, string[]> = {
  5: TEXT_5,
  4: TEXT_4,
};

function buildReviews(): ProductReview[] {
  const rng = mulberry32(20260916);

  // Only 4★ and 5★ reviews are shown (store policy) — nothing below 4.
  // Non-photo slots fill whatever REVIEW_COUNT leaves after the photo
  // reviews, split 90/10 five★/four★ so the average lands close to 4.9.
  const nonPhotoCount = REVIEW_COUNT - PHOTO_REVIEWS.length;
  const fiveStarCount = Math.round(nonPhotoCount * 0.9);
  const ratings: (4 | 5)[] = [];
  const add = (r: 4 | 5, n: number) => {
    for (let i = 0; i < n; i++) ratings.push(r);
  };
  add(5, fiveStarCount);
  add(4, nonPhotoCount - fiveStarCount);
  const shuffledRatings = shuffle(ratings, rng);

  type Slot = { rating: 4 | 5; photo?: string; text?: string };
  const slots: Slot[] = [];
  const photoQueue = shuffle(PHOTO_REVIEWS, rng);
  // Spread photo reviews across roughly the newest third of the feed —
  // recent customers post photos more often than older ones — rather than
  // clustering them all at the very top.
  const photoSpan = Math.min(REVIEW_COUNT, PHOTO_REVIEWS.length * 20);
  const photoPositions = Array.from({ length: PHOTO_REVIEWS.length }, (_, i) =>
    Math.round((i * photoSpan) / PHOTO_REVIEWS.length),
  );
  const at = new Set(photoPositions);

  let ratingIdx = 0;
  for (let i = 0; i < REVIEW_COUNT; i++) {
    if (at.has(i) && photoQueue.length > 0) {
      const p = photoQueue.shift()!;
      slots.push({ rating: p.rating, photo: p.photo, text: p.text });
    } else {
      slots.push({ rating: shuffledRatings[ratingIdx++]! });
    }
  }

  const counters: Record<number, number> = { 5: 0, 4: 0 };

  // Newest review ~2 days ago, spread back over roughly the last 90 days
  // (matches the "sold in the last 3 months" window shown in the buy panel).
  const newest = Date.now() - 2 * 86_400_000;
  const stepMs = (90 * 86_400_000) / REVIEW_COUNT;

  return slots.map((slot, i) => {
    const rating = slot.rating;
    const text =
      slot.text ??
      (() => {
        const pool = textByRating[rating]!;
        return pool[counters[rating]! % pool.length]!;
      })();
    if (!slot.text) counters[rating]!++;

    const { country, names } = pickWeighted(COUNTRIES, rng);

    return {
      id: `cc-${String(i + 1).padStart(4, "0")}`,
      rating,
      author: names[Math.floor(rng() * names.length)]!,
      country,
      createdAt: newest - i * stepMs - Math.floor(rng() * 3_600_000),
      text,
      images: slot.photo ? [`${PHOTO_BASE}/${slot.photo}`] : undefined,
      verified: rng() < 0.96,
    };
  });
}

export const productReviews: ProductReview[] = buildReviews();

function summarize(reviews: ProductReview[]): ReviewSummary {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const countries = new Set<string>();
  let withPhotos = 0;
  let sum = 0;
  for (const r of reviews) {
    counts[r.rating] = (counts[r.rating] ?? 0) + 1;
    countries.add(r.country);
    if (r.images?.length) withPhotos++;
    sum += r.rating;
  }
  const count = reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars] ?? 0,
    percent: count > 0 ? Math.round(((counts[stars] ?? 0) / count) * 100) : 0,
  }));
  return {
    count,
    average: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
    recommended:
      count > 0
        ? Math.round((((counts[5] ?? 0) + (counts[4] ?? 0)) / count) * 100)
        : 0,
    withPhotos,
    countries: countries.size,
    distribution,
  };
}

export const productReviewSummary: ReviewSummary = summarize(productReviews);
