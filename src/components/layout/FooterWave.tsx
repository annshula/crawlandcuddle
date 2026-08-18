"use client";

import { usePathname } from "next/navigation";

import { WaveDivider } from "@/components/art/WaveDivider";
import { cn } from "@/lib/utils";

/**
 * The wave's backing strip must match the section sitting directly above the
 * footer so the transition is seamless (the home page ends on the blush
 * newsletter band; the product pages end on white for the listing and cream
 * for the detail pages).
 */
export function FooterWave() {
  const pathname = usePathname();
  const bg =
    pathname === "/products"
      ? "bg-paper"
      : pathname?.startsWith("/products/")
        ? "bg-cream"
        : "bg-blush";

  return (
    <WaveDivider
      className={cn("-mb-px", bg, "text-lilac-700")}
      shape="swell"
      height={110}
    />
  );
}
