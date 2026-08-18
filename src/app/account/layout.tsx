import type { ReactNode } from "react";

import { AccountNav } from "@/components/account/AccountNav";
import { isSignedIn } from "@/lib/shopify/guard";

/**
 * Account shell. Signed-in members get the sticky account nav beside the page
 * content; sign-in/callback stay single-purpose (no nav).
 */
export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const signedIn = await isSignedIn();

  if (!signedIn) {
    return <>{children}</>;
  }

  return (
    <section className="relative -mt-(--nav-height) min-h-[70vh] bg-cream pt-[calc(var(--nav-height)+2.5rem)] pb-24">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <aside className="lg:sticky lg:top-[calc(var(--nav-height)+1.5rem)] lg:self-start">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
