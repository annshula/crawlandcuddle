import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { listOrders } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";
import { formatMoney, shortDate } from "@/lib/money";

export const metadata: Metadata = {
  title: "Order history — Crawl & Cuddle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ after?: string | string[] }>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
  await requireCustomer("/account/orders");
  const params = await searchParams;
  const after = Array.isArray(params.after) ? params.after[0] : params.after;

  const result = await listOrders({ first: 10, after: after ?? null });
  const { orders, hasNextPage, endCursor } = result;

  return (
    <div className="min-w-0">
      <p className="eyebrow flex items-center gap-3 text-rose-600">
        <span className="inline-block h-px w-8 bg-rose-600/40" />
        Your account
      </p>
      <h1 className="mt-3 font-display text-heading text-ink uppercase">
        Order history
      </h1>
      <p className="mt-2 text-body text-ink-soft">
        Every order with live fulfilment and delivery tracking.
      </p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-panel border border-hairline bg-paper px-6 py-14 text-center shadow-soft">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush text-rose-500">
            <Icon name="bag" className="size-6" />
          </span>
          <p className="mt-4 font-headline text-lg text-ink">
            Nothing here yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-body-sm text-ink-soft">
            Your orders will appear here as soon as you place one.
          </p>
          <Button href="/products" withArrow className="mt-6">
            Browse the range
          </Button>
        </div>
      ) : (
        <>
          <ul className="mt-8 flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${encodeURIComponent(order.id)}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-hairline bg-paper px-5 py-4 shadow-soft transition-colors duration-300 hover:border-rose-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {order.previewImages.slice(0, 3).map((img, i) =>
                        img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={img.url}
                            alt=""
                            className="size-11 rounded-full border-2 border-paper bg-blush object-cover"
                          />
                        ) : null,
                      )}
                      {order.previewImages.length === 0 && (
                        <span className="grid size-11 place-items-center rounded-full bg-blush text-ink-soft">
                          <Icon name="bag" className="size-4" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-headline text-ink">{order.name}</p>
                      <p className="text-caption text-ink-faint">
                        {shortDate(order.processedAt)} · {order.lineItemCount}{" "}
                        item{order.lineItemCount === 1 ? "" : "s"}
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
                    <Icon name="arrow-right" className="size-4 text-ink-soft" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-between">
            {after ? (
              <Link
                href="/account/orders"
                className="font-label text-[0.72rem] tracking-[0.14em] text-rose-600 uppercase"
              >
                ← Back to most recent
              </Link>
            ) : (
              <span />
            )}
            {hasNextPage && endCursor ? (
              <Link
                href={`/account/orders?after=${encodeURIComponent(endCursor)}`}
                className="font-label text-[0.72rem] tracking-[0.14em] text-rose-600 uppercase"
              >
                Load older orders →
              </Link>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
