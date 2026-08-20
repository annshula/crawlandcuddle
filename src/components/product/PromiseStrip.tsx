import { Icon, type IconName } from "@/components/ui/Icon";
import { promises } from "@/content/site";
import { cn } from "@/lib/utils";

/** Same order as `promises` — the content file stays free of UI concerns. */
const icons: IconName[] = ["truck", "refresh"];

/**
 * Delivery speed and the 30-day return window, shown at the moment of doubt.
 * `compact` drops the detail line for tight columns (product cards, drawers);
 * the full form carries both lines and is what the buy box uses.
 */
export function PromiseStrip({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid gap-x-6 gap-y-3 sm:grid-cols-2",
        compact ? "gap-y-2.5" : "gap-y-4",
        className,
      )}
    >
      {promises.map((promise, i) => (
        <li key={promise.label} className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
            <Icon name={icons[i] ?? "check"} className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block font-headline text-body-sm text-ink">
              {promise.label}
            </span>
            {!compact && (
              <span className="mt-0.5 block text-body-sm text-ink-soft">
                {promise.detail}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
