"use client";

import { usePathname } from "next/navigation";

import { WaveDivider } from "@/components/art/WaveDivider";
import { cn } from "@/lib/utils";

/**
 * The wave's backing strip must match the section sitting directly above the
 * footer so the transition is seamless (the home page ends on the blush
 * newsletter band; the product listing ends on white; the product detail,
 * account and checkout pages all end on cream).
 */
export function FooterWave() {
  const pathname = usePathname();
  const isCream =
    pathname?.startsWith("/products/") ||
    pathname?.startsWith("/account") ||
    pathname === "/checkout";
  const bg =
    pathname === "/products" ? "bg-paper" : isCream ? "bg-cream" : "bg-blush";

  return (
    <WaveDivider
      className={cn("-mb-px", bg, "text-lilac-700")}
      shape="swell"
      height={110}
    />
  );
}
