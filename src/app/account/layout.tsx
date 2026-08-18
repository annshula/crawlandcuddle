import type { ReactNode } from "react";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { AccountNav } from "@/components/account/AccountNav";
import { isSignedIn } from "@/lib/shopify/guard";

/**
 * Account shell. Signed-in members get the sticky account nav beside the page
 * content; sign-in/callback stay single-purpose (no nav).
 *
 * The section mirrors the product-page hero: cream canvas, blobs bleeding up
 * behind the transparent nav (clip-path, not overflow-hidden, so nothing spills
 * into the footer) and the same nav-height offset. Account pages are content-led
 * so this one grows from its content instead of pinning to a full viewport.
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
    <section
      style={{ clipPath: "inset(-160px 0 0 0)" }}
      className="relative -mt-(--nav-height) min-h-[70vh] overflow-x-clip bg-cream pt-[calc(var(--nav-height)+2.5rem)] pb-20 md:pb-28"
    >
      <Blob
        shape="d"
        spin={22}
        className="pointer-events-none absolute -top-28 -left-40 w-120 text-rose-50"
      />
      <Blob
        shape="a"
        spin={-18}
        className="pointer-events-none absolute -right-56 -bottom-40 w-136 text-lilac-100"
      />
      <LineArt
        name="butterfly"
        className="pointer-events-none absolute top-24 right-[6%] hidden w-16 rotate-6 text-rose-200 lg:block"
      />

      <div className="container-page relative z-10">
        {/* Both tracks are minmax(0,…): a grid item defaults to min-width:auto,
            which lets a wide child (the scrolling nav rail) push the whole
            page sideways on a phone instead of scrolling inside itself. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <aside className="min-w-0 lg:sticky lg:top-[calc(var(--nav-height)+1.5rem)] lg:self-start">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
