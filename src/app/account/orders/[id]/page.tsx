import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountHeader } from "@/components/account/AccountHeader";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import {
  financialStatus,
  fulfillmentStatus,
  toneClasses,
} from "@/lib/account/order-status";
import { formatMoney, shortDate } from "@/lib/money";
import { getOrder } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order details — Crawl & Cuddle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const panel = "rounded-panel border border-hairline bg-paper p-6 shadow-soft";
const panelHeading = "font-display text-heading-sm text-ink uppercase";
const badge =
  "rounded-tag px-3 py-1.5 font-label text-[0.66rem] tracking-[0.14em] uppercase";

export default async function OrderDetailPage({ params }: PageProps) {
  await requireCustomer("/account/orders");
  const { id } = await params;
  const order = await getOrder(decodeURIComponent(id));
  if (!order) notFound();

  const financial = financialStatus(order.financialStatus);
  const fulfillment = fulfillmentStatus(order.fulfillments[0]?.status ?? null);
  const hasTracking = order.fulfillments.some(
    (f) => f.trackingInformation.length > 0,
  );

  return (
    <div className="min-w-0">
      <AccountHeader
        eyebrow="Order"
        title={order.name}
        body={`Placed ${shortDate(order.processedAt)}`}
        crumbs={[
          { label: "Orders", href: "/account/orders" },
          { label: order.name },
        ]}
      >
        <div className="mt-5 flex flex-wrap gap-2">
          <span className={cn(badge, toneClasses[financial.tone])}>
            {financial.label}
          </span>
          <span className={cn(badge, toneClasses[fulfillment.tone])}>
            {fulfillment.label}
          </span>
        </div>
      </AccountHeader>

      {order.cancelledAt && (
        <div className="mt-8 flex gap-3 rounded-panel border border-rose-200 bg-rose-50 px-5 py-4">
          <Icon
            name="close"
            className="mt-0.5 size-4 shrink-0 text-rose-700"
            strokeWidth={2.2}
          />
          <p className="text-body-sm text-rose-700">
            This order was cancelled on {shortDate(order.cancelledAt)}.
          </p>
        </div>
      )}

      <Reveal
        as="div"
        variant="up"
        stagger={0.08}
        className="mt-10 flex flex-col gap-6"
      >
        {/* Tracking */}
        {hasTracking && (
          <div className={panel}>
            <h2 className={panelHeading}>Delivery tracking</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {order.fulfillments.flatMap((f) =>
                f.trackingInformation.map((t, i) => (
                  <li
                    key={`${f.id}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-tag bg-cream px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush text-rose-600">
                        <Icon name="package" className="size-4" />
                      </span>
                      <div>
                        <p className="font-label text-[0.68rem] tracking-[0.14em] text-ink-faint uppercase">
                          {t.company || "Carrier"}
                        </p>
                        <p className="font-headline text-ink">
                          {t.number || "—"}
                        </p>
                      </div>
                    </div>
                    {t.url && (
                      <Link
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link flex items-center gap-1.5 font-label text-[0.7rem] tracking-[0.14em] text-rose-600 uppercase"
                      >
                        Track
                        <Icon
                          name="arrow-right"
                          className="size-3.5 transition-transform duration-500 ease-out-soft group-hover/link:translate-x-1"
                        />
                      </Link>
                    )}
                  </li>
                )),
              )}
            </ul>
          </div>
        )}

        {/* Line items */}
        <div className={panel}>
          <h2 className={panelHeading}>Items</h2>
          <ul className="mt-5 flex flex-col divide-y divide-hairline">
            {order.lineItems.map((line) => (
              <li
                key={line.id}
                className="flex gap-4 py-4 first:pt-0 last:pb-0"
              >
                {line.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={line.image.url}
                    alt={line.image.altText ?? ""}
                    className="size-16 shrink-0 rounded-card bg-blush object-cover"
                  />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-card bg-blush text-rose-500">
                    <Icon name="bag" className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-headline text-ink">{line.title}</p>
                  {line.variantTitle &&
                    line.variantTitle !== "Default Title" && (
                      <p className="text-caption text-ink-faint">
                        {line.variantTitle}
                      </p>
                    )}
                  <p className="mt-1 text-body-sm text-ink-soft">
                    Qty {line.quantity}
                    {line.sku ? ` · SKU ${line.sku}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-headline text-ink">
                  {line.totalPrice
                    ? formatMoney(
                        line.totalPrice.amount,
                        line.totalPrice.currencyCode,
                      )
                    : ""}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2.5 border-t border-hairline pt-5 text-body-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="text-ink">
                {order.subtotal
                  ? formatMoney(
                      order.subtotal.amount,
                      order.subtotal.currencyCode,
                    )
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="text-ink">
                {order.totalShipping
                  ? formatMoney(
                      order.totalShipping.amount,
                      order.totalShipping.currencyCode,
                    )
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Tax</dt>
              <dd className="text-ink">
                {order.totalTax
                  ? formatMoney(
                      order.totalTax.amount,
                      order.totalTax.currencyCode,
                    )
                  : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-hairline pt-3.5">
              <dt className="font-display text-lg text-ink uppercase">Total</dt>
              <dd className="font-display text-[1.75rem] leading-none tracking-[0.02em] text-ink uppercase">
                {order.totalPrice
                  ? formatMoney(
                      order.totalPrice.amount,
                      order.totalPrice.currencyCode,
                    )
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Addresses */}
        {(order.shippingAddress || order.billingAddress) && (
          <div className="grid gap-6 md:grid-cols-2">
            {order.shippingAddress && (
              <div className={panel}>
                <h2 className={panelHeading}>Shipping address</h2>
                <p className="mt-4 text-body-sm whitespace-pre-line text-ink-soft">
                  {order.shippingAddress.formatted.join("\n")}
                </p>
              </div>
            )}
            {order.billingAddress && (
              <div className={panel}>
                <h2 className={panelHeading}>Billing address</h2>
                <p className="mt-4 text-body-sm whitespace-pre-line text-ink-soft">
                  {order.billingAddress.formatted.join("\n")}
                </p>
              </div>
            )}
          </div>
        )}
      </Reveal>

      {order.statusPageUrl && (
        <div className="mt-10 border-t border-hairline pt-6">
          <Link
            href={order.statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link flex items-center gap-2 font-label text-[0.72rem] tracking-[0.2em] text-rose-600 uppercase"
          >
            Full order status page
            <Icon
              name="arrow-right"
              className="size-3.5 transition-transform duration-500 ease-out-soft group-hover/link:translate-x-1"
            />
          </Link>
        </div>
      )}
    </div>
  );
}
