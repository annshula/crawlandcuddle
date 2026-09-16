"use client";

import { useState, type MouseEvent as ReactMouseEvent } from "react";

import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import { BuyBox } from "@/components/product/BuyBox";
import { PdpPrice } from "@/components/product/PdpPrice";
import { ProductGallery } from "@/components/product/ProductGallery";
import { SwatchPicker } from "@/components/product/SwatchPicker";
import { ValueStack } from "@/components/product/ValueStack";
import { Icon } from "@/components/ui/Icon";
import { RatingStars } from "@/components/ui/Stars";
import {
  defaultVariant,
  product,
  quality,
  specs,
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
  const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
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
              sold in the last 3 months
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
        <p className="mt-2 font-script text-2xl text-lilac-500">
          {selected.name}
        </p>

        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-body-sm">
          <a
            href="#quality-test"
            onClick={(e) => scrollToId(e, "quality-test")}
            className="group inline-flex items-center gap-1.5 text-ink-soft underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
          >
            <Icon name="shield" className="size-3.5 shrink-0 text-mint" />
            {quality.checks.length} checks passed
          </a>
          <span aria-hidden="true" className="text-ink-faint">
            |
          </span>
          <ValueStack />
        </p>

        <div className="mt-6 flex flex-wrap items-baseline gap-4">
          <PdpPrice slug={selected.slug} />
          {selected.availableForSale ? (
            <span className="eyebrow rounded-tag bg-rose-50 px-3 py-2 text-rose-600">
              In stock
            </span>
          ) : (
            <span className="eyebrow rounded-tag bg-hairline/60 px-3 py-2 text-ink-faint">
              Out of stock
            </span>
          )}
        </div>

        <p className="mt-6 max-w-lg text-body text-ink-soft">
          {selected.tagline} Underneath the design it is the same protector
          every parent trusts: an impact-absorbing ring behind the head, a
          breathable 3D air-mesh shell and a harness that adjusts from the
          first crawl to confident walking.
        </p>

        <SwatchPicker
          variants={variants}
          selectedSlug={selected.slug}
          onSelect={setSelectedSlug}
        />

        <ProductViewTracker slug={selected.slug} name={selected.name} />
        <BuyBox variant={selected} />

        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          {specs.map((spec) => (
            <div key={spec.label} className={cn("border-t border-hairline pt-3")}>
              <dt className="eyebrow text-ink-faint">{spec.label}</dt>
              <dd className="mt-1.5 font-headline text-base text-ink">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
