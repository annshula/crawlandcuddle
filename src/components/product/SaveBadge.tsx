"use client";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { discountPercent } from "@/components/ui/Price";

/**
 * "Save N%" chip for the PDP image, computed from the localized price and
 * compare-at (never mixes currencies). Hides when there's no markdown.
 */
export function SaveBadge({ slug }: { slug: string }) {
  const { amount, compareAtAmount } = useStylePrice(slug);
  const percent = discountPercent(amount, compareAtAmount);
  if (percent == null) return null;
  return (
    <span className="eyebrow absolute top-4 left-4 rounded-tag bg-paper/90 px-3 py-2 text-rose-600 backdrop-blur-sm">
      Save {percent}%
    </span>
  );
}
