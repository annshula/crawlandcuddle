import Link from "next/link";

import { JourneyRail } from "@/components/account/JourneyRail";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  fulfillmentStatus,
  itemJourney,
  returnForLineItem,
  returnReasonLabel,
  returnStatus,
  type ShipmentGroup,
  type StatusTone,
} from "@/lib/account/order-status";
import { formatMoney, shortDate } from "@/lib/money";
import type {
  Order,
  OrderLineItem,
  OrderReturnSummary,
} from "@/lib/shopify/types";
import { cn } from "@/lib/utils";

/** Card accents, keyed to the same tones the status badges already use. */
const accents: Record<
  StatusTone,
  { edge: string; chip: string; text: string }
> = {
  neutral: {
    edge: "from-hairline to-hairline",
    chip: "bg-ink/5 text-ink-soft",
    text: "text-ink-soft",
  },
  rose: {
    edge: "from-rose-400 to-rose-600",
    chip: "bg-rose-100 text-rose-600",
    text: "text-rose-700",
  },
  lilac: {
    edge: "from-lilac-300 to-lilac-500",
    chip: "bg-lilac-200 text-lilac-700",
    text: "text-lilac-700",
  },
  mint: {
    edge: "from-mint to-mint",
    chip: "bg-mint/60 text-ink",
    text: "text-ink",
  },
  butter: {
    edge: "from-butter to-butter",
    chip: "bg-butter/80 text-ink",
    text: "text-ink",
  },
  ink: { edge: "from-ink to-ink", chip: "bg-ink text-paper", text: "text-ink" },
};

function glyphFor(isReturning: boolean, status: string | null): IconName {
  if (isReturning) return "refresh";
  if (status === "SUCCESS") return "check";
  if (status === "CANCELLED" || status === "FAILURE" || status === "ERROR") {
    return "alert";
  }
  if (
    !status ||
    status === "UNFULFILLED" ||
    status === "OPEN" ||
    status === "PENDING_FULFILLMENT"
  ) {
    return "package";
  }
  return "truck";
}

/**
 * One compact card per item rather than one stepper per order. An order-wide
 * stepper drags every item to "Delivered" the moment one box lands — exactly
 * the lie a shopper notices while the other box is still in transit.
 *
 * Two rows only: what it is with its live status, then the road it travels.
 * The rail draws itself in on load and keeps the live leg moving, so a glance
 * tells you whether anything is still happening.
 */
export function OrderItemStatus({
  item,
  group,
  order,
  returns,
}: {
  item: OrderLineItem;
  group: ShipmentGroup;
  order: Order;
  returns: OrderReturnSummary | null;
}) {
  const detail = returnForLineItem(item.id, returns);
  const journey = itemJourney(group, order, detail);
  /* Carrier deep links are parked until the tracking numbers Shopify returns
     are trustworthy enough to send a shopper to. Flip to `true` to bring the
     row back; everything it needs is still wired up below. */
  const SHOW_CARRIER_LINKS = false;
  const trackingLinks = SHOW_CARRIER_LINKS
    ? (group.fulfillment?.trackingInformation ?? []).filter((info) => info.url)
    : [];

  const tone: StatusTone = detail
    ? returnStatus(detail.status).tone
    : fulfillmentStatus(group.fulfillment?.status ?? null).tone;
  const accent = accents[tone];

  /* The headline is whichever milestone the item is actually sitting on — the
     live one if something is still in motion, otherwise the last one reached. */
  const marker =
    journey.find((node) => node.state === "current") ??
    journey.findLast(
      (node) => node.state === "done" || node.state === "failed",
    ) ??
    journey[0];

  const description = detail ? returnStatus(detail.status).description : "";
  const reason = detail?.lineItemReasons[item.id] ?? null;
  const hasFootnotes = Boolean(
    description || reason || detail?.tracking?.number,
  );

  return (
    <li className="group relative overflow-hidden rounded-panel border border-hairline bg-paper py-3.5 pr-4 pl-5 shadow-soft transition-shadow duration-500 ease-out-soft hover:shadow-drift sm:pr-5 sm:pl-6">
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-1 bg-linear-to-b",
          accent.edge,
        )}
      />

      {/* Phone first: the thumbnail stays small, the name is allowed to wrap
          rather than truncate (a clipped product name is useless on a 360px
          screen), and price sits with it instead of fighting for a third
          column. The separate price column only appears once there is room. */}
      <div className="flex items-start gap-3 sm:items-center sm:gap-3.5">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image.url}
            alt={item.image.altText ?? ""}
            className="size-11 shrink-0 rounded-card bg-blush object-cover sm:size-12"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-card bg-blush text-rose-500 sm:size-12">
            <Icon name="bag" className="size-5" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-headline text-body-sm text-ink sm:truncate">
            {item.title}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-ink-faint sm:hidden">
            {item.totalPrice
              ? `${formatMoney(item.totalPrice.amount, item.totalPrice.currencyCode)} · `
              : ""}
            ×{item.quantity}
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="font-headline text-body-sm text-ink">
            {item.totalPrice
              ? formatMoney(
                  item.totalPrice.amount,
                  item.totalPrice.currencyCode,
                )
              : ""}
          </p>
          <p className="text-[0.68rem] text-ink-faint">×{item.quantity}</p>
        </div>
      </div>

      {/* Its own line at every width — wedged beside a truncating title it was
          the first thing to wrap badly on a phone. */}
      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill px-2 py-1 font-label text-[0.62rem] tracking-[0.12em] uppercase",
            accent.chip,
          )}
        >
          <Icon
            name={glyphFor(detail !== null, group.fulfillment?.status ?? null)}
            className="size-3"
            strokeWidth={2.4}
          />
          {marker?.label}
        </span>
        {marker?.at && (
          <span className="text-[0.68rem] text-ink-faint">
            {shortDate(marker.at)}
          </span>
        )}
      </p>

      <JourneyRail nodes={journey} />

      {/* Stacked on a phone — these read as separate facts, and side by side
          in 300px they collapse into one run-on line. */}
      {(hasFootnotes || (!detail && trackingLinks.length > 0)) && (
        <div className="mt-3 flex flex-col gap-1 border-t border-hairline pt-2.5 text-[0.72rem] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          {description && <span className="text-ink-soft">{description}</span>}
          {reason && (
            <span className="text-ink-faint">
              Reason:{" "}
              <span className="text-ink">{returnReasonLabel(reason)}</span>
            </span>
          )}
          {detail?.tracking?.number && (
            <span className="text-ink-faint">
              Return tracking:{" "}
              {detail.tracking.url ? (
                <Link
                  href={detail.tracking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-ink"
                >
                  {detail.tracking.number}
                </Link>
              ) : (
                <span className="text-ink">{detail.tracking.number}</span>
              )}
            </span>
          )}

          {!detail &&
            trackingLinks.map((info) => (
              <Link
                key={info.url ?? info.number ?? "tracking"}
                href={info.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                /* -my-1.5 keeps the row's height while giving the tap target
                   the extra 12px a thumb needs. */
                className="group/link -my-1.5 inline-flex items-center gap-1.5 self-start py-1.5 font-label tracking-[0.12em] text-rose-600 uppercase"
              >
                <Icon name="truck" className="size-3.5" />
                Track with {info.company || "the carrier"}
                <Icon
                  name="arrow-right"
                  className="size-3 transition-transform duration-500 ease-out-soft group-hover/link:translate-x-1"
                />
              </Link>
            ))}
        </div>
      )}
    </li>
  );
}
