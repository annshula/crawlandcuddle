"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { useLocalizedCart } from "@/components/providers/LocalizationProvider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatMoney } from "@/lib/money";
import { shopifyCheckout } from "@/lib/shopify-checkout";
import { cn } from "@/lib/utils";

/**
 * Order review on /checkout. "Pay now" hands off to the same Shopify-hosted
 * checkout the cart drawer uses — one server-built Storefront cart, one
 * redirect — so the two entry points cannot drift apart.
 */
export function CheckoutSummary() {
  const { lines, setQty, remove } = useCart();
  const {
    currencyCode,
    unitAmountFor,
    lineTotalFor,
    subtotal,
    pending: pricePending,
  } = useLocalizedCart(lines);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (checkingOut) return;
    setCheckingOut(true);
    setCheckoutError(null);
    const result = await shopifyCheckout(
      lines.map((l) => ({ slug: l.slug, qty: l.qty })),
    );
    if (result.ok) {
      window.location.href = result.checkoutUrl;
      return;
    }
    setCheckoutError(result.error);
    setCheckingOut(false);
  };

  if (lines.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-start gap-5">
        <p className="text-body text-ink-soft">
          Your bag is empty. Pick a style and it will show up here.
        </p>
        <Button href="/products" withArrow>
          Browse the ten styles
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
      <ul className="min-w-0">
        {lines.map((line) => (
          <li
            key={line.slug}
            className="flex gap-5 border-b border-hairline py-6 first:border-t first:pt-6"
          >
            <Link
              href={`/products/${line.slug}`}
              className={cn(
                "relative size-24 shrink-0 overflow-hidden rounded-card",
                line.tone,
              )}
            >
              <Image
                src={line.image}
                alt={line.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/products/${line.slug}`}
                    className="font-headline text-lg text-ink transition-colors hover:text-rose-600"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-1 text-body-sm text-ink-faint">
                    {pricePending ? (
                      <span
                        aria-hidden="true"
                        className="inline-block h-3 w-24 animate-pulse rounded-pill bg-hairline align-middle"
                      />
                    ) : (
                      <>
                        {formatMoney(unitAmountFor(line.slug), currencyCode)}{" "}
                        each
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(line.slug)}
                  aria-label={`Remove ${line.name}`}
                  className="shrink-0 text-ink-faint transition-colors hover:text-rose-600"
                >
                  <Icon name="trash" className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center rounded-btn border border-hairline">
                  <button
                    type="button"
                    onClick={() => setQty(line.slug, line.qty - 1)}
                    aria-label={`Decrease quantity of ${line.name}`}
                    className="grid size-10 place-items-center text-ink hover:text-rose-600"
                  >
                    <Icon name="minus" className="size-4" strokeWidth={2} />
                  </button>
                  <span className="w-9 text-center font-headline text-base text-ink">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(line.slug, line.qty + 1)}
                    aria-label={`Increase quantity of ${line.name}`}
                    className="grid size-10 place-items-center text-ink hover:text-rose-600"
                  >
                    <Icon name="plus" className="size-4" strokeWidth={2} />
                  </button>
                </span>
                <span className="font-headline text-lg text-ink">
                  {pricePending ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-5 w-20 animate-pulse rounded-pill bg-hairline align-middle"
                    />
                  ) : (
                    formatMoney(lineTotalFor(line.slug, line.qty), currencyCode)
                  )}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-panel bg-paper p-7 shadow-drift lg:sticky lg:top-28">
        <h2 className="font-display text-heading-sm text-ink uppercase">
          Order summary
        </h2>

        <dl className="mt-6 flex flex-col gap-3 text-body-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="text-ink">
              {pricePending ? (
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-20 animate-pulse rounded-pill bg-hairline align-middle"
                />
              ) : (
                formatMoney(subtotal, currencyCode)
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Shipping</dt>
            <dd className="text-rose-600">Free</dd>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-hairline pt-4">
            <dt className="eyebrow text-ink-faint">Total</dt>
            <dd className="font-display text-[2.1rem] leading-none tracking-[0.02em] text-ink uppercase">
              {pricePending ? (
                <span
                  aria-hidden="true"
                  className="inline-block h-7 w-28 animate-pulse rounded-pill bg-hairline align-middle"
                />
              ) : (
                formatMoney(subtotal, currencyCode)
              )}
            </dd>
          </div>
        </dl>

        {checkoutError && (
          <p className="mt-6 rounded-tag bg-rose-50 px-4 py-3 text-body-sm text-rose-700">
            {checkoutError}
          </p>
        )}

        <Button
          onClick={handleCheckout}
          disabled={checkingOut}
          withArrow
          className="mt-7 w-full justify-center"
        >
          {checkingOut ? "Taking you to checkout…" : "Pay now"}
        </Button>

        <ul className="mt-6 flex flex-col gap-2.5 text-body-sm text-ink-soft">
          {[
            "Free tracked delivery",
            "30-day easy returns",
            "Secure checkout",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <Icon
                name="check"
                className="size-4 text-rose-600"
                strokeWidth={2.2}
              />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
