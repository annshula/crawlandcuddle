import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function discountPercent(
  price: number,
  compareAt: number | null | undefined,
): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

type PriceProps = {
  amount: number;
  compareAt?: number | null;
  currencyCode?: string;
  size?: "sm" | "md" | "lg";
  /** Hold a placeholder instead of showing an amount in the wrong currency. */
  pending?: boolean;
  className?: string;
};

const sizeClasses: Record<NonNullable<PriceProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

/* Roughly the width a formatted amount occupies at each size, so the swap in
   does not shift the layout around it. */
const skeletonClasses: Record<NonNullable<PriceProps["size"]>, string> = {
  sm: "h-4 w-20",
  md: "h-5 w-24",
  lg: "h-7 w-32",
};

/**
 * Price with struck-through compare-at and a −% badge. `amount`/`compareAt`
 * are the values to show (already localized by the caller when a currency is
 * picked), and `currencyCode` is the currency they're in — the caller must
 * never mix currencies.
 */
export function Price({
  amount,
  compareAt,
  currencyCode = "USD",
  size = "md",
  pending = false,
  className,
}: PriceProps) {
  const percent = discountPercent(amount, compareAt);
  const showCompare = compareAt != null && compareAt > amount;

  if (pending) {
    return (
      <span
        aria-label="Loading price"
        className={cn("inline-flex items-baseline gap-x-2.5", className)}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block animate-pulse rounded-pill bg-hairline",
            skeletonClasses[size],
          )}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1",
        className,
      )}
    >
      <span
        className={cn(
          "font-headline font-semibold text-ink",
          sizeClasses[size],
        )}
      >
        {formatMoney(amount, currencyCode)}
      </span>
      {showCompare && compareAt != null && (
        <span
          className={cn(
            "text-ink-faint line-through",
            size === "sm" ? "text-sm" : "text-base",
          )}
        >
          {formatMoney(compareAt, currencyCode)}
        </span>
      )}
      {percent != null && (
        <span className="rounded-tag bg-rose-600 px-2 py-0.5 font-label text-[0.62rem] tracking-widest text-paper uppercase">
          −{percent}%
        </span>
      )}
    </span>
  );
}
