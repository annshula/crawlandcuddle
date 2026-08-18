import type { Metadata } from "next";

import { CheckoutSummary } from "@/components/cart/CheckoutSummary";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your bag and complete your Crawl & Cuddle order.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="relative -mt-(--nav-height) min-h-[70vh] bg-cream pt-[calc(var(--nav-height)+2.5rem)] pb-24">
      <div className="container-page">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: "Checkout" },
          ]}
        />
        <h1 className="mt-6 font-display text-heading text-ink uppercase">
          Checkout
        </h1>
        <CheckoutSummary />
      </div>
    </section>
  );
}
