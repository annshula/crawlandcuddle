import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getOrder } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";
import { formatMoney, shortDate } from "@/lib/money";
import {
  financialStatus,
  fulfillmentStatus,
  toneClasses,
} from "@/lib/account/order-status";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Order details — Crawl & Cuddle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

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
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.name },
        ]}
      />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-heading text-ink uppercase">
            {order.name}
          </h1>
          <p className="mt-1 text-body-sm text-ink-soft">
            Placed {shortDate(order.processedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className={`rounded-tag px-3 py-1.5 font-label text-[0.66rem] tracking-[0.14em] uppercase ${toneClasses[financial.tone]}`}
          >
            {financial.label}
          </span>
          <span
            className={`rounded-tag px-3 py-1.5 font-label text-[0.66rem] tracking-[0.14em] uppercase ${toneClasses[fulfillment.tone]}`}
          >
            {fulfillment.label}
          </span>
        </div>
      </div>

      {order.cancelledAt && (
        <div className="mt-6 rounded-panel border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-body-sm text-rose-700">
            This order was cancelled on {shortDate(order.cancelledAt)}.
          </p>
        </div>
      )}

      {/* Tracking */}
      {hasTracking && (
        <div className="mt-6 rounded-panel border border-hairline bg-paper p-6 shadow-soft">
          <h2 className="font-display text-heading-sm text-ink uppercase">
            Delivery tracking
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {order.fulfillments.flatMap((f) =>
              f.trackingInformation.map((t, i) => (
                <li
                  key={`${f.id}-${i}`}
                  className="flex items-center justify-between gap-4 rounded-tag bg-cream px-4 py-3"
                >
                  <div>
                    <p className="font-label text-[0.68rem] tracking-[0.14em] text-ink-soft uppercase">
                      {t.company || "Carrier"}
                    </p>
                    <p className="font-headline text-ink">{t.number || "—"}</p>
                  </div>
                  {t.url && (
                    <Link
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-label text-[0.7rem] tracking-[0.14em] text-rose-600 uppercase"
                    >
                      Track
                      <Icon name="arrow-right" className="size-3.5" />
                    </Link>
                  )}
                </li>
              )),
            )}
          </ul>
        </div>
      )}

      {/* Line items */}
      <div className="mt-6 rounded-panel border border-hairline bg-paper p-6 shadow-soft">
        <h2 className="font-display text-heading-sm text-ink uppercase">
          Items
        </h2>
        <ul className="mt-4 flex flex-col divide-y divide-hairline">
          {order.lineItems.map((line) => (
            <li key={line.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              {line.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={line.image.url}
                  alt={line.image.altText ?? ""}
                  className="size-16 shrink-0 rounded-tag bg-blush object-cover"
                />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-tag bg-blush text-ink-soft">
                  <Icon name="bag" className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-headline text-ink">{line.title}</p>
                {line.variantTitle && line.variantTitle !== "Default Title" && (
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

        <dl className="mt-6 space-y-2 border-t border-hairline pt-5 text-body-sm">
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
          <div className="flex justify-between border-t border-hairline pt-3">
            <dt className="font-headline text-ink">Total</dt>
            <dd className="font-headline text-ink">
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
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {order.shippingAddress && (
          <div className="rounded-panel border border-hairline bg-paper p-6 shadow-soft">
            <h2 className="font-display text-heading-sm text-ink uppercase">
              Shipping address
            </h2>
            <p className="mt-4 whitespace-pre-line text-body-sm text-ink-soft">
              {order.shippingAddress.formatted.join("\n")}
            </p>
          </div>
        )}
        {order.billingAddress && (
          <div className="rounded-panel border border-hairline bg-paper p-6 shadow-soft">
            <h2 className="font-display text-heading-sm text-ink uppercase">
              Billing address
            </h2>
            <p className="mt-4 whitespace-pre-line text-body-sm text-ink-soft">
              {order.billingAddress.formatted.join("\n")}
            </p>
          </div>
        )}
      </div>

      {order.statusPageUrl && (
        <div className="mt-8">
          <Link
            href={order.statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-label text-[0.72rem] tracking-[0.14em] text-rose-600 uppercase"
          >
            Open full order status page →
          </Link>
        </div>
      )}
    </div>
  );
}
