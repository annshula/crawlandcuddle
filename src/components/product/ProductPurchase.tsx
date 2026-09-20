"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import { BuyBox } from "@/components/product/BuyBox";
import { PdpPrice, SaveChip } from "@/components/product/PdpPrice";
import { ProductGallery } from "@/components/product/ProductGallery";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { SwatchPicker } from "@/components/product/SwatchPicker";
import { ValueStack } from "@/components/product/ValueStack";
import { Icon } from "@/components/ui/Icon";
import { RatingStars } from "@/components/ui/Stars";
import {
  defaultPackSize,
  defaultVariant,
  product,
  quality,
  specs,
  type PackTier,
  type Variant,
} from "@/content/site";
import { cn } from "@/lib/utils";

/** Smooth-scroll a same-page anchor to an element id, clearing the sticky header. */
function scrollToId(e: ReactMouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  const nav = document.querySelector<HTMLElement>("header");
  const navHeight = nav?.getBoundingClientRect().height ?? 68;
  const top =
    target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

/**
 * Availability, at the two weights this page needs. A phone gets a dot and a
 * word, because a filled pill sitting under a 48px price is more furniture than
 * the line needs; from sm up it becomes the pill the rest of the buy panel uses.
 */
function StockMark({
  available,
  tone,
}: {
  available: boolean;
  tone: "quiet" | "pill";
}) {
  const label = available ? "In stock" : "Out of stock";

  if (tone === "quiet") {
    return (
      <span
        className={cn(
          // Same micro type as the markdown mark beside it, so the phone's meta
          // line reads as one pair of labels rather than two stray fragments.
          "inline-flex items-center gap-1.5 font-label text-[0.68rem] leading-none tracking-widest whitespace-nowrap uppercase",
          available ? "text-ink-soft" : "text-ink-faint",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            available ? "bg-mint" : "bg-hairline",
          )}
        />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "eyebrow rounded-tag px-3 py-2 whitespace-nowrap",
        available
          ? "bg-rose-50 text-rose-600"
          : "bg-hairline/60 text-ink-faint",
      )}
    >
      {label}
    </span>
  );
}

/**
 * Gallery, swatch picker and buy box for the one product, all under a single
 * `selectedSlug` state — picking a style swaps the gallery's main image and
 * the buy box's price/variant together, no page navigation. Modeled on
 * AccuPenPro's ProductPurchase (reference/components/product/ProductPurchase.tsx),
 * including its "sold in last 90 days" + rating pill row and the
 * "Hand-built · N checks passed" scroll links under the title.
 */
