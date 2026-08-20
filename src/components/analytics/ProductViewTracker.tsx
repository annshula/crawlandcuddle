"use client";

import { useEffect, useRef } from "react";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { trackViewContent } from "@/lib/analytics";

/**
 * Fires Meta `ViewContent` / GA4 `view_item` once per product page view, using
 * the live localized price so the event value matches what the shopper sees.
 * Only fires after the localized price settles; a currency switch later does
 * not re-fire for the same slug.
 */
export function ProductViewTracker({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const { amount, currencyCode, pending } = useStylePrice(slug);
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (pending) return;
    if (firedFor.current === slug) return;
    firedFor.current = slug;
    trackViewContent(
      { slug, name },
      Math.round(Number(amount) * 100),
      currencyCode,
    );
  }, [slug, name, amount, currencyCode, pending]);

  return null;
}
