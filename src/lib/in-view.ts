/**
 * One IntersectionObserver per root margin, shared by every element that waits
 * for the viewport before animating.
 *
 * Creating a ScrollTrigger per reveal used to cost a layout measurement each,
 * all of them during hydration — a large slice of Lighthouse's "minimize
 * main-thread work". An observer costs nothing until the element approaches the
 * fold, and the browser does the intersection maths off the main thread.
 */
const observers = new Map<string, IntersectionObserver>();
const callbacks = new WeakMap<Element, () => void>();

/** Mirrors ScrollTrigger's `start: "top 85%"` — fires as the top crosses 85vh. */
export const REVEAL_MARGIN = "0px 0px -15% 0px";
/** Generous pre-roll for setup that must exist before the element is on screen. */
export const SETUP_MARGIN = "400px 0px";

function observerFor(rootMargin: string): IntersectionObserver {
  let observer = observers.get(rootMargin);
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries, self) => {
      for (const entry of entries) {
        // Elements scrolled past before we started observing (a hash deep-link,
        // a restored scroll position) never intersect — they are already above
        // the root, and must fire immediately rather than stay hidden forever.
        const passed =
          entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0);
        if (!entry.isIntersecting && !passed) continue;

        const run = callbacks.get(entry.target);
        callbacks.delete(entry.target);
        self.unobserve(entry.target);
        run?.();
      }
    },
    { rootMargin },
  );
  observers.set(rootMargin, observer);
  return observer;
}

/**
 * Calls `run` once, when `el` reaches `rootMargin`. Returns a cancel function.
 * Falls back to running immediately where IntersectionObserver is missing.
 */
export function observeOnce(
  el: Element,
  run: () => void,
  rootMargin: string = REVEAL_MARGIN,
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    run();
    return () => {};
  }

  const observer = observerFor(rootMargin);
  callbacks.set(el, run);
  observer.observe(el);

  return () => {
    callbacks.delete(el);
    observer.unobserve(el);
  };
}
