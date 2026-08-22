import {
  Bebas_Neue,
  Caveat,
  Inter,
  Jost,
  Oswald,
  Playfair_Display,
} from "next/font/google";

/**
 * Font stack mirrors the substitution table in design/DESIGN.md:
 *   hwt-artz            -> Bebas Neue    (condensed display, all-caps sections)
 *   Delivery Note DEMO  -> Oswald        (hero-scale headlines)
 *   Sandman_Fill        -> Playfair 900  (mega brand statements)
 *   Axiforma            -> Inter         (body + UI)
 *   ITC Avant Garde Bk  -> Jost          (wide-tracked labels + nav)
 *   script accent       -> Caveat        (emotional taglines only)
 */

/* Section headings only — all below the fold. See fontHeadline. */
export const fontDisplay = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--ff-display",
});

/* Not present anywhere in the first viewport, so it is fetched on use rather
   than preloaded — `swap` covers the short fallback window. */
export const fontHeadline = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
  variable: "--ff-headline",
});

/* 900 only, upright only: `font-mega` is always paired with `font-black` and
   the app has no italic display type. Every extra weight/style here is another
   woff2 that next/font preloads on every page, competing with the LCP image. */
export const fontMega = Playfair_Display({
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
  variable: "--ff-mega",
});

export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-sans",
});

export const fontLabel = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--ff-label",
});

export const fontScript = Caveat({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--ff-script",
});

export const fontVariables = [
  fontDisplay.variable,
  fontHeadline.variable,
  fontMega.variable,
  fontSans.variable,
  fontLabel.variable,
  fontScript.variable,
].join(" ");
