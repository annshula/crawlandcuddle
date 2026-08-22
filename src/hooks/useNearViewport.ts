"use client";

import { useEffect, useState, type RefObject } from "react";

import { SETUP_AT, observeOnce } from "@/lib/in-view";

/**
 * True once the top of the referenced element reaches `at` × the viewport
 * height — by default well before it is on screen.
 *
 * Used to hold expensive animation setup (ScrollTrigger instances, which each
 * force a layout read) out of the initial load, without changing what the
 * visitor sees: by the time a section nears the fold its triggers are built and
 * behave exactly as if they had been created on mount.
 */
export function useNearViewport<T extends Element>(
  ref: RefObject<T | null>,
  at: number = SETUP_AT,
): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    return observeOnce(el, () => setNear(true), at);
  }, [ref, near, at]);

  return near;
}
