import { Icon, type IconName } from "@/components/ui/Icon";
import { promises } from "@/content/site";
import { cn } from "@/lib/utils";

/** Same order as `promises` — the content file stays free of UI concerns. */
const icons: IconName[] = ["shield", "truck", "refresh"];

/**
 * Secure payment, free delivery, 30-day returns — one continuous pill-shaped
 * bar, icon + label inline (not stacked) per segment, thin dividers between.
 * Reads as a single trust bar rather than three separate tiles, shown right
 * under the buy box's CTA at the moment of doubt.
 */
export function PromiseStrip({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex overflow-hidden rounded-pill border border-hairline bg-paper",
        className,
      )}
    >
      {promises.map((promise, i) => (
        <li
          key={promise.label}
          className="flex flex-1 items-center justify-center gap-2 border-hairline px-2 py-3.5 not-last:border-r"
        >
          <Icon
            name={icons[i] ?? "check"}
            className="size-4 shrink-0 text-rose-600"
          />
          <span className="font-headline text-[0.8rem] leading-tight text-ink sm:text-body-sm">
            {promise.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
