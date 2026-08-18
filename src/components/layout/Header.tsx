"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Blob } from "@/components/art/Blob";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { nav } from "@/content/site";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

/**
 * Transparent while the hero is on screen so the decorative blobs read through
 * it, then a blurred cream bar once the page scrolls. It never hides on scroll
 * down — the cart and navigation have to stay reachable at all times.
 */
export function Header() {
  const pathname = usePathname();
  const { count, open } = useCart();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close the mobile panel whenever the route changes. */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Native touch: Escape dismisses the menu too. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (prefersReducedMotion()) {
      gsap.set(panel, { autoAlpha: menuOpen ? 1 : 0 });
      return;
    }

    const links = panel.querySelectorAll("[data-mobile-link]");
    const tl = gsap.timeline();

    if (menuOpen) {
      tl.set(panel, { autoAlpha: 1, pointerEvents: "auto" })
        .fromTo(
          panel,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.out" },
        )
        .fromTo(
          links,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.06,
            ease: "power3.out",
          },
          "-=0.35",
        );
    } else {
      tl.to(panel, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.45,
        ease: "power3.inOut",
      }).set(panel, { autoAlpha: 0, pointerEvents: "none" });
    }

    return () => {
      tl.kill();
    };
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Only the Products link gets a persistent active state — the hash links
  // (Why it works, Fitting, Parents) point at sections on the home page, and
  // matching pathname alone would mark all three "active" any time we're on
  // "/", regardless of scroll position.
  const isActive = (href: string) =>
    href.startsWith("/products") && pathname.startsWith("/products");

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-[background-color,box-shadow,backdrop-filter] duration-500",
          scrolled
            ? "bg-cream/85 shadow-soft backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div className="container-wide flex h-(--nav-height) items-center justify-between gap-6">
          <Logo />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "link-underline font-label text-[0.75rem] tracking-[0.2em] uppercase transition-colors duration-300 hover:text-rose-600",
                      isActive(item.href) ? "text-rose-600" : "text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:flex sm:flex-col sm:items-center">
              <Button href="/products" className="px-7! py-3.5!">
                Shop now
              </Button>
              {/* Free-gift tag roped to the navbar Shop button — decorative,
                  never intercepts clicks, hidden on small screens. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-full z-20 hidden flex-col items-center sm:flex"
              >
                <svg
                  width="2"
                  height="12"
                  viewBox="0 0 2 12"
                  className="text-ink-faint/50"
                >
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="2 3"
                  />
                </svg>
                <div className="origin-top animate-wobble rotate-2 rounded-tag bg-rose-500 px-3.5 py-1.5 text-center text-paper shadow-lift">
                  <p className="font-label text-[0.58rem] leading-snug tracking-[0.14em] uppercase">
                    Free gift
                    <br />
                    $15 value
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={open}
              aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
              className="relative grid size-11 place-items-center rounded-full border border-ink/15 text-ink transition-colors duration-300 hover:border-rose-600 hover:text-rose-600"
            >
              <Icon name="bag" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 py-0.5 font-label text-[0.6rem] leading-none text-paper">
                  {count}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid size-11 place-items-center rounded-full border border-ink/15 text-ink transition-colors duration-300 hover:border-rose-600 hover:text-rose-600 lg:hidden"
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={panelRef}
        className="fixed inset-0 z-50 opacity-0 lg:hidden"
        style={{ pointerEvents: "none" }}
        aria-hidden={!menuOpen}
      >
        <div className="paper-grain relative flex h-full flex-col overflow-y-auto bg-lilac-700 px-6 pt-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] text-paper">
          {/* Decorative theme blobs so the panel never reads as a flat block. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-20 w-72 text-rose-500/25 animate-drift"
          >
            <Blob shape="c" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-24 w-80 text-lilac-900/40 animate-drift"
          >
            <Blob shape="e" spin={-20} />
          </div>

          <div className="relative flex items-center justify-between">
            <Logo tone="light" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="grid size-11 place-items-center rounded-full border border-paper/25 transition-colors duration-300 hover:bg-paper/10"
            >
              <Icon name="close" />
            </button>
          </div>

          <nav aria-label="Mobile" className="relative mt-12 flex-1">
            <ul className="flex flex-col">
              {nav.map((item) => (
                <li key={item.href} data-mobile-link>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center justify-between gap-4 border-b border-paper/15 py-5 font-display text-heading-sm uppercase transition-colors duration-300 hover:text-rose-200 active:text-rose-200"
                  >
                    {item.label}
                    <Icon
                      name="arrow-right"
                      className="size-5 -translate-x-1 text-rose-200/40 transition-all duration-300 group-hover:translate-x-0 group-hover:text-rose-200/90"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div data-mobile-link className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-paper/15 bg-paper/5 px-4 py-3">
              <span className="flex items-center gap-3">
                <Icon name="bag" className="text-rose-200" />
                <span className="font-label text-[0.72rem] tracking-[0.16em] uppercase">
                  Your bag
                </span>
              </span>
              <span className="font-display text-lg text-rose-200">
                {count}
              </span>
            </div>
            <Button
              href="/products"
              onClick={() => setMenuOpen(false)}
              withArrow
            >
              Shop the range
            </Button>
            <p className="font-script text-2xl text-rose-200">
              training wheels for falling over
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
