"use client";

import { useEffect, useRef } from "react";

import { Icon } from "@/components/ui/Icon";
import type { JourneyNode, JourneyState } from "@/lib/account/order-status";
import { shortDate } from "@/lib/money";
import { cn } from "@/lib/utils";

const labelColor: Record<JourneyState, string> = {
  done: "text-ink-soft",
  current: "text-lilac-700",
  failed: "text-rose-700",
  pending: "text-ink-faint",
};

/**
 * Milestones oldest to newest. Each completed leg draws itself in with a small
 * stagger, and a leg still in motion keeps flowing.
 *
 * Delivery plus a return runs to four milestones, which is more than a phone
 * can label side by side. Rather than dropping history to make it fit, the
 * rail scrolls sideways and starts at the newest end, where the answer to
 * "where is it now?" lives. On a wide screen the legs stretch to fill and
 * there is nothing to scroll.
 */
export function JourneyRail({ nodes }: { nodes: JourneyNode[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  /* Open on the latest milestone. Not smooth: this is the starting position,
     not a movement the shopper made, and animating it reads as drift.

     Parking once on mount is not enough — the web fonts land after hydration
     and re-measure every label, which leaves a single early `scrollLeft` short
     of the end. So it re-parks on the next frame, once fonts are ready, and on
     any resize — until the shopper touches it, after which their position is
     theirs to keep. */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let held = false;
    const park = () => {
      if (!held) el.scrollLeft = el.scrollWidth;
    };
    const hold = () => {
      held = true;
    };

    park();
    const frame = requestAnimationFrame(park);
    document.fonts?.ready.then(park).catch(() => {});

    const observer = new ResizeObserver(park);
    observer.observe(el);

    el.addEventListener("pointerdown", hold, { passive: true });
    el.addEventListener("wheel", hold, { passive: true });
    el.addEventListener("keydown", hold);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener("pointerdown", hold);
      el.removeEventListener("wheel", hold);
      el.removeEventListener("keydown", hold);
    };
  }, [nodes.length]);

  return (
    <div
      ref={scrollerRef}
      /* `overflow-x: auto` forces the other axis from `visible` to `auto`, so
         this box clips vertically whether or not it is asked to — which sliced
         the top off the dots' rings and the pulsing halo. py-2 is exactly the
         8px the halo reaches at scale(2) on a 16px dot; the negative margins
         give that padding back so the card's spacing is unchanged. */
      className="-mx-1 -mb-2 mt-1.5 overflow-x-auto overscroll-x-contain px-1 py-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
      data-lenis-prevent
    >
      <ol className="flex min-w-full items-start">
        {nodes.map((node, i) => (
          <li
            key={node.id}
            className="relative flex min-w-20 flex-1 flex-col items-center gap-1 text-center"
          >
            {/* The leg spans centre-to-centre of the two columns and runs under
                the dot, so the line meets each milestone instead of stopping
                short of it. Sizing it off the columns rather than giving it a
                column of its own is also what divides the milestones evenly at
                any width. */}
            {i > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1.75 right-1/2 -left-1/2 h-0.5 overflow-hidden rounded-pill bg-hairline"
              >
                <Segment state={node.state} index={i - 1} />
              </span>
            )}

            <span className="relative z-10">
              <Dot state={node.state} />
            </span>

            <span
              className={cn(
                "text-[0.62rem] leading-[1.15]",
                labelColor[node.state],
              )}
            >
              {node.label}
            </span>
            {node.at && (
              <span className="text-[0.58rem] leading-none text-ink-faint">
                {shortDate(node.at)}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The leg between two milestones: filled once reached, flowing while live. */
function Segment({ state, index }: { state: JourneyState; index: number }) {
  const delay = { animationDelay: `${0.1 * index}s` };

  if (state === "done") {
    return <span className="rail-done block h-full bg-mint" style={delay} />;
  }
  if (state === "failed") {
    return (
      <span className="rail-done block h-full bg-rose-400" style={delay} />
    );
  }
  if (state === "current") {
    return <span className="rail-live block h-full w-3/5" style={delay} />;
  }
  return null;
}

function Dot({ state }: { state: JourneyState }) {
  if (state === "current") {
    return (
      <span className="relative grid size-4 place-items-center rounded-full bg-lilac-400 ring-[3px] ring-lilac-100">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-lilac-400 opacity-40 motion-reduce:hidden"
        />
        <span className="relative size-1.5 rounded-full bg-paper" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="grid size-4 place-items-center rounded-full bg-rose-500 text-paper ring-[3px] ring-rose-100">
        <Icon name="close" className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className="grid size-4 place-items-center rounded-full border border-dashed border-ink-faint/50 bg-paper">
        <span className="size-1 rounded-full bg-hairline" />
      </span>
    );
  }
  return (
    <span className="grid size-4 place-items-center rounded-full bg-mint text-ink ring-[3px] ring-mint/25">
      <Icon name="check" className="size-2.5" strokeWidth={3} />
    </span>
  );
}
