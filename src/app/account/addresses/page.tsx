import type { Metadata } from "next";

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
      <p className="eyebrow flex items-center gap-3 text-rose-600">
        <span className="inline-block h-px w-8 bg-rose-600/40" />
        Your account
      </p>
      <h1 className="mt-3 font-display text-heading text-ink uppercase">
        Addresses
      </h1>
      <p className="mt-2 text-body text-ink-soft">
        Saved delivery and billing addresses on your account.
      </p>

      {addresses.length === 0 ? (
        <div className="mt-8 rounded-panel border border-hairline bg-paper px-6 py-14 text-center shadow-soft">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush text-rose-500">
            <Icon name="map-pin" className="size-6" />
          </span>
          <p className="mt-4 font-headline text-lg text-ink">
            No addresses saved yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-body-sm text-ink-soft">
            Your saved delivery addresses will appear here once you add one at
            checkout.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {addresses.map((address) => {
            const isDefault = address.id === defaultId;
            return (
              <li
                key={address.id}
                className={cn(
                  "rounded-panel border bg-paper p-6 shadow-soft",
                  isDefault ? "border-rose-300" : "border-hairline",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "flex items-center gap-2 font-label text-[0.62rem] tracking-[0.16em] uppercase",
                      isDefault ? "text-rose-600" : "text-ink-faint",
                    )}
                  >
                    {isDefault && <Icon name="check" className="size-4" />}
                    {isDefault ? "Default" : "Saved"}
                  </span>
                  <span className="grid size-9 place-items-center rounded-full bg-blush text-rose-600">
                    <Icon name="map-pin" className="size-4" />
                  </span>
                </div>
                <p className="mt-4 font-headline text-ink">
                  {address.firstName || "—"} {address.lastName || ""}
                </p>
                <p className="mt-1.5 text-body-sm text-ink-soft">
                  {address.formatted.length > 0
                    ? address.formatted.join(", ")
                    : [address.address1, address.address2, address.city]
                        .filter(Boolean)
                        .join(", ") || "No full address on file"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
