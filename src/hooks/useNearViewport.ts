"use client";

import { useEffect, useState, type RefObject } from "react";

import { SETUP_MARGIN, observeOnce } from "@/lib/in-view";

/**
 * True once the referenced element comes within `rootMargin` of the viewport.
 *
 * Used to hold expensive animation setup (ScrollTrigger instances, which each
 * force a layout read) out of the initial load, without changing what the
 * visitor sees: by the time a section is 400px from the fold its triggers are
 * built and behave exactly as if they had been created on mount.
 */
export function useNearViewport<T extends Element>(
  ref: RefObject<T | null>,
  rootMargin: string = SETUP_MARGIN,
): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    return observeOnce(el, () => setNear(true), rootMargin);
  }, [ref, near, rootMargin]);

  return near;
}
