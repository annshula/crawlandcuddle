import type { Metadata } from "next";

import { AccountHeader } from "@/components/account/AccountHeader";
import { EmptyState } from "@/components/account/EmptyState";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getCustomer } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Addresses — Crawl & Cuddle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  await requireCustomer("/account/addresses");

  const customer = await getCustomer();
  const addresses = customer.addresses;
  const defaultId = customer.defaultAddressId;

  return (
    <div className="min-w-0">
      <AccountHeader
        title="Addresses"
        script="where the box lands"
        body="Saved delivery and billing addresses on your account."
        crumbs={[{ label: "Addresses" }]}
      />

      {addresses.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon="map-pin"
            art="cloud"
            title="No addresses yet"
            script="add one at checkout"
            body="Your saved delivery addresses will appear here once you add one at checkout."
          >
            <Button href="/products" withArrow>
              Browse the range
            </Button>
          </EmptyState>
        </div>
      ) : (
        <Reveal
          as="ul"
          variant="up"
          stagger={0.06}
          className="mt-10 grid gap-4 md:grid-cols-2"
        >
          {addresses.map((address) => {
            const isDefault = address.id === defaultId;
            return (
              <li
                key={address.id}
                className={cn(
                  "rounded-panel border bg-paper p-6 shadow-soft transition-shadow duration-500 ease-out-soft hover:shadow-drift",
                  isDefault ? "border-rose-300" : "border-hairline",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-tag px-3 py-1.5 font-label text-[0.62rem] tracking-[0.16em] uppercase",
                      isDefault
                        ? "bg-rose-50 text-rose-600"
                        : "bg-ink/5 text-ink-faint",
                    )}
                  >
                    {isDefault && <Icon name="check" className="size-3.5" />}
                    {isDefault ? "Default" : "Saved"}
                  </span>
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full",
                      isDefault
                        ? "bg-blush text-rose-600"
                        : "bg-lilac-100 text-lilac-600",
                    )}
                  >
                    <Icon name="map-pin" className="size-4" />
                  </span>
                </div>

                <p className="mt-5 font-headline text-lg text-ink">
                  {[address.firstName, address.lastName]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </p>
                <p className="mt-2 text-body-sm whitespace-pre-line text-ink-soft">
                  {address.formatted.length > 0
                    ? address.formatted.join("\n")
                    : [address.address1, address.address2, address.city]
                        .filter(Boolean)
                        .join(", ") || "No full address on file"}
                </p>
              </li>
            );
          })}
        </Reveal>
      )}
    </div>
  );
}
