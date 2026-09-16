import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/** A row of `count` filled stars — for a fixed rating like a review card's own score. */
export function StarRow({
  stars,
  className,
}: {
  stars: number;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-0.5 text-rose-500", className)}>
      {Array.from({ length: stars }).map((_, i) => (
        <Icon key={i} name="star" className="size-3.5 fill-current" strokeWidth={1} />
      ))}
    </span>
  );
}

/** Five stars, filled proportionally to a fractional average (e.g. 4.9/5). */
export function RatingStars({
  value,
  className,
  starClassName,
}: {
  value: number;
  className?: string;
  starClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-0.5 text-rose-500", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative">
            <Icon
              name="star"
              className={cn("size-4 text-hairline", starClassName)}
              strokeWidth={1}
            />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Icon
                  name="star"
                  className={cn("size-4 fill-current", starClassName)}
                  strokeWidth={1}
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
