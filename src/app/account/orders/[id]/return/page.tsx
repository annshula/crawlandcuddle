import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountHeader } from "@/components/account/AccountHeader";
import { ReturnRequestForm } from "@/components/account/ReturnRequestForm";
import { Reveal } from "@/components/motion/Reveal";
import {
  isReturnable,
  RETURN_WINDOW_DAYS,
  returnEligibility,
} from "@/lib/account/order-status";
import { shortDate } from "@/lib/money";
import { getOrder, getOrderReturnStatus } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";

export const metadata: Metadata = {
  title: "Request a return — Crawl & Cuddle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function OrderReturnPage({ params }: PageProps) {
  const { id } = await params;
  await requireCustomer(`/account/orders/${id}/return`);

  const orderId = decodeURIComponent(id);
  const order = await getOrder(orderId).catch(() => null);
  if (!order || !isReturnable(order)) notFound();

  // Never allowed to fail the page — see getOrderReturnStatus's own comment.
  const returns = await getOrderReturnStatus(orderId);
  const { items, closesAt } = returnEligibility(order, returns);
  if (items.length === 0) notFound();

  return (
    <div className="min-w-0">
      <AccountHeader
        eyebrow="Return"
        title={`Send back from ${order.name}`}
        body={
          closesAt
            ? `Choose what is going back and why. Send it to us by ${shortDate(closesAt.toISOString())} — return shipping is on us.`
            : `Choose what is going back and why. You have ${RETURN_WINDOW_DAYS} days from delivery, and return shipping is on us.`
        }
        crumbs={[
          { label: "Orders", href: "/account/orders" },
          { label: order.name, href: `/account/orders/${id}` },
          { label: "Return" },
        ]}
      />

      <Reveal as="div" variant="up" className="mt-10">
        <ReturnRequestForm
          order={order}
          items={items}
          redirectTo={`/account/orders/${id}`}
        />
      </Reveal>
    </div>
  );
}
