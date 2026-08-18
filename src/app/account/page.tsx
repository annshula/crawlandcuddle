import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getCustomer, listOrders } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";
import { formatMoney, shortDate } from "@/lib/money";

export const metadata: Metadata = {
  title: "Your account — Crawl & Cuddle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  await requireCustomer("/account");

  // One failing panel must never blank the dashboard.
  const [customerResult, ordersResult] = await Promise.allSettled([
    getCustomer(),
    listOrders({ first: 5 }),
  ]);

  const customer =
    customerResult.status === "fulfilled" ? customerResult.value : null;
  const orders =
    ordersResult.status === "fulfilled" ? ordersResult.value : null;
  const first = customer?.firstName ?? "there";
  const initials =
    (customer?.firstName?.[0] ?? "") + (customer?.lastName?.[0] ?? "");

  return (
    <div className="min-w-0">
      <p className="eyebrow flex items-center gap-3 text-rose-600">
        <span className="inline-block h-px w-8 bg-rose-600/40" />
        Welcome back
      </p>
      <h1 className="mt-3 font-display text-heading text-ink uppercase">
        Hi, {first}
      </h1>
      <p className="mt-2 max-w-lg text-body text-ink-soft">
        Here is a quick look at your profile and most recent orders.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-panel border border-hairline bg-paper p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-heading-sm text-ink uppercase">
              Profile
            </h2>
            <Link
              href="/account/profile"
              className="flex items-center gap-1 font-label text-[0.7rem] tracking-[0.14em] text-rose-600 uppercase"
            >
              Edit
              <Icon name="arrow-right" className="size-3.5" />
            </Link>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush font-display text-lg text-rose-600 uppercase">
              {initials || "—"}
            </span>
            <div className="min-w-0">
              <p className="font-headline text-ink">
                {customer?.firstName} {customer?.lastName}
              </p>
              <p className="truncate text-body-sm text-ink-soft">
                {customer?.emailAddress ?? "No email on file"}
              </p>
            </div>
          </div>
        </div>

        {/* Address card */}
        <div className="rounded-panel border border-hairline bg-paper p-6 shadow-soft">
          <h2 className="font-display text-heading-sm text-ink uppercase">
            Default address
          </h2>
          <div className="mt-5">
            {customer?.defaultAddressId ? (
              (() => {
                const address = customer.addresses.find(
                  (a) => a.id === customer.defaultAddressId,
                );
                return address ? (
                  <p className="whitespace-pre-line text-body-sm text-ink-soft">
                    {address.formatted.join("\n")}
                  </p>
                ) : (
                  <p className="text-body-sm text-ink-soft">
                    No address saved yet.
                  </p>
                );
              })()
            ) : (
              <p className="text-body-sm text-ink-soft">
                No default address yet. Add one at checkout.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-heading-sm text-ink uppercase">
            Recent orders
          </h2>
          <Link
            href="/account/orders"
            className="flex items-center gap-1 font-label text-[0.7rem] tracking-[0.14em] text-rose-600 uppercase"
          >
            View all
            <Icon name="arrow-right" className="size-3.5" />
          </Link>
        </div>

        {!orders || orders.orders.length === 0 ? (
          <div className="mt-5 rounded-panel border border-hairline bg-paper px-6 py-12 text-center shadow-soft">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush text-rose-500">
              <Icon name="bag" className="size-6" />
            </span>
            <p className="mt-4 font-headline text-lg text-ink">No orders yet</p>
            <p className="mx-auto mt-2 max-w-sm text-body-sm text-ink-soft">
              When you place your first order it will show up here with live
              tracking and easy returns.
            </p>
            <Button href="/products" withArrow className="mt-6">
              Shop the range
            </Button>
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {orders.orders.map((order) => (
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
        )}
      </div>
    </div>
  );
}
