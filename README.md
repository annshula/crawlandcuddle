# Crawl & Cuddle

Editorial storefront for a baby head & back protector. Structure and motion are
modelled on [palais.bio](https://www.palais.bio/); the palette is re-derived from
the product photography (blush canvas, signature rose, wing lavender).

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, RSC, Turbopack dev) |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS v4 (`@theme` tokens, zero config file) |
| Motion | GSAP + ScrollTrigger, Lenis inertial scroll |
| Type | `next/font/google` — Bebas Neue, Oswald, Playfair Display, Inter, Jost, Caveat |
| SEO | Metadata API, JSON-LD graph, generated OG image, sitemap, robots |

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Layout

```
src/
  app/            layout, page, sitemap, robots, icon, opengraph-image
  components/
    art/          Blob, WaveDivider, LineArt, ProductIllustration  (all SVG)
    layout/       AnnouncementBar, Header, Footer
    motion/       Reveal, SplitLines, Parallax, Magnetic, Marquee, CountUp, ScrollProgress
    providers/    SmoothScrollProvider (Lenis <-> GSAP ticker)
    sections/     Hero, TrustStrip, WhyItWorks, Milestones, HowItWorks,
                  ProductShowcase, Reviews, Faq, NewsletterCta
    seo/          JsonLd
    ui/           Button, Icon, Logo, SectionHeading
  content/site.ts all copy + product data (single source of truth)
  hooks/          useIsomorphicLayoutEffect, useGsapContext
  lib/            fonts, gsap setup, cn/format helpers
```

## Design system

Tokens live in one place: the `@theme` block at the top of
`src/app/globals.css`. Colours, the fluid type scale, radii, shadows, easings and
keyframe animations are all declared there and consumed as Tailwind utilities
(`bg-rose-500`, `text-heading`, `rounded-btn`, `shadow-drift`, `animate-float`).

Two rules from the source system are load-bearing:

1. **Colour lanes.** Rose owns actions, links and the accent word. Everything
   soft (petal, blush, lilac tints) appears only in organic blob shapes and
   line-art — never as a button fill or body text.
2. **Two-voice headlines.** Condensed display type (Bebas Neue) paired with a
   handwritten script line (Caveat). The script is decorative and always
   `aria-hidden`; the heading element carries the real text.

> `src/lib/utils.ts` extends `tailwind-merge` with the custom token names.
> Without that, `cn("text-heading", "text-ink")` silently drops the size because
> tailwind-merge reads `text-heading` as a colour. Add new `--text-*`,
> `--font-*`, `--radius-*` or `--shadow-*` tokens in **both** places.

## Motion

Lenis is driven from the GSAP ticker (one rAF loop, so scrubbed and pinned
sections never drift). Every animated component checks
`prefers-reduced-motion` and falls back to a static resting state; GSAP contexts
revert all inline styles on unmount.

Notable moments: masked line reveal on the hero, drawn brush underline, floating
product illustration with per-part tweens, pinned horizontal milestone rail
(native snap-scroll below `lg`), sticky fitting guide with a scrubbed progress
rail, and two counter-rotating review marquees.

## Configuration

Set the canonical origin before deploying — it feeds metadata, JSON-LD, the
sitemap and robots:

```bash
NEXT_PUBLIC_SITE_URL=https://www.crawlandcuddle.com
```

## Notes

- `design/` holds the private style reference and is git-ignored.
- The newsletter form is client-side only; wire it to a server action when the
  email provider is chosen (`src/components/sections/NewsletterCta.tsx`).
- All product imagery is vector (`ProductIllustration`), so there are no raster
  assets to optimise and nothing to swap when the palette changes.
