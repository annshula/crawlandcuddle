import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect warns during SSR. GSAP setup must run before paint on the
 * client, so alias to useEffect on the server where it is a no-op anyway.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
