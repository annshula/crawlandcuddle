"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RatingStars, StarRow } from "@/components/ui/Stars";
import { useScrollLock } from "@/lib/scroll-lock";
import { cn } from "@/lib/utils";
import type { ProductReview, ReviewSummary } from "@/data/reviews";

/**
 * Full customer-reviews experience: an aggregate summary (clickable star
 * breakdown), quick filters (all / with photos / by star) and a paginated
 * review feed. Modeled on AccuPenPro's ProductReviews
 * (reference/components/product/ProductReviews.tsx). Reviews are demo
 * content (see src/data/reviews.ts's own doc comment) — never emitted as
 * schema.org Review/AggregateRating markup.
 */

const PAGE_SIZE = 6;

type Filter = "all" | "photo" | 5 | 4 | 3 | 2 | 1;

export function ProductReviews({
  reviews,
  summary,
}: {
  reviews: ProductReview[];
  summary: ReviewSummary;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const by: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let photos = 0;
    for (const r of reviews) {
      by[r.rating] = (by[r.rating] ?? 0) + 1;
      if (r.images?.length) photos++;
    }
    return { by, photos };
  }, [reviews]);

  const filtered = useMemo(() => {
    if (filter === "all") return reviews;
    if (filter === "photo") return reviews.filter((r) => r.images?.length);
    return reviews.filter((r) => r.rating === filter);
  }, [reviews, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const chooseFilter = (f: Filter) => {
    setFilter(f);
    setPage(1);
  };

  const goTo = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chips: { id: Filter; label: string; icon?: "camera"; count: number }[] =
    [
      { id: "all", label: "All reviews", count: reviews.length },
      { id: "photo", label: "", icon: "camera", count: counts.photos },
      ...([5, 4, 3, 2, 1] as const).map((stars) => ({
        id: stars as Filter,
        label: `${stars} star${stars === 1 ? "" : "s"}`,
        count: counts.by[stars] ?? 0,
      })),
    ];

  return (
    <section
      id="reviews"
      aria-label={`${summary.count.toLocaleString("en-US")} customer reviews`}
      className="scroll-mt-20 bg-paper py-16 md:py-24"
    >
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow="Parent reviews"
          eyebrowDash={false}
          title={["Bought once.", "Worn every day since."]}
          body="Every review below is from a parent who's actually used it. Reviews with a photo show it as it really arrived."
          className="mx-auto"
        />

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-12">
          {/* ------------------------- summary / left ------------------------ */}
          <aside
            aria-label="Rating summary"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <div className="rounded-panel border border-hairline bg-cream p-7 shadow-drift">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl text-ink tabular-nums">
                  {summary.average.toFixed(1)}
                </span>
                <span className="text-body-sm text-ink-faint">
                  / 5 · {summary.count.toLocaleString("en-US")} reviews
                </span>
              </div>

              <RatingStars value={summary.average} className="mt-3" starClassName="size-4" />

              <p className="mt-3 text-body-sm leading-relaxed text-ink-faint">
                <span className="font-headline text-ink">
                  {summary.recommended}% of parents
                </span>{" "}
                would recommend this.
              </p>

              <ul className="mt-7 flex flex-col gap-1">
                {summary.distribution.map((d) => (
                  <li key={d.stars}>
                    <button
                      type="button"
                      onClick={() => chooseFilter(d.stars as Filter)}
                      aria-pressed={filter === d.stars}
                      aria-label={`Filter to ${d.stars} star reviews, ${d.count}`}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-btn px-2 py-1.5 transition-colors duration-200",
                        filter === d.stars ? "bg-rose-50" : "hover:bg-paper",
                      )}
                    >
                      <StarRow stars={d.stars} className="w-14 shrink-0" />
                      <span className="relative h-1.5 flex-1 overflow-hidden rounded-pill bg-hairline">
                        <span
                          className={cn(
                            "block h-full rounded-pill transition-all duration-300",
                            d.count > 0
                              ? "bg-linear-to-r from-rose-400 to-lilac-400"
                              : "bg-transparent",
                          )}
                          style={{ width: `${d.percent}%` }}
                        />
                      </span>
                      <span className="w-14 text-right text-[0.7rem] text-ink-faint tabular-nums">
                        {d.count.toLocaleString("en-US")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => chooseFilter("photo")}
                aria-pressed={filter === "photo"}
                className={cn(
                  "mt-5 flex w-full items-center gap-2.5 rounded-btn border px-3 py-2.5 text-left text-body-sm transition-colors duration-200",
                  filter === "photo"
                    ? "border-rose-300 bg-rose-50 text-ink"
                    : "border-hairline bg-cream text-ink-soft hover:border-ink/20",
                )}
              >
                <Icon name="camera" className="size-4 text-rose-500" />
                <span className="font-medium">
                  With photos ({summary.withPhotos})
                </span>
              </button>
            </div>
          </aside>

          {/* --------------------------- list / right ------------------------- */}
          <div ref={listRef} className="scroll-mt-28">
            <div
              role="group"
              aria-label="Filter reviews"
              className="flex flex-wrap items-center gap-2"
            >
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => chooseFilter(chip.id)}
                  aria-pressed={filter === chip.id}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border px-4 text-body-sm font-medium transition-all duration-200",
                    filter === chip.id
                      ? "border-ink bg-ink text-paper"
                      : "border-hairline bg-cream text-ink-soft hover:border-ink/30 hover:text-ink",
                  )}
                >
                  {chip.icon === "camera" ? (
                    <>
                      <Icon name="camera" className="size-4" aria-hidden="true" />
                      <span className="sr-only">Reviews with photos</span>
                      <span className="tabular-nums">{chip.count}</span>
                    </>
                  ) : (
                    <>
                      {chip.label}
                      <span
                        className={cn(
                          "tabular-nums",
                          filter === chip.id ? "text-paper/60" : "text-ink-faint",
                        )}
                      >
                        {chip.count}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>

            <p
              aria-live="polite"
              className="mt-6 text-[0.78rem] tracking-wide text-ink-faint tabular-nums"
            >
              {filtered.length === 0
                ? "No reviews match this filter."
                : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                    safePage * PAGE_SIZE,
                    filtered.length,
                  )} of ${filtered.length.toLocaleString("en-US")} review${
                    filtered.length === 1 ? "" : "s"
                  }`}
            </p>

            {pageItems.length === 0 ? (
              <EmptyFilterState onReset={() => chooseFilter("all")} />
            ) : (
              <ul className="mt-4 flex flex-col gap-5">
                {pageItems.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </ul>
            )}

            {filtered.length > PAGE_SIZE && (
              <Pagination
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                onGo={goTo}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ review card ------------------------------ */

function ReviewCard({ review }: { review: ProductReview }) {
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);
  const date = formatDate(review.createdAt);

  return (
    <li>
      <article className="rounded-panel border border-hairline bg-cream p-5 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <StarRow stars={review.rating} />
          <time
            dateTime={new Date(review.createdAt).toISOString().slice(0, 10)}
            className="text-[0.72rem] text-ink-faint tabular-nums"
          >
            {date}
          </time>
        </header>

        <blockquote
          cite={`#review-${review.id}`}
          className="mt-3 text-body-sm leading-[1.7] text-ink-soft"
        >
          {review.text}
        </blockquote>

        {review.images?.length ? (
          <div className="mt-4 flex gap-2.5">
            {review.images.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setOpenPhoto(src)}
                aria-label="Open customer photo"
                className="group relative block size-24 overflow-hidden rounded-card border border-hairline bg-paper"
              >
                <Image
                  src={src}
                  alt="Customer photo of the baby head protector backpack"
                  fill
                  sizes="96px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10">
                  <Icon
                    name="zoom"
                    className="size-5 text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <figcaption
          id={`review-${review.id}`}
          className="mt-5 flex items-center gap-3 border-t border-hairline pt-4"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-ink font-headline text-[0.9rem] text-paper">
            {review.author.charAt(0)}
          </span>
          <span className="min-w-0 flex-1">
            <cite className="block truncate text-body-sm font-headline text-ink not-italic">
              {maskName(review.author)}
            </cite>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] text-ink-faint">
              {review.country}
              {review.verified && (
                <span className="inline-flex items-center gap-1 font-medium text-ink-soft">
                  {review.country && (
                    <Icon
                      name="check"
                      className="size-3 text-rose-500"
                      strokeWidth={2.4}
                    />
                  )}
                  {review.country ? "Verified purchase" : "Verified Buyer"}
                </span>
              )}
            </span>
          </span>
        </figcaption>
      </article>

      <ReviewImageLightbox
        src={openPhoto}
        onClose={() => setOpenPhoto(null)}
        caption={
          review.country
            ? `${maskName(review.author)} · ${review.country}`
            : maskName(review.author)
        }
      />
    </li>
  );
}

/* -------------------------------- lightbox ------------------------------- */

function ReviewImageLightbox({
  src,
  onClose,
  caption,
}: {
  src: string | null;
  onClose: () => void;
  caption: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const open = src !== null;
  useScrollLock(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setZoomed(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !src) return null;

  return createPortal(
    <div className="fixed inset-0 z-100">
      <div
        onClick={onClose}
        style={{ backgroundColor: "rgba(4,4,4,0.95)" }}
        className="absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Customer review photo"
        className="absolute inset-0 flex flex-col"
      >
        <div className="flex items-center justify-end px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="grid size-10 place-items-center rounded-pill border border-white/20 text-paper transition-colors duration-300 hover:border-white/50"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
          className="relative mx-auto h-[72vh] w-full max-w-4xl flex-1 px-4 pb-2"
        >
          <Image
            src={src}
            alt="Customer photo of the baby head protector backpack"
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            className={cn(
              "object-contain transition-transform duration-300",
              zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in",
            )}
          />
        </button>

        <div className="flex items-center justify-center px-5 py-5 text-[0.78rem] text-paper/70">
          {caption}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------ pagination ------------------------------- */

function Pagination({
  page,
  totalPages,
  total,
  onGo,
}: {
  page: number;
  totalPages: number;
  total: number;
  onGo: (p: number) => void;
}) {
  const pages = pageWindow(page, totalPages);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <nav
      aria-label="Reviews pagination"
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-6 sm:flex-row"
    >
      <p className="text-[0.78rem] text-ink-faint tabular-nums">
        Showing {from}–{to} of {total.toLocaleString("en-US")} reviews
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onGo(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="grid size-10 place-items-center rounded-pill border border-hairline bg-cream text-ink transition-colors duration-200 hover:border-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="chevron-right" className="size-4 rotate-180" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              aria-hidden="true"
              className="grid size-10 place-items-center text-[0.8rem] text-ink-faint"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onGo(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              className={cn(
                "grid size-10 place-items-center rounded-pill border text-[0.82rem] font-medium tabular-nums transition-colors duration-200",
                p === page
                  ? "border-ink bg-ink text-paper"
                  : "border-hairline bg-cream text-ink-soft hover:border-ink/40 hover:text-ink",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onGo(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className="grid size-10 place-items-center rounded-pill border border-hairline bg-cream text-ink transition-colors duration-200 hover:border-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="chevron-right" className="size-4" />
        </button>
      </div>
    </nav>
  );
}

/* -------------------------------- helpers -------------------------------- */

function EmptyFilterState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-4 rounded-panel border border-dashed border-hairline bg-cream px-6 py-14 text-center">
      <p className="text-[0.95rem] font-medium text-ink">
        No reviews match this filter yet.
      </p>
      <p className="mx-auto mt-2 max-w-sm text-body-sm text-ink-faint">
        Try another star rating, or go back to see every review.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-pill bg-ink px-5 py-2.5 text-body-sm font-semibold text-paper transition-opacity duration-200 hover:opacity-85"
      >
        Show all reviews
      </button>
    </div>
  );
}

/** Mask a name for display, keeping ~2 letters each side: "Emily Rhodes" → "Em***ly Rh***es". */
function maskWord(word: string): string {
  const clean = word.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (clean.length <= 1) return "***";
  const keep = clean.length <= 4 ? 1 : 2;
  return `${clean.slice(0, keep)}***${clean.slice(-keep)}`;
}

function maskName(full: string): string {
  // Judge.me's imported reviews carry no real customer name — "Verified
  // Buyer" is already the display label, not a name to mask.
  if (full === "Verified Buyer") return full;
  const parts = full.split(" ").filter(Boolean);
  if (parts.length === 0) return "***";
  return parts.map(maskWord).join(" ");
}

function formatDate(ts: number): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

/** Numeric window with ellipsis gaps — e.g. [1, "…", 12, 13, 14, "…", 171]. */
function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | "…")[] = [];
  const push = (n: number | "…") => {
    const last = out[out.length - 1];
    if (last === n) return;
    out.push(n);
  };
  push(1);
  if (page > 4) push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) {
    push(i);
  }
  if (page < total - 3) push("…");
  push(total);
  return out;
}
