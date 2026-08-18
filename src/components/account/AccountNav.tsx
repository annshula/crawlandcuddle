"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
};

const items: NavItem[] = [
  { href: "/account", label: "Overview", icon: "user", exact: true },
  { href: "/account/orders", label: "Orders", icon: "package" },
  { href: "/account/addresses", label: "Addresses", icon: "map-pin" },
  { href: "/account/profile", label: "Profile", icon: "feather" },
];

/**
 * Account sidebar. Styled as one white panel on the cream canvas — the same
 * card language as the rest of the site — with the rose fill marking the
 * current page exactly like the "other styles" chips on a product page.
 * On small screens it becomes a horizontal chip rail so it never eats the fold.
 */
export function AccountNav() {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav aria-label="Account" className="w-full">
      <div className="rounded-panel border border-hairline bg-paper p-2 shadow-soft lg:p-3">
        <ul className="-mx-2 flex gap-1 overflow-x-auto px-2 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-tag px-4 py-3 font-label text-[0.72rem] tracking-[0.14em] whitespace-nowrap uppercase transition-colors duration-300 ease-out-soft",
                    active
                      ? "bg-rose-600 text-paper"
                      : "text-ink-soft hover:bg-blush hover:text-rose-700",
                  )}
                >
                  <Icon name={item.icon} className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-1 border-t border-hairline pt-1 lg:mt-2 lg:pt-2">
          <Link
            href="/account/logout"
            prefetch={false}
            className="flex items-center gap-2.5 rounded-tag px-4 py-3 font-label text-[0.72rem] tracking-[0.14em] text-ink-faint uppercase transition-colors duration-300 ease-out-soft hover:bg-rose-50 hover:text-rose-600"
          >
            <Icon name="logout" className="size-4 shrink-0" />
            Sign out
          </Link>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="mt-4 hidden pl-1 font-script text-2xl text-lilac-400 lg:block"
      >
        thanks for being here
      </p>
    </nav>
  );
}