export function ProductPurchase({
  variants,
  initialSlug,
}: {
  variants: Variant[];
  /** Pre-selects a style from a `?style=` deep link (e.g. the homepage style gallery) — falls back to the usual default when absent or unrecognized. */
  initialSlug?: string;
}) {
  const [selectedSlug, setSelectedSlug] = useState(
    initialSlug ?? defaultVariant().slug,
  );
  const selected =
    variants.find((v) => v.slug === selectedSlug) ?? defaultVariant();

  // Shared with both the hero price up top and BuyBox's own total lower down
  // — one selection, so the two numbers on the page can never disagree.
  const [packSize, setPackSize] = useState<PackTier["size"]>(defaultPackSize);

  // BuyBox's real CTA row — StickyBuyBar watches when this scrolls out of
  // view and shows its own compact bar in its place.
  const ctaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
      {/* --- imagery --- */}
      <div className="min-w-0">
        <ProductGallery
          variants={variants}
          selectedSlug={selected.slug}
          onSelect={setSelectedSlug}
        />
      </div>

      {/* --- buy panel --- */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {product.soldLast90Days > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-cream py-1.5 pr-3 pl-2.5 text-body-sm text-ink-soft">
              <Icon name="bag" className="size-3.5 shrink-0 text-ink-faint" />
              <span className="font-headline text-ink tabular-nums">
                {product.soldLast90Days.toLocaleString("en-US")}+
              </span>
              sold in the last 6 months
            </span>
          )}
          <a
            href="#reviews"
            onClick={(e) => scrollToId(e, "reviews")}
            aria-label={`Rated ${product.rating.value.toFixed(1)} out of 5 by ${product.rating.count.toLocaleString("en-US")} parents. Read the reviews.`}
            className="group inline-flex items-center gap-2 rounded-pill border border-hairline bg-cream py-1.5 pr-3.5 pl-2.5 transition-colors duration-200 hover:border-ink/30"
          >
            <RatingStars value={product.rating.value} starClassName="size-3" />
            <span className="font-headline text-ink tabular-nums">
              {product.rating.value.toFixed(1)}
            </span>
            <span className="hidden text-body-sm text-ink-faint sm:inline">
              {product.rating.count.toLocaleString("en-US")} reviews
            </span>
            <Icon
              name="chevron-down"
              className="size-3.5 text-ink-faint transition-transform duration-200 group-hover:translate-y-0.5"
            />
          </a>
        </div>

        <h1 className="mt-5 font-display text-heading text-ink uppercase">
          {product.shortName}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="font-script text-2xl text-lilac-500">{selected.name}</p>

          {/* The same hairline pill as the "sold" and review marks two rows up,
              so the buy panel reads as one set: a mint check medallion, the
              count in headline type, and a link through to the full test list. */}
          <a
            href="#quality-test"
            onClick={(e) => scrollToId(e, "quality-test")}
            aria-label={`${quality.checks.length} quality checks passed — see what is tested`}
            className="group/checks ms-auto inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-cream py-1.5 pr-3 pl-2.5 text-body-sm text-ink-soft transition-colors duration-300 hover:border-ink/30"
          >
            <span className="grid size-4.5 shrink-0 place-items-center rounded-pill bg-mint/60 text-ink transition-colors duration-300 group-hover/checks:bg-mint">
              <Icon name="check" className="size-2.5" strokeWidth={2.8} />
            </span>
            <span className="font-headline text-ink tabular-nums">
              {quality.checks.length}
            </span>
            checks passed
          </a>
        </div>

        {/* Price block, one deliberate layout per breakpoint.
            Phone: the prices hold the first line, then a single quiet meta line
            — markdown, a hairline of dashes to carry the eye across, and
            availability at the right edge. Both marks go unfilled here: a 48px
            price with two filled chips under it reads as furniture, and the
            dashes turn what was a void between them into the line itself.
            From sm up: one row, the markdown right after the price and
            availability at the far right of the panel as the filled pill the
            rest of the buy panel uses. */}
        <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-3">
          <PdpPrice slug={selected.slug} packSize={packSize} />

          <div className="flex w-full items-center gap-3 sm:hidden">
            <SaveChip slug={selected.slug} tone="plain" />
            <span
              aria-hidden="true"
              className="h-px min-w-4 flex-1 border-t border-dashed border-hairline"
            />
            <StockMark available={selected.availableForSale} tone="quiet" />
          </div>

          <div className="hidden w-full items-end justify-between gap-4 sm:flex sm:w-auto sm:flex-1">
            <SaveChip slug={selected.slug} />
            <StockMark available={selected.availableForSale} tone="pill" />
          </div>
        </div>

        {/* Directly under the price it is being compared against — the value
            stack only means something next to the number it beats. */}
        <div className="text-body-sm">
          <ValueStack />
        </div>

        <SwatchPicker
          variants={variants}
          selectedSlug={selected.slug}
          onSelect={setSelectedSlug}
        />

        <ProductViewTracker slug={selected.slug} name={selected.name} />
        <BuyBox
          ref={ctaRef}
          variant={selected}
          packSize={packSize}
          onPackSizeChange={setPackSize}
        />

        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          {specs.map((spec) => (
            <div
              key={spec.label}
              className={cn("border-t border-hairline pt-3")}
            >
              <dt className="eyebrow text-ink-faint">{spec.label}</dt>
              <dd className="mt-1.5 font-headline text-base text-ink">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Moved below the specs — a paragraph of prose above the buy box
            pushed the pack picker and CTA further down the panel than
            necessary; the specs' hard facts earn the space right under the
            price/value stack more than a repeat of the tagline does. */}
        <p className="mt-8 max-w-lg text-body text-ink-soft">
          {selected.tagline} Underneath the design it is the same protector
          every parent trusts: an impact-absorbing ring behind the head, a
          breathable 3D air-mesh shell and a harness that adjusts from the first
          crawl to confident walking.
        </p>
      </div>

      <StickyBuyBar variant={selected} packSize={packSize} ctaRef={ctaRef} />
    </div>
  );
}
