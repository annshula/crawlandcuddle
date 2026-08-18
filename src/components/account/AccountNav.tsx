"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; exact?: boolean };

const items: NavItem[] = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav() {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav aria-label="Account" className="w-full">
      <ul className="grid grid-cols-3 gap-2 lg:flex lg:flex-col lg:gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "block rounded-tag px-4 py-3 text-center font-label text-[0.72rem] tracking-[0.14em] uppercase transition-colors duration-300 lg:text-left",
                isActive(item)
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink hover:bg-blush",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
        <li className="col-span-3 lg:mt-2 lg:border-t lg:border-hairline lg:pt-2">
          <Link
            href="/account/logout"
            prefetch={false}
            className="block rounded-tag px-4 py-3 text-center font-label text-[0.72rem] tracking-[0.14em] text-ink-soft uppercase transition-colors duration-300 hover:bg-rose-50 hover:text-rose-600 lg:text-left"
          >
            Sign out
          </Link>
        </li>
      </ul>
    </nav>
  );
}
