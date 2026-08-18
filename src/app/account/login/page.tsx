import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { isCustomerAccountConfigured } from "@/lib/shopify/config";
import { isSignedIn } from "@/lib/shopify/guard";

export const metadata: Metadata = {
  title: "Sign in — Crawl & Cuddle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again whenever you are ready.",
  expired: "That sign-in link expired. Please start again.",
  state_mismatch:
    "We could not verify that sign-in request. Please start again.",
  nonce_mismatch:
    "We could not verify that sign-in request. Please start again.",
  exchange_failed:
    "We could not complete the sign-in. Please try again in a moment.",
  missing_code: "The sign-in response was incomplete. Please try again.",
  unconfigured:
    "Sign-in is not connected to the store yet — please check your Shopify settings.",
  provider: "We could not complete the sign-in. Please try again in a moment.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (await isSignedIn()) redirect("/account");

  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = rawError
    ? (ERROR_MESSAGES[rawError] ?? ERROR_MESSAGES.provider)
    : null;

  const rawReturnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : "/account";

  return (
    <section
      style={{ clipPath: "inset(-160px 0 0 0)" }}
      className="relative -mt-(--nav-height) min-h-[70vh] bg-cream pt-[calc(var(--nav-height)+2.5rem)] pb-24"
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
        <div className="mx-auto max-w-md pt-10 text-center">
          <span className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-blush text-rose-600">
            <Icon name="shield" className="size-7" />
          </span>
          <h1 className="font-script text-[clamp(2.75rem,2rem+3vw,4.5rem)] leading-[1.05] text-rose-500">
            Sign in
          </h1>
          <p className="mx-auto mt-1 text-body text-ink-soft">
            See your orders, track deliveries and manage your profile. No
            password is stored by this site — sign-in runs through a secure,
            encrypted flow handled by our store provider.
          </p>

          {errorMessage && (
            <div className="mt-6 rounded-panel border border-rose-200 bg-rose-50 px-5 py-4 text-left">
              <p className="text-body-sm text-rose-700">{errorMessage}</p>
            </div>
          )}

          {!isCustomerAccountConfigured() ? (
            <div className="mt-8 rounded-panel border border-hairline bg-paper px-6 py-8 text-left shadow-soft">
              <p className="font-headline text-lg text-ink">
                Accounts are not connected yet
              </p>
              <p className="mt-2 text-body-sm text-ink-soft">
                Sign-in is not available on this store yet. You can still browse
                and check out as normal.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <Button
                href={`/account/authorize?returnTo=${encodeURIComponent(returnTo)}`}
                withArrow
                className="w-full justify-center"
              >
                Continue securely
              </Button>
            </div>
          )}

          <div className="mt-8 flex gap-3 rounded-panel border border-hairline bg-paper p-4 text-left shadow-soft">
            <Icon
              name="shield"
              className="mt-0.5 size-5 shrink-0 text-rose-600"
            />
            <p className="text-body-sm leading-relaxed text-ink-soft">
              Sign-in uses a secure, encrypted flow handled by our payment and
              accounts provider. Your credentials never reach this site.
            </p>
          </div>

          <p className="mt-8 text-center text-caption text-ink-faint">
            By continuing you agree to our{" "}
            <Link href="/" className="underline underline-offset-4">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/" className="underline underline-offset-4">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
