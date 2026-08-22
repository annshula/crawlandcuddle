"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { WaveDivider } from "@/components/art/WaveDivider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useScrollLock } from "@/lib/scroll-lock";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

/**
 * Sign-out confirmation. Signing out is a one-way door — it revokes the tokens
 * at Shopify, so a mis-click costs a full round trip back through OAuth. The
 * dialog is built from the same parts as the storefront (wave lip, blob,
 * line-art, script voice) rather than a stock alert box, and it leads with
 * "stay" so the destructive action is never the default.
 *
 * Controlled, and deliberately trigger-less: the header dropdown unmounts the
 * moment it closes, so the caller owns the open state at a level that outlives
 * its own menu and renders this alongside it.
 */
export function SignOutDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useIsomorphicLayoutEffect(() => {
    const scrim = scrimRef.current;
    const panel = panelRef.current;
    if (!scrim || !panel) return;

    if (prefersReducedMotion()) {
      gsap.set([scrim, panel], { autoAlpha: open ? 1 : 0, y: 0, scale: 1 });
      return;
    }

    const tl = gsap.timeline();
    if (open) {
      tl.set([scrim, panel], { autoAlpha: 1 })
        .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
        .fromTo(
          panel,
          { y: 32, scale: 0.94, opacity: 0 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(1.5)",
          },
          0.05,
        )
        .fromTo(
          panel.querySelectorAll("[data-signout-item]"),
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.18,
        );
    } else {
      tl.to(scrim, { opacity: 0, duration: 0.25 }, 0)
        .to(
          panel,
          { y: 16, scale: 0.97, opacity: 0, duration: 0.3, ease: "power3.in" },
          0,
        )
        .set([scrim, panel], { autoAlpha: 0 });
    }

    return () => {
      tl.kill();
    };
  }, [open]);

  useScrollLock(open);

  /* Wire Escape and move focus only while the dialog is up. */
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const dismiss = () => onClose();

  const confirm = () => {
    if (leaving) return;
    setLeaving(true);
    // Full navigation, not a router push: the route clears the cookie and then
    // hands off to Shopify's hosted logout on another origin.
    window.location.href = "/account/logout";
  };

  /*
    Portalled to <body>. The account section sets `clip-path` to let its blobs
    bleed behind the nav, and a clip-path on an ancestor clips *fixed* children
    too and makes that ancestor their containing block — rendered in place the
    dialog was trapped inside (and behind) the account panel no matter its
    z-index. z-90 keeps it above the cart drawer (z-80) and header.
  */
  const overlay = (
    <div
      className={cn("fixed inset-0 z-90", !open && "pointer-events-none")}
      /* `inert`, not `aria-hidden`: aria-hidden alone leaves the buttons in the
         tab order while the dialog is closed (axe: "aria-hidden elements
         contain focusable descendents"). inert removes them from focus, from
         the a11y tree and from hit-testing in one attribute. */
      inert={!open}
    >
      <div
        ref={scrimRef}
        onClick={dismiss}
        className="absolute inset-0 bg-ink/45 opacity-0 backdrop-blur-[3px]"
      />

      <div className="absolute inset-0 grid place-items-center p-5">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
          aria-describedby="signout-body"
          tabIndex={-1}
          className="relative w-full max-w-sm overflow-hidden rounded-panel bg-paper opacity-0 shadow-drift focus:outline-none"
        >
          {/* Sections never meet on a straight line — the panel opens on a
                blush lip instead of a flat header rule. */}
          <div className="relative h-24 bg-blush">
            <Blob
              shape="c"
              spin={18}
              className="pointer-events-none absolute -top-10 -left-12 w-48 text-rose-100"
            />
            <LineArt
              name="butterfly"
              className="pointer-events-none absolute top-4 right-5 w-14 -rotate-12 text-rose-300"
            />
            <span className="absolute bottom-0 left-1/2 z-10 grid size-16 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full border-4 border-paper bg-rose-600 text-paper shadow-lift">
              <Icon name="logout" className="size-6" strokeWidth={1.8} />
            </span>
            <WaveDivider
              className="absolute inset-x-0 bottom-0 text-paper"
              shape="swell"
              height={44}
            />
          </div>

          <div className="px-6 pt-12 pb-7 text-center">
            <h2
              id="signout-title"
              data-signout-item
              className="font-script text-3xl leading-tight text-rose-500"
            >
              Leaving so soon?
            </h2>
            <p
              id="signout-body"
              data-signout-item
              className="mx-auto mt-2 max-w-xs text-body-sm text-ink-soft"
            >
              Your orders, saved addresses and profile stay exactly where they
              are. Signing back in only takes a tap.
            </p>

            <div data-signout-item className="mt-7 flex flex-col-reverse gap-3">
              <button
                type="button"
                onClick={confirm}
                disabled={leaving}
                className="rounded-btn px-6 py-3 font-label text-[0.72rem] tracking-[0.16em] text-ink-faint uppercase transition-colors duration-300 ease-out-soft hover:text-rose-600 disabled:opacity-50"
              >
                {leaving ? "Signing you out…" : "Yes, sign me out"}
              </button>
              <Button onClick={dismiss} className="w-full justify-center">
                Stay signed in
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-paper/80 text-ink-soft backdrop-blur-sm transition-colors duration-300 hover:text-rose-600"
          >
            <Icon name="close" className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}

/** Shared label + icon for every sign-out trigger, so they stay in step. */
export function SignOutLabel() {
  return (
    <>
      <Icon name="logout" className="size-4 shrink-0" />
      Sign out
    </>
  );
}
