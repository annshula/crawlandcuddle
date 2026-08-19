"use client";

import { useStylePrice } from "@/components/providers/LocalizationProvider";
import { Price } from "@/components/ui/Price";

type ProductPriceProps = {
  slug: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * The live price for one style, in the shopper's selected currency (from
 * Shopify) or the synced base price. Updates instantly when the currency
 * changes.
 */
export function ProductPrice({
  slug,
  size = "md",
  className,
}: ProductPriceProps) {
  const { amount, currencyCode, compareAtAmount, pending } =
    useStylePrice(slug);
  return (
    <Price
      amount={amount}
      compareAt={compareAtAmount}
      currencyCode={currencyCode}
      size={size}
      pending={pending}
      className={className}
    />
  );
}
