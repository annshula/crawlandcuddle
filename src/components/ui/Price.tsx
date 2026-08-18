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
  className?: string;
};

const sizeClasses: Record<NonNullable<PriceProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
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
  className,
}: PriceProps) {
  const percent = discountPercent(amount, compareAt);
  const showCompare = compareAt != null && compareAt > amount;

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
