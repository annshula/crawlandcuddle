"use client";

import Image from "next/image";

import type { Variant } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Style picker: a row of tiny tile images, each labelled with its own name.
 * Clicking a tile switches the active style — the gallery and buy box above
 * re-render for the new variant, no page navigation. Modeled on AccuPenPro's
 * swatch picker (reference/components/product/BuyBox.tsx's VariantPicker).
 */
export function SwatchPicker({
  variants,
  selectedSlug,
  onSelect,
}: {
  variants: Variant[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="mt-8">
      <p className="eyebrow text-ink-faint">
        Style —{" "}
        <span className="text-ink">
          {variants.find((v) => v.slug === selectedSlug)?.name}
        </span>
      </p>
      <ul className="mt-3 flex flex-wrap gap-3" role="listbox" aria-label="Style">
        {variants.map((variant) => {
          const selected = variant.slug === selectedSlug;
          const outOfStock = !variant.availableForSale;
          return (
            <li key={variant.slug}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={
                  outOfStock ? `${variant.name} — out of stock` : variant.name
                }
                title={outOfStock ? "Out of stock" : undefined}
                onClick={() => onSelect(variant.slug)}
                className={cn(
                  "group relative block size-16 overflow-hidden rounded-card border-2 transition-colors duration-300",
                  selected
                    ? "border-rose-600"
                    : "border-transparent hover:border-hairline",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 block",
                    outOfStock ? "bg-hairline" : variant.tone,
                  )}
                >
                  <Image
                    src={variant.image}
                    alt=""
                    fill
                    sizes="4rem"
                    className={cn(
                      "object-cover",
                      outOfStock && "grayscale opacity-50",
                    )}
                  />
                </span>
                {outOfStock && (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-0.5 text-center text-[0.55rem] font-medium tracking-wide text-paper uppercase">
                    Sold out
                  </span>
                )}
                {selected && (
                  <span className="absolute inset-0 ring-2 ring-rose-600 ring-inset" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
