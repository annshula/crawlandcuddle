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

export const fontDisplay = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--ff-display",
});

export const fontHeadline = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--ff-headline",
});

export const fontMega = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
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
  weight: ["400", "500", "600", "700"],
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
