import type { Metadata } from "next";

import { ProfileForm } from "@/components/account/ProfileForm";
import { getCustomer } from "@/lib/shopify/customer-service";
import { requireCustomer } from "@/lib/shopify/guard";

export const metadata: Metadata = {
  title: "Your profile — Crawl & Cuddle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requireCustomer("/account/profile");
  const customer = await getCustomer();

  return (
    <div className="min-w-0">
      <p className="eyebrow flex items-center gap-3 text-rose-600">
        <span className="inline-block h-px w-8 bg-rose-600/40" />
        Your account
      </p>
      <h1 className="mt-3 font-display text-heading text-ink uppercase">
        Profile
      </h1>

      <div className="mt-8 grid gap-6 lg:max-w-2xl">
        <ProfileForm
          firstName={customer.firstName}
          lastName={customer.lastName}
        />

        <div className="rounded-panel border border-hairline bg-paper p-6 shadow-soft">
          <h2 className="font-display text-heading-sm text-ink uppercase">
            Contact details
          </h2>
          <dl className="mt-4 space-y-3 text-body-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Email</dt>
              <dd className="text-ink">{customer.emailAddress ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Phone</dt>
              <dd className="text-ink">{customer.phoneNumber ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-caption text-ink-faint">
            Email and phone are managed as part of your secure customer account
            and change through a verified flow.
          </p>
        </div>
      </div>
    </div>
  );
}
