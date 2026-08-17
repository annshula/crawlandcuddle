import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { product } from "@/content/site";

/**
 * tailwind-merge only knows Tailwind's stock scales. Our theme adds named
 * font sizes, radii, shadows and families, and without registering them here
 * `text-heading` is misread as a text COLOUR and silently dropped whenever it
 * sits next to `text-ink`. Keep this list in sync with @theme in globals.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "caption",
            "body-sm",
            "body",
            "body-lg",
            "subheading",
            "heading-sm",
            "heading",
            "heading-lg",
            "display",
          ],
        },
      ],
      "font-family": [
        { font: ["display", "headline", "mega", "sans", "label", "script"] },
      ],
      rounded: [{ rounded: ["card", "panel", "tag", "btn", "pill"] }],
      shadow: [{ shadow: ["soft", "drift", "lift"] }],
      ease: [{ ease: ["out-soft", "in-out-soft"] }],
      animate: [
        { animate: ["marquee", "float", "float-slow", "wobble", "drift"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Absolute URL helper — required for canonical + OG metadata. */
export function absoluteUrl(path = "/") {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.crawlandcuddle.com"
  ).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatPrice(
  cents: number,
  currency: string = product.currency,
  locale: string = product.locale,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
