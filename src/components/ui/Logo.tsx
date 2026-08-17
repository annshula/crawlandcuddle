import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Wordmark + butterfly monogram. The ring echoes the protector's breathing
 * hole; the wings are the same two-lobe silhouette as the product.
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
      className={cn(
        "group inline-flex items-center gap-2.5",
        tone === "light" ? "text-paper" : "text-ink",
        className,
      )}
    >
      <span className="relative grid size-9 shrink-0 place-items-center">
        <svg viewBox="0 0 40 40" className="size-9" aria-hidden="true">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="text-rose-500 transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:rotate-12"
            style={{ transformOrigin: "center" }}
          />
          <g className="text-rose-500">
            <ellipse cx="14" cy="17" rx="6.2" ry="4.6" fill="currentColor" transform="rotate(-20 14 17)" />
            <ellipse cx="26" cy="17" rx="6.2" ry="4.6" fill="currentColor" transform="rotate(20 26 17)" />
          </g>
          <g className="text-lilac-400">
            <ellipse cx="15.5" cy="26" rx="4.6" ry="3.6" fill="currentColor" transform="rotate(14 15.5 26)" />
            <ellipse cx="24.5" cy="26" rx="4.6" ry="3.6" fill="currentColor" transform="rotate(-14 24.5 26)" />
          </g>
          <path
            d="M20 12.5v15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.4rem] tracking-[0.04em] uppercase">
          Crawl <span className="text-rose-500">&amp;</span> Cuddle
        </span>
        <span className="font-label text-[0.5rem] tracking-[0.34em] uppercase opacity-60">
          Soft landings
        </span>
      </span>
    </Link>
  );
}
