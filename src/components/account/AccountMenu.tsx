"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  SignOutDialog,
  SignOutLabel,
} from "@/components/account/SignOutDialog";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type AccountLink = { href: string; label: string; icon: IconName };

const LINKS: AccountLink[] = [
  { href: "/account", label: "Account", icon: "user" },
  { href: "/account/orders", label: "Orders", icon: "package" },
  { href: "/account/addresses", label: "Addresses", icon: "map-pin" },
];

/**
 * Header account entry point.
 *
 * `dropdown` (desktop): a circular user-icon button that opens a menu with
 * Account / Orders / Addresses / Sign out when signed in, or the same
 * cart-style user icon (no label) that routes to the Shopify Customer Account
 * flow when signed out.
 *
 * `list` (mobile drawer): a vertical stack of the same destinations.
 *
 * Sign-in state is probed from `/api/account/session` on mount and whenever
 * the route changes, so it stays correct after login/logout redirects.
 */
export function AccountMenu({
  variant = "dropdown",
  className,
}: {
  variant?: "dropdown" | "list";
  className?: string;
}) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* The dropdown unmounts on close, so the confirmation is rendered from this
     component's root instead — closing the menu must not kill the dialog. */
  const askSignOut = () => {
    setOpen(false);
    setSignOutOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/session")
      .then((res) => (res.ok ? res.json() : { signedIn: false }))
      .then((data: { signedIn?: boolean }) => {
        if (!cancelled) setSignedIn(Boolean(data.signedIn));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  /* Close the dropdown on outside click or Escape. */
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const linkRow = (link: AccountLink, tone: "dark" | "light") => (
    <Link
      key={link.href}
      href={link.href}
      role="menuitem"
      onClick={() => setOpen(false)}
      className={cn(
        "flex items-center gap-2.5 font-label text-[0.72rem] tracking-[0.14em] uppercase transition-colors duration-200",
        tone === "dark"
          ? "rounded-tag px-3 py-2.5 text-ink hover:bg-blush"
          : "rounded-xl px-2 py-3 text-paper/90 hover:bg-paper/10 hover:text-paper",
      )}
    >
      <Icon
        name={link.icon}
        className={cn(
          "size-4 shrink-0",
          tone === "dark" ? "text-rose-600" : "text-rose-200",
        )}
      />
      {link.label}
    </Link>
  );

  /* ── Mobile drawer: vertical stack ─────────────────────────────────── */
  if (variant === "list") {
    return (
      <div className={cn("flex flex-col", className)}>
        <p className="px-2 pb-1 font-label text-[0.62rem] tracking-[0.2em] text-rose-200/70 uppercase">
          {signedIn ? "Your account" : "Account"}
        </p>
        {signedIn ? (
          <>
            {LINKS.map((link) => linkRow(link, "light"))}
            <button
              type="button"
              onClick={askSignOut}
              className="flex items-center gap-2.5 rounded-xl px-2 py-3 font-label text-[0.72rem] tracking-[0.14em] text-rose-200/70 uppercase transition-colors duration-200 hover:bg-paper/10 hover:text-rose-200"
            >
              <SignOutLabel />
            </button>
          </>
        ) : (
          <Button
            href="/account/login"
            withArrow
            className="mt-1 justify-center"
            onClick={() => setOpen(false)}
          >
            Sign in
          </Button>
        )}

        <SignOutDialog
          open={signOutOpen}
          onClose={() => setSignOutOpen(false)}
        />
      </div>
    );
  }

  /* ── Desktop: icon button + dropdown, or a cart-style Sign-in icon ── */
  if (signedIn === false) {
    return (
      <Link
        href="/account/login"
        aria-label="Sign in"
        className="hidden size-11 place-items-center rounded-full border border-ink/15 text-ink transition-colors duration-300 hover:border-rose-600 hover:text-rose-600 sm:grid"
      >
        <Icon name="user" />
      </Link>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Your account"
        className="grid size-11 place-items-center rounded-full border border-ink/15 text-ink transition-colors duration-300 hover:border-rose-600 hover:text-rose-600"
      >
        <Icon name="user" />
      </button>

      {open && signedIn && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-panel border border-hairline bg-paper p-1.5 shadow-lift"
        >
          <div className="px-3 pt-2 pb-1.5">
            <p className="eyebrow text-rose-600">My account</p>
          </div>
          <div className="flex flex-col">
            {LINKS.map((link) => linkRow(link, "dark"))}
          </div>
          <div className="mt-1.5 border-t border-hairline pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={askSignOut}
              className="flex w-full items-center gap-2.5 rounded-tag px-3 py-2.5 font-label text-[0.72rem] tracking-[0.14em] text-ink-soft uppercase transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <SignOutLabel />
            </button>
          </div>
        </div>
      )}

      <SignOutDialog open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </div>
  );
}
