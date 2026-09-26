"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/** Under this many px of remaining scroll counts as "at the edge" — native
 *  scroll math can land a fraction of a pixel short of the true max. */
const EDGE_SLOP = 4;

/**
 * "See it in action" — a swipeable row of short product clips, right under
 * the buy box's CTA. Native horizontal scroll + CSS scroll-snap does the
 * swiping — no JS drag handling needed, and it stays a real scroller for
 * mouse-wheel/trackpad/keyboard too, not just touch.
 *
 * `controlsList="nodownload noplaybackrate"` drops the download and speed
 * options Chromium/Edge add to the native control bar — play/pause, the
 * scrubber, volume/mute and fullscreen stay. Firefox/Safari never added
 * those extra buttons in the first place, so this is a no-op there, not a
 * regression. There's no fully cross-browser way to remove individual
 * native controls beyond this attribute; a custom control bar would be the
 * next step if a browser ever needs more than this.
 *
 * The prev/next arrows are a hover affordance for mouse users — hidden until
 * the track itself is hovered (or a button inside it holds focus, for
 * keyboard use), since touch already has swipe and doesn't need them
 * cluttering the view. They just nudge the native scroller by one tile;
 * scroll-snap does the rest.
 */
const videos = [
  "/videos/product-1.mp4",
  "/videos/product-2.mp4",
  "/videos/product-3.mp4",
];

export function ProductVideos() {
  const trackRef = useRef<HTMLUListElement>(null);
  // Whether there's anywhere left to scroll in each direction — an arrow
  // with nothing to reveal just hides instead of sitting there doing nothing.
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = track;
      setCanScroll({
        prev: scrollLeft > EDGE_SLOP,
        next: scrollLeft < scrollWidth - clientWidth - EDGE_SLOP,
      });
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    // The track's own scrollWidth only settles once the videos' natural
    // sizing resolves — a resize observer catches that as reliably as a
    // fixed-delay re-check would, without guessing a delay.
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(track);

    return () => {
      track.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, []);

  const scrollBy = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;
    const tile = track.firstElementChild as HTMLElement | null;
    const step = (tile?.offsetWidth ?? track.clientWidth * 0.6) + 16; // + gap-4
    track.scrollBy({
      left: direction === "next" ? step : -step,
      behavior: "smooth",
    });
  };

  return (
    <div className="mt-10">
      <p className="eyebrow text-ink-faint">See it in action</p>

      <div className="group/videos relative mt-4">
        <ul
          ref={trackRef}
          data-lenis-prevent
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2"
        >
          {videos.map((src) => (
            <li key={src} className="w-[68%] shrink-0 snap-start sm:w-[45%]">
              <div className="aspect-9/16 overflow-hidden rounded-panel">
                <video
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  playsInline
                  preload="metadata"
                  className="size-full object-cover"
                >
                  <source src={src} type="video/mp4" />
                </video>
              </div>
            </li>
          ))}
        </ul>

        {(["prev", "next"] as const)
          .filter((direction) => canScroll[direction])
          .map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => scrollBy(direction)}
              aria-label={
                direction === "prev" ? "Previous video" : "Next video"
              }
              className={cn(
                "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-ink opacity-0 shadow-drift backdrop-blur-sm transition-opacity duration-200 group-hover/videos:opacity-100 group-focus-within/videos:opacity-100 hover:bg-paper",
                direction === "prev" ? "left-1" : "right-1",
              )}
            >
              <Icon
                name="arrow-right"
                className={cn("size-4", direction === "prev" && "rotate-180")}
              />
            </button>
          ))}
      </div>
    </div>
  );
}
