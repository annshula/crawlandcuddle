"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { defaultVariant, type Variant } from "@/content/site";
import { SaveBadge } from "@/components/product/SaveBadge";
import { Icon } from "@/components/ui/Icon";
import { syncedVideo } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Minimum horizontal drag (px) before a touch gesture counts as a swipe rather than a tap or a vertical scroll. */
const SWIPE_THRESHOLD = 50;

/**
 * Main product image + a thumbnail rail of every style, plus the product's
 * real Shopify video (if one is synced) as an extra slide. Picking a style
 * thumbnail both previews that style's photo and selects it as the active
 * variant; picking the video thumbnail plays it inline in the main slot,
 * same as AccuPenPro's ProductGallery. On touch devices, swiping left/right
 * on the main image moves between styles.
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
  const [showVideo, setShowVideo] = useState(false);
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
    if (!start || variants.length <= 1 || showVideo) return;
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
          data-lenis-prevent
          className="no-scrollbar flex w-full min-w-0 gap-2.5 overflow-x-auto overscroll-contain p-1 lg:w-19 lg:max-h-115 lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:py-1.5"
          role="listbox"
          aria-label="Style thumbnails"
        >
          {variants.map((variant) => {
            const isActive = !showVideo && variant.slug === selected.slug;
            const outOfStock = !variant.availableForSale;
            return (
              <li key={variant.slug} className="shrink-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-label={
                    outOfStock
                      ? `${variant.name} — out of stock`
                      : variant.name
                  }
                  title={outOfStock ? "Out of stock" : undefined}
                  onClick={() => {
                    setShowVideo(false);
                    onSelect(variant.slug);
                  }}
                  className={cn(
                    "relative block size-14 overflow-hidden rounded-card border-2 transition-colors duration-300 sm:size-16",
                    isActive
                      ? "border-rose-600"
                      : "border-transparent hover:border-hairline",
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-0 block",
                      outOfStock ? "bg-hairline" : variant.tone,
                    )}
                  >
                    <Image
                      src={variant.image}
                      alt=""
                      fill
                      sizes="4rem"
                      className={cn(
                        "object-cover",
                        outOfStock && "grayscale opacity-50",
                      )}
                    />
                  </span>
                </button>
              </li>
            );
          })}

          {syncedVideo && (
            <li className="shrink-0">
              <button
                type="button"
                role="option"
                aria-selected={showVideo}
                aria-label="Play product video"
                onClick={() => setShowVideo(true)}
                className={cn(
                  "relative block size-14 overflow-hidden rounded-card border-2 bg-ink transition-colors duration-300 sm:size-16",
                  showVideo
                    ? "border-rose-600"
                    : "border-transparent hover:border-hairline",
                )}
              >
                <Image
                  src={syncedVideo.poster}
                  alt=""
                  fill
                  sizes="4rem"
                  className="object-cover opacity-70"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-6 place-items-center rounded-pill bg-paper/90 text-ink">
                    <Icon name="play" className="ml-0.5 size-3" />
                  </span>
                </span>
              </button>
            </li>
          )}
        </ul>

        {showVideo && syncedVideo ? (
          <div className="relative mx-auto flex aspect-square w-full max-w-115 items-center justify-center">
            <div className="w-full overflow-hidden rounded-panel shadow-drift">
              <video
                key={syncedVideo.poster}
                controls
                playsInline
                poster={syncedVideo.poster}
                className="block w-full"
              >
                {syncedVideo.sources.map((s) => (
                  <source key={s.src} src={s.src} type={s.type} />
                ))}
              </video>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
