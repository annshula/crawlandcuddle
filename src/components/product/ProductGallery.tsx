"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { styleSlugForVariantId, type Variant } from "@/content/site";
import { SaveBadge } from "@/components/product/SaveBadge";
import { Icon } from "@/components/ui/Icon";
import { syncedMedia, syncedVideo, type SyncedVideo } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Minimum horizontal drag (px) before a touch gesture counts as a swipe rather than a tap or a vertical scroll. */
const SWIPE_THRESHOLD = 50;

/** One tile in the gallery: a Shopify media image, or the product video. */
type Slide =
  | {
      kind: "image";
      url: string;
      alt: string;
      /** The tile's background while the photo loads — the style's tint when it belongs to one. */
      tone: string;
      /** The style this photo is the featured image of, when it is one. */
      slug?: string;
    }
  | ({ kind: "video" } & SyncedVideo);

/**
 * The product gallery: the main media slot plus a thumbnail rail of every item,
 * rendered in Shopify's own media order (20 images + 1 video for the live
 * product — the video keeps the position Shopify gives it, right after the
 * first photo). Picking a photo shows it and, when that photo belongs to a
 * style, selects that style too; picking a style from the swatch picker jumps
 * the gallery to that style's photo. On touch devices, swiping left/right walks
 * the same list. Falls back to one photo per style when the catalog has no
 * media list synced yet (see lib/catalog.ts's syncedMedia).
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
  const slides: Slide[] = useMemo(
    () =>
      syncedMedia.length > 0
        ? syncedMedia.map((item) => {
            if (item.type === "video") {
              return {
                kind: "video",
                poster: item.poster,
                sources: item.sources,
              };
            }
            const slug = styleSlugForVariantId(item.variantId);
            const style = slug
              ? variants.find((v) => v.slug === slug)
              : undefined;
            return {
              kind: "image",
              url: item.url,
              slug,
              tone: style?.tone ?? "bg-cream",
              alt: style
                ? `${style.name} baby head protector backpack shown from the back with wings and adjustable harness`
                : "Baby head protector backpack, anti-fall cushion pillow",
            };
          })
        : [
            ...variants.map<Slide>((variant) => ({
              kind: "image",
              url: variant.image,
              slug: variant.slug,
              tone: variant.tone,
              alt: `${variant.name} baby head protector backpack shown from the back with wings and adjustable harness`,
            })),
            ...(syncedVideo
              ? [{ kind: "video" as const, ...syncedVideo }]
              : []),
          ],
    [variants],
  );

  /* Open on the selected style's photo, not the first one in the list — a
     `?style=` deep link from the homepage has to land on that print's photo. */
  const [index, setIndex] = useState(() =>
    Math.max(
      slides.findIndex(
        (slide) => slide.kind === "image" && slide.slug === selectedSlug,
      ),
      0,
    ),
  );
  const active: Slide = slides[index] ?? slides[0]!;

  /* A style picked elsewhere (swatch tiles, a `?style=` deep link) jumps the
     gallery to that style's photo — the shopper sees the print they chose. */
  const lastSlug = useRef(selectedSlug);
  useEffect(() => {
    if (lastSlug.current === selectedSlug) return;
    lastSlug.current = selectedSlug;
    const target = slides.findIndex(
      (slide) => slide.kind === "image" && slide.slug === selectedSlug,
    );
    if (target >= 0) setIndex(target);
  }, [selectedSlug, slides]);

  const show = (i: number) => {
    setIndex(i);
    const slide = slides[i];
    if (slide?.kind === "image" && slide.slug && slide.slug !== selectedSlug) {
      onSelect(slide.slug);
    }
  };

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || slides.length <= 1) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    show(
      dx < 0
        ? (index + 1) % slides.length
        : (index - 1 + slides.length) % slides.length,
    );
  };

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="flex flex-col-reverse gap-4 lg:flex-row">
        <ul
          data-lenis-prevent
          className="no-scrollbar flex w-full min-w-0 gap-2.5 overflow-x-auto overscroll-contain p-1 lg:w-19 lg:max-h-115 lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:py-1.5"
          role="listbox"
          aria-label="Product photos and video"
        >
          {slides.map((slide, i) => {
            const isActive = i === index;
            const outOfStock =
              slide.kind === "image" && slide.slug
                ? !(
                    variants.find((v) => v.slug === slide.slug)
                      ?.availableForSale ?? true
                  )
                : false;
            const label =
              slide.kind === "video"
                ? "Play product video"
                : slide.slug
                  ? outOfStock
                    ? `${variants.find((v) => v.slug === slide.slug)?.name ?? "Style"} — out of stock`
                    : (variants.find((v) => v.slug === slide.slug)?.name ??
                      "Style photo")
                  : `Product photo ${i + 1}`;
            return (
              <li key={`${slide.kind}-${i}`} className="shrink-0">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-label={label}
                  title={outOfStock ? "Out of stock" : undefined}
                  onClick={() => show(i)}
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
                      slide.kind === "video"
                        ? "bg-ink"
                        : outOfStock
                          ? "bg-hairline"
                          : slide.tone,
                    )}
                  >
                    <Image
                      src={slide.kind === "video" ? slide.poster : slide.url}
                      alt=""
                      fill
                      sizes="4rem"
                      className={cn(
                        "object-cover",
                        slide.kind === "video" && "opacity-70",
                        outOfStock && "grayscale opacity-50",
                      )}
                    />
                  </span>
                  {slide.kind === "video" && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-6 place-items-center rounded-pill bg-paper/90 text-ink">
                        <Icon name="play" className="ml-0.5 size-3" />
                      </span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {active.kind === "video" ? (
          /* The video is a vertical canvas (1080×1920) with the real shot in a
             horizontal band across the middle (measured: rows 30.5%–69.3% of the
             height, centred), and blurred padding above and below it. The frame
             therefore decides what is seen.
             Phone: 4:3 landscape. A 16:9 frame only keeps the middle 32% of the
             source, which clipped the top of the baby's head; 4:3 keeps 42% and
             covers the whole shot, while still being wider than it is tall
             (325×244 on a 375px screen) so it stays compact.
             From sm up: the same square frame the photos use, so flipping
             between a photo and the video never moves the layout. */
          <div className="relative mx-auto aspect-4/3 w-full max-w-115 overflow-hidden rounded-panel bg-ink shadow-drift sm:aspect-square">
            <video
              key={active.poster}
              controls
              playsInline
              poster={active.poster}
              className="absolute inset-0 size-full object-cover"
            >
              {active.sources.map((s) => (
                <source key={s.src} src={s.src} type={s.type} />
              ))}
            </video>
          </div>
        ) : (
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className={cn(
              "relative mx-auto aspect-square w-full max-w-115 touch-pan-y overflow-hidden rounded-panel shadow-drift",
              active.tone,
            )}
          >
            {/* `key` forces a full remount on every slide change — without it
                a rapid swatch/thumbnail click could leave the previous photo
                on screen while the new `src` was still resolving, since
                Next/Image otherwise reuses the same underlying <img>. The
                video below already keys off `active.poster` for the same
                reason. */}
            <Image
              key={active.url}
              src={active.url}
              alt={active.alt}
              fill
              priority={index === 0}
              fetchPriority={index === 0 ? "high" : "auto"}
              sizes="(min-width: 1024px) 40vw, 92vw"
              className="object-cover"
            />
            {active.slug && <SaveBadge slug={active.slug} />}
          </div>
        )}
      </div>
    </div>
  );
}
