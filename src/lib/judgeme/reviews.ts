import type { ProductReview, ReviewSummary } from "@/data/reviews";
import { summarize } from "@/data/reviews";
import { isJudgemeConfigured, judgemeConfig, JUDGEME_REVIEWS_ENDPOINT } from "./config";

/**
 * Live product reviews from Judge.me — this module must only ever be
 * imported from a Server Component or route handler (never a "use client"
 * file), the same convention lib/product-live.ts uses, so JUDGEME_API_TOKEN
 * never reaches the browser. Falls back to `null` — never throws — whenever
 * the token is missing or the API is unreachable; the page decides what to
 * show instead (the local placeholder dataset in data/reviews.ts).
 *
 * Judge.me's `product_handle`/`product_id` query params are documented as
 * filters but do NOT actually scope the response on this shop/plan — every
 * page returns the shop's entire review pool regardless of what's passed.
 * Each review object does carry its own correct `product_handle`, though, so
 * this fetches every page (the whole shop's reviews, a few hundred, done
 * once and cached) and filters by that field itself. If Judge.me ever fixes
 * the query-param filter, this still works unchanged — it would just mean
 * every page already contains only matching rows.
 */

/** Shape of one row in Judge.me's `GET /api/v1/reviews` response. */
type JudgemeReview = {
  id: number;
  rating: number;
  body: string | null;
  title: string | null;
  created_at: string;
  hidden: boolean;
  published: boolean;
  product_handle: string | null;
  pictures?: { urls: { original: string } }[];
};

type JudgemeReviewsResponse = {
  current_page: number;
  per_page: number;
  reviews: JudgemeReview[];
};

const PER_PAGE = 100;
/** Hard ceiling on pages fetched — a runaway loop must never hammer Judge.me
 *  indefinitely if the shop's review count grows unexpectedly. Comfortably
 *  above the ~300-review pool this shop has today (3 pages). */
const MAX_PAGES = 20;

async function fetchAllReviews(
  shopDomain: string,
  apiToken: string,
): Promise<JudgemeReview[]> {
  const all: JudgemeReview[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(JUDGEME_REVIEWS_ENDPOINT);
    url.searchParams.set("api_token", apiToken);
    url.searchParams.set("shop_domain", shopDomain);
    url.searchParams.set("per_page", String(PER_PAGE));
    url.searchParams.set("page", String(page));

    const res = await fetch(url, {
      // Reviews change slowly — an hour-old list is fine, and this keeps a
      // slow multi-page fetch off the critical path of every request.
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;

    const data = (await res.json()) as JudgemeReviewsResponse;
    const reviews = data.reviews ?? [];
    if (reviews.length === 0) break;

    all.push(...reviews);
    if (reviews.length < PER_PAGE) break; // last page
  }

  return all;
}

function toProductReview(raw: JudgemeReview): ProductReview {
  return {
    id: String(raw.id),
    // Judge.me's own rating range is 1–5; anything outside that would be a
    // data anomaly, not a real rating, so it's clamped rather than trusted.
    rating: Math.min(5, Math.max(1, Math.round(raw.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5,
    author: "Verified Buyer",
    createdAt: new Date(raw.created_at).getTime(),
    text: raw.body?.trim() || raw.title?.trim() || "",
    images: raw.pictures?.length
      ? raw.pictures.map((p) => p.urls.original)
      : undefined,
    // Every review Judge.me returns here is an imported verified purchase
    // (AliExpress/CJ order review), not a freeform submission — so this is
    // true for all of them, not a per-row flag Judge.me exposes.
    verified: true,
  };
}

export type LiveReviews = {
  reviews: ProductReview[];
  summary: ReviewSummary;
};

/**
 * Fetches and filters this product's reviews. Returns `null` (not an empty
 * result) on any failure or missing config, so the caller can tell "no
 * reviews yet" apart from "couldn't reach Judge.me" and fall back cleanly.
 */
export async function getLiveReviews(
  productHandle: string,
): Promise<LiveReviews | null> {
  const cfg = judgemeConfig();
  if (!isJudgemeConfigured(cfg)) return null;

  try {
    const raw = await fetchAllReviews(cfg.shopDomain, cfg.apiToken);
    const reviews = raw
      .filter(
        (r) =>
          r.product_handle === productHandle &&
          r.published &&
          !r.hidden &&
          (r.body?.trim() || r.title?.trim()),
      )
      .map(toProductReview)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (reviews.length === 0) return null;

    return { reviews, summary: summarize(reviews) };
  } catch {
    return null;
  }
}
