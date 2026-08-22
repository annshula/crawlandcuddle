/**
 * Shared "fire once when this element reaches the fold" registry.
 *
 * Creating a ScrollTrigger per reveal used to cost a layout measurement each,
 * all of them during hydration — a large slice of Lighthouse's "minimize
 * main-thread work". An IntersectionObserver costs nothing until the element
 * approaches the fold, and the browser does the intersection maths off the
 * main thread.
 *
 * The observer alone is not enough, though: it only reports *threshold
 * crossings*. Jump from the top of the page to the bottom in a single frame
 * (anchor link, restored scroll position, a flick on a trackpad) and an element
 * goes from below the viewport to above it without ever being sampled as
 * intersecting — no callback, and the content stays hidden forever. So a
 * throttled sweep backs the observer up, and runs only while something is still
 * waiting.
 */

/** Fraction of the viewport height the element's top must reach to fire. */
export const REVEAL_AT = 0.85;
/** Well ahead of the fold, for setup that must exist before the element shows. */
export const SETUP_AT = 1.5;

type Waiting = { run: () => void; at: number };

const waiting = new Map<Element, Waiting>();
/** One observer per trigger point, keyed by it. */
const observers = new Map<number, IntersectionObserver>();
let sweepTimer: number | undefined;

function fire(el: Element) {
  const entry = waiting.get(el);
  if (!entry) return;
  waiting.delete(el);
  observers.get(entry.at)?.unobserve(el);
  if (!waiting.size) stopSweeping();
  entry.run();
}

function sweep() {
  sweepTimer = undefined;
  const height = window.innerHeight;
  for (const [el, entry] of Array.from(waiting)) {
    if (el.getBoundingClientRect().top <= height * entry.at) fire(el);
  }
}

/** Coalesces a burst of scroll events into one measurement pass. */
function onScroll() {
  if (sweepTimer !== undefined) return;
  sweepTimer = window.setTimeout(sweep, 150);
}

function startSweeping() {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

function stopSweeping() {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  if (sweepTimer !== undefined) window.clearTimeout(sweepTimer);
  sweepTimer = undefined;
}

function observerFor(at: number): IntersectionObserver {
  let observer = observers.get(at);
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) fire(entry.target);
      }
    },
    // `at` is measured from the top of the viewport, so 0.85 ("top 85%")
    // shrinks the root's bottom edge by 15% and 1.5 grows it by 50%.
    { rootMargin: `0px 0px ${(at - 1) * 100}% 0px` },
  );
  observers.set(at, observer);
  return observer;
}

/**
 * Calls `run` once, when the top of `el` reaches `at` × the viewport height.
 * Returns a cancel function. Runs immediately where IntersectionObserver is
 * missing, rather than leaving the element hidden.
 */
export function observeOnce(
  el: Element,
  run: () => void,
  at: number = REVEAL_AT,
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    run();
    return () => {};
  }

  const wasEmpty = waiting.size === 0;
  waiting.set(el, { run, at });
  observerFor(at).observe(el);
  if (wasEmpty) startSweeping();

  return () => {
    if (!waiting.delete(el)) return;
    observers.get(at)?.unobserve(el);
    if (!waiting.size) stopSweeping();
  };
}
