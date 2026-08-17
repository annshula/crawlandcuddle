"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  gsap.defaults({ ease: "power3.out", duration: 1 });

  // ScrollTrigger recalculates on resize; ignore the mobile URL-bar jitter that
  // only changes viewport height by a few pixels.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
