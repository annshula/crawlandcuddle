import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/utils";

/**
 * The account area's page header. The title is set in the handwritten script
 * voice from DESIGN.md — the account area is the warm, personal corner of the
 * site, so it leads with the script rather than the condensed display caps used
 * for storefront selling sections.
 */
export function AccountHeader({
  eyebrow,
  title,
  body,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  /** Trailing crumbs — "Home / Account" is always prepended. */
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <header className="min-w-0">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          ...(crumbs ?? []),
        ]}
      />

      {eyebrow && (
        <Reveal variant="fade" duration={0.8}>
          <p className="eyebrow mt-6 flex items-center gap-3 text-rose-600">
            <span
              aria-hidden="true"
              className="inline-block h-px w-8 bg-rose-600/40"
            />
            {eyebrow}
          </p>
        </Reveal>
      )}

      <h1
        className={cn(
          "font-script text-[clamp(2.75rem,2rem+3vw,4.5rem)] leading-[1.05] text-rose-500",
          eyebrow ? "mt-3" : "mt-6",
        )}
      >
        {title}
      </h1>

      {body && (
        <Reveal variant="up" delay={0.08}>
          <p className="mt-1 text-body text-ink-soft">{body}</p>
        </Reveal>
      )}

      {children}
    </header>
  );
}
