"use client";

import Image from "next/image";
import { useState } from "react";

import { Blob } from "@/components/art/Blob";
import { CountUp } from "@/components/motion/CountUp";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { product, specs, variantHref, variants } from "@/content/site";
import { cn, formatPrice } from "@/lib/utils";

export function ProductShowcase() {
  const [active, setActive] = useState(0);
  const variant = variants[active]!;
  const saving = product.compareAtCents - product.priceCents;
  const savingPct = Math.round((saving / product.compareAtCents) * 100);

  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="relative overflow-hidden bg-paper section-y"
    >
      <Blob
        shape="e"
        spin={-40}
        className="pointer-events-none absolute -bottom-48 -left-44 w-[34rem] text-rose-50"
      />

      <div className="container-page relative z-10">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-20">
          {/* --- gallery ---
              min-w-0 is required: without it the overflowing thumbnail rail's
              min-content width (10 × 72px) forces the 1fr column wide open. */}
          <div className="min-w-0 lg:sticky lg:top-28">
            <div
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-panel transition-colors duration-700",
                variant.tone,
              )}
            >
              {/* Eager, not lazy: this element lives inside a position:sticky
                  column, where Chrome's native lazy-load can fail to re-evaluate
                  after scroll and leave the panel permanently blank. It is one
                  ~25 KB image and the anchor of the buy section. */}
              <Image
                key={variant.slug}
                src={variant.image}
                alt={`${variant.name} — ${product.shortName}, breathable anti-fall cushion for babies 5 to 24 months`}
                fill
                loading="eager"
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="animate-[fade-in_0.6s_var(--ease-out-soft)] object-cover"
              />

              <span className="eyebrow absolute top-4 left-4 rounded-tag bg-paper/90 px-3 py-2 text-rose-600 backdrop-blur-sm">
                Save {savingPct}%
              </span>
            </div>

            {/* thumbnail rail doubles as the style switcher */}
            <ul
              className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Choose a style"
            >
              {variants.map((item, i) => (
                <li key={item.slug} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    aria-label={item.name}
                    className={cn(
                      "relative block size-16 overflow-hidden rounded-card border-2 transition-colors duration-300 sm:size-[4.5rem]",
                      i === active
                        ? "border-rose-600"
                        : "border-transparent hover:border-rose-200",
                      item.tone,
                    )}
                  >
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="72px"
                      className="object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* --- buy panel --- */}
          <div className="min-w-0">
            <SectionHeading
              id="product-heading"
              eyebrow="The protector"
              title={["Baby head", "protector backpack"]}
              script="training wheels for falling over"
            />

            <Reveal variant="up" delay={0.08}>
              <div className="mt-7 flex items-center gap-4">
                <span className="flex items-center gap-1 text-rose-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      className="size-4 fill-current"
                      strokeWidth={1}
                    />
                  ))}
                </span>
                <p className="text-body-sm text-ink-soft">
                  <CountUp
                    value={product.rating.value}
                    decimals={1}
                    className="font-headline text-ink"
                  />{" "}
                  from{" "}
                  <CountUp
                    value={product.rating.count}
                    className="font-headline text-ink"
                  />{" "}
                  parents
                </p>
              </div>
            </Reveal>

            <Reveal variant="up" delay={0.12}>
              <div className="mt-7 flex flex-wrap items-baseline gap-4">
                <p className="font-mega text-5xl leading-none font-black text-ink">
                  {formatPrice(product.priceCents)}
                </p>
                <p className="text-body text-ink-faint line-through">
                  {formatPrice(product.compareAtCents)}
                </p>
                <span className="eyebrow rounded-tag bg-rose-50 px-3 py-2 text-rose-600">
                  Free gift inside
                </span>
              </div>
            </Reveal>

            <Reveal variant="up" delay={0.16}>
              <div className="mt-8">
                <p className="eyebrow text-ink-faint">
                  Style —{" "}
                  <span className="text-ink normal-case">{variant.name}</span>
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {variants.map((item, i) => (
                    <li key={item.slug}>
                      <button
                        type="button"
                        onClick={() => setActive(i)}
                        aria-pressed={i === active}
                        className={cn(
                          "rounded-btn border px-4 py-2.5 text-body-sm transition-colors duration-300",
                          i === active
                            ? "border-rose-600 bg-rose-600 text-paper"
                            : "border-hairline text-ink hover:border-rose-400",
                        )}
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal variant="up" delay={0.2}>
              <ul className="mt-8 flex flex-col gap-3">
                {product.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-body text-ink-soft"
                  >
                    <Icon
                      name="check"
                      className="mt-1 size-4 shrink-0 text-rose-600"
                      strokeWidth={2.2}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal variant="up" delay={0.24}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Magnetic>
                  <Button href={variantHref(variant.slug)} withArrow>
                    View {variant.name}
                  </Button>
                </Magnetic>
                <Button href="/products" variant="outline">
                  All ten styles
                </Button>
              </div>
              <p className="mt-4 text-body-sm text-ink-faint">
                Free tracked shipping · easy 30-day returns
              </p>
            </Reveal>

            <Reveal variant="up" delay={0.28}>
              <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="border-t border-hairline pt-3">
                    <dt className="eyebrow text-ink-faint">{spec.label}</dt>
                    <dd className="mt-1.5 font-headline text-base text-ink">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
