import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Brand logo — the source logo PNGs processed by `scripts/build-logo-svg.py`
 * (`public/logo.svg` on light backgrounds, `public/logo-white.svg` on dark).
 * Transparent and crisp at any size. Use `tone="light"` on dark backgrounds
 * (renders the white SVG). Size the render via `className` (e.g. `h-12`);
 * the image keeps its aspect ratio.
 */
export function Logo({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  return (
    <Link
      href="/"
      aria-label="Crawl & Cuddle — home"
      className="inline-flex shrink-0 items-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tone === "light" ? "/logo-white.svg" : "/logo.svg"}
        alt="Crawl & Cuddle"
        width={900}
        height={tone === "light" ? 433 : 425}
        className={cn("h-[clamp(2.5rem,6vw,3rem)] w-auto", className)}
      />
    </Link>
  );
}
