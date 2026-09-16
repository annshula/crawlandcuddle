"use client";

import Image from "next/image";
import { useRef } from "react";

import { defaultVariant, type Variant } from "@/content/site";
import { SaveBadge } from "@/components/product/SaveBadge";
import { cn } from "@/lib/utils";

/** Minimum horizontal drag (px) before a touch gesture counts as a swipe rather than a tap or a vertical scroll. */
const SWIPE_THRESHOLD = 50;

/**
 * Main product image + a thumbnail rail of every style. Picking a thumbnail
 * both previews that style's photo and selects it as the active variant —
 * the same "swatch doubles as gallery nav" pattern AccuPenPro's ProductGallery
 * uses for its style axis, simplified for one photo per style (no multi-image
 * variants or video here). On touch devices, swiping left/right on the main
 * image moves between styles the same way (ported from AccuPenPro's own
 * main-slot swipe handling).
 */
export function ProductGallery({
  variants,
  selectedSlug,
  onSelect,
}: {
  variants: Variant[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  const selected =
    variants.find((v) => v.slug === selectedSlug) ?? defaultVariant();
  const selectedIndex = variants.findIndex((v) => v.slug === selected.slug);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || variants.length <= 1) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    const next =
      dx < 0
        ? (selectedIndex + 1) % variants.length
        : (selectedIndex - 1 + variants.length) % variants.length;
    const nextVariant = variants[next];
    if (nextVariant) onSelect(nextVariant.slug);
  };

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="flex flex-col-reverse gap-4 lg:flex-row">
        <ul
          className="no-scrollbar flex w-full min-w-0 gap-2.5 overflow-x-auto overscroll-contain p-1 lg:w-19 lg:max-h-115 lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:py-1.5"
          role="listbox"
          aria-label="Style thumbnails"
        >
          {variants.map((variant) => {
            const isActive = variant.slug === selected.slug;
            return (
              <li key={variant.slug} className="shrink-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-label={variant.name}
                  onClick={() => onSelect(variant.slug)}
                  className={cn(
                    "relative block size-14 overflow-hidden rounded-card border-2 transition-colors duration-300 sm:size-16",
                    isActive
                      ? "border-rose-600"
                      : "border-transparent hover:border-hairline",
                  )}
                >
                  <span
                    className={cn("absolute inset-0 block", variant.tone)}
                  >
                    <Image
                      src={variant.image}
                      alt=""
                      fill
                      sizes="4rem"
                      className="object-cover"
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={cn(
            "relative mx-auto aspect-square w-full max-w-115 touch-pan-y overflow-hidden rounded-panel shadow-drift",
            selected.tone,
          )}
        >
          <Image
            src={selected.image}
            alt={`${selected.name} baby head protector backpack shown from the back with wings and adjustable harness`}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 40vw, 92vw"
            className="object-cover"
          />
          <SaveBadge slug={selected.slug} />
        </div>
      </div>
    </div>
  );
}
