"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { product } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { shopifyCheckout } from "@/lib/shopify-checkout";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn, formatPrice } from "@/lib/utils";

const FREE_SHIPPING_OVER = 0; // Shipping is free on every order.

export function CartDrawer() {
  const { lines, count, subtotalCents, isOpen, close, setQty, remove } =
    useCart();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
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

  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || !scrim) return;

    if (prefersReducedMotion()) {
      gsap.set([panel, scrim], { autoAlpha: isOpen ? 1 : 0 });
      gsap.set(panel, { xPercent: isOpen ? 0 : 100 });
      return;
    }

    const tl = gsap.timeline();
    if (isOpen) {
      tl.set(panel, { xPercent: 100 })
        .set([scrim, panel], { autoAlpha: 1 })
        .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0)
        .fromTo(
          panel,
          { xPercent: 100 },
          { xPercent: 0, duration: 0.6, ease: "expo.out" },
          0,
        )
        .fromTo(
          panel.querySelectorAll("[data-cart-item]"),
          { x: 24, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.05,
            ease: "power3.out",
          },
          0.15,
        );
    } else {
      tl.to(scrim, { opacity: 0, duration: 0.3 }, 0)
        .to(panel, { xPercent: 100, duration: 0.45, ease: "power3.in" }, 0)
        .set([scrim, panel], { autoAlpha: 0 });
    }

    return () => {
      tl.kill();
    };
  }, [isOpen, lines.length]);

  return (
    <div
      className={cn("fixed inset-0 z-80", !isOpen && "pointer-events-none")}
      aria-hidden={!isOpen}
    >
      <div
        ref={scrimRef}
        onClick={close}
        className="absolute inset-0 bg-ink/45 opacity-0 backdrop-blur-[2px]"
      />

      {/*
        No static transform (neither a `translate-x-full` class nor an inline
        `translateX(100%)`) may sit on this element. GSAP parses any existing
        transform into its own base x/y and then applies xPercent *in addition*
        to it — so a 100% baseline plus an xPercent:0 tween still resolves to
        `translate(0%) translate3d(448px,0,0)`, i.e. fully off-screen. GSAP
        owns the transform outright; `invisible` keeps the panel hidden until
        the first effect run positions it.
      */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className="invisible absolute inset-y-0 right-0 isolate flex w-full max-w-md flex-col bg-paper opacity-0 shadow-drift"
      >
        <header className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <h2 className="font-display text-heading-sm text-ink uppercase">
            Your bag
            {count > 0 && <span className="ml-2 text-rose-500">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close bag"
            className="grid size-10 place-items-center rounded-full border border-hairline text-ink transition-colors duration-300 hover:border-rose-600 hover:text-rose-600"
          >
            <Icon name="close" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-rose-50 text-rose-500">
              <Icon name="gift" className="size-7" />
            </span>
            <p className="font-headline text-lg text-ink">Your bag is empty</p>
            <p className="text-body-sm text-ink-soft">
              Ten styles, one promise — pick the one they will ask for by name.
            </p>
            <Button href="/products" onClick={close} withArrow>
              Browse the range
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-5" data-lenis-prevent>
              {lines.map((line) => (
                <li
                  key={line.slug}
                  data-cart-item
                  className="flex gap-4 border-b border-hairline py-5 first:pt-0 last:border-b-0"
                >
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={close}
                    className={cn(
                      "relative size-20 shrink-0 overflow-hidden rounded-card",
                      line.tone,
                    )}
                  >
                    <Image
                      src={line.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/products/${line.slug}`}
                        onClick={close}
                        className="font-headline text-base text-ink transition-colors hover:text-rose-600"
                      >
                        {line.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(line.slug)}
                        aria-label={`Remove ${line.name}`}
                        className="shrink-0 text-ink-faint transition-colors hover:text-rose-600"
                      >
                        <Icon name="trash" className="size-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center rounded-btn border border-hairline">
                        <button
                          type="button"
                          onClick={() => setQty(line.slug, line.qty - 1)}
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="grid size-9 cursor-pointer place-items-center text-ink transition-colors hover:text-rose-600"
                        >
                          −
                        </button>
                        <span
                          aria-live="polite"
                          className="w-8 text-center font-headline text-base text-ink"
                        >
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.slug, line.qty + 1)}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="grid size-9 cursor-pointer place-items-center text-ink transition-colors hover:text-rose-600"
                        >
                          +
                        </button>
                      </span>
                      <span className="font-headline text-base text-ink">
                        {formatPrice(line.lineTotalCents)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-hairline px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-ink-faint">Subtotal</span>
                <span className="font-display text-[2.1rem] leading-none tracking-[0.02em] text-ink uppercase">
                  {formatPrice(subtotalCents)}
                </span>
              </div>
              <p className="mt-2 text-body-sm text-ink-soft">
                {subtotalCents > FREE_SHIPPING_OVER
                  ? "Free tracked shipping included."
                  : "Shipping calculated at checkout."}
              </p>
              {checkoutError && (
                <p className="mt-4 rounded-tag bg-rose-50 px-4 py-3 text-body-sm text-rose-700">
                  {checkoutError}
                </p>
              )}
              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                withArrow
                className="mt-5 w-full"
              >
                {checkingOut ? "Taking you to checkout…" : "Checkout"}
              </Button>
              <p className="mt-3 text-center text-body-sm text-ink-faint">
                {product.currency} · secure payment · 30-day returns
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
