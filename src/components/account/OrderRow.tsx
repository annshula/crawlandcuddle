import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { formatMoney, shortDate } from "@/lib/money";
import type { OrderSummary } from "@/lib/shopify/types";

/**
 * One order in a list. Shared by the overview and the full history so both
 * read identically — a white panel on cream that lifts on hover, the same
 * gesture as a product card.
 */
export function OrderRow({ order }: { order: OrderSummary }) {
  const images = order.previewImages.filter(
    (img): img is { url: string; altText: string | null } => Boolean(img),
  );

  return (
    <Link
      href={`/account/orders/${encodeURIComponent(order.id)}`}
      className="group flex flex-wrap items-center justify-between gap-4 rounded-panel border border-hairline bg-paper px-5 py-4 shadow-soft transition-[border-color,box-shadow] duration-500 ease-out-soft hover:border-rose-300 hover:shadow-drift"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex -space-x-3">
          {images.slice(0, 3).map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt=""
              className="size-11 rounded-full border-2 border-paper bg-blush object-cover"
            />
          ))}
          {images.length === 0 && (
            <span className="grid size-11 place-items-center rounded-full bg-blush text-rose-500">
              <Icon name="bag" className="size-4" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-headline text-ink transition-colors duration-300 group-hover:text-rose-600">
            {order.name}
          </p>
          <p className="text-caption text-ink-faint">
            {shortDate(order.processedAt)} · {order.lineItemCount} item
            {order.lineItemCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-headline text-ink">
          {order.totalPrice
            ? formatMoney(
                order.totalPrice.amount,
                order.totalPrice.currencyCode,
              )
            : ""}
        </span>
        <Icon
          name="arrow-right"
          className="size-4 text-ink-faint transition-transform duration-500 ease-out-soft group-hover:translate-x-1 group-hover:text-rose-600"
        />
      </div>
    </Link>
  );
}
