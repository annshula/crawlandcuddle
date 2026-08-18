import type { Metadata } from "next";
import Link from "next/link";

import { AccountHeader } from "@/components/account/AccountHeader";
import { EmptyState } from "@/components/account/EmptyState";
import { OrderRow } from "@/components/account/OrderRow";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getCustomer, listOrders } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";

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
  const defaultAddress = customer?.defaultAddressId
    ? customer.addresses.find((a) => a.id === customer.defaultAddressId)
    : null;

  return (
    <div className="min-w-0">
      <AccountHeader
        eyebrow="Welcome back"
        title={`Hi, ${first}`}
        script="good to see you again"
        body="Your profile, your saved address and everything you have ordered — all in one place."
      />

      <Reveal as="div" variant="up" stagger={0.08} className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Profile */}
        <div className="rounded-panel border border-hairline bg-paper p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-heading-sm text-ink uppercase">
              Profile
            </h2>
            <Link
              href="/account/profile"
              className="group/link flex items-center gap-1 font-label text-[0.7rem] tracking-[0.14em] text-rose-600 uppercase"
            >
              Edit
              <Icon
                name="arrow-right"
                className="size-3.5 transition-transform duration-500 ease-out-soft group-hover/link:translate-x-1"
              />
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-blush font-display text-xl text-rose-600 uppercase">
              {initials || <Icon name="user" className="size-5" />}
            </span>
            <div className="min-w-0">
              <p className="font-headline text-lg text-ink">
                {[customer?.firstName, customer?.lastName]
                  .filter(Boolean)
                  .join(" ") || "Your name"}
              </p>
              <p className="truncate text-body-sm text-ink-soft">
                {customer?.emailAddress ?? "No email on file"}
              </p>
            </div>
          </div>
        </div>

        {/* Default address */}
        <div className="rounded-panel border border-hairline bg-paper p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-heading-sm text-ink uppercase">
              Default address
            </h2>
            <Link
              href="/account/addresses"
              className="group/link flex items-center gap-1 font-label text-[0.7rem] tracking-[0.14em] text-rose-600 uppercase"
            >
              All
              <Icon
                name="arrow-right"
                className="size-3.5 transition-transform duration-500 ease-out-soft group-hover/link:translate-x-1"
              />
            </Link>
          </div>
          <div className="mt-6 flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-lilac-100 text-lilac-600">
              <Icon name="map-pin" className="size-5" />
            </span>
            {defaultAddress ? (
              <p className="min-w-0 text-body-sm whitespace-pre-line text-ink-soft">
                {defaultAddress.formatted.join("\n")}
              </p>
            ) : (
              <p className="text-body-sm text-ink-soft">
                No default address yet. Add one at checkout and it will live
                here.
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {/* Orders */}
      <div className="mt-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-heading-sm text-ink uppercase">
              Recent orders
            </h2>
            <p
              aria-hidden="true"
              className="mt-1 font-script text-2xl text-rose-500"
            >
              on their way to you
            </p>
          </div>
          <Link
            href="/account/orders"
            className="link-underline shrink-0 font-label text-[0.72rem] tracking-[0.2em] text-rose-600 uppercase"
          >
            View all
          </Link>
        </div>

        {!orders || orders.orders.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon="bag"
              art="pram"
              title="No orders yet"
              script="the first one is the best one"
              body="When you place your first order it will show up here with live tracking and easy returns."
            >
              <Button href="/products" withArrow>
                Shop the range
              </Button>
            </EmptyState>
          </div>
        ) : (
          <Reveal as="ul" variant="up" stagger={0.06} className="mt-6 flex flex-col gap-3">
            {orders.orders.map((order) => (
              <li key={order.id}>
                <OrderRow order={order} />
              </li>
            ))}
          </Reveal>
        )}
      </div>
    </div>
  );
}
