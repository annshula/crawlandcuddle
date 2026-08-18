import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/motion/Reveal";

/**
 * The account area's page header. Uses the site's two-voice headline from
 * DESIGN.md — condensed all-caps display type over a handwritten script line —
 * so /account reads as the same brand as the storefront rather than a bolted-on
 * dashboard. Script is decoration only; the <h1> carries the real text.
 */
export function AccountHeader({
  eyebrow = "Your account",
  title,
  script,
  body,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  script?: string;
  body?: string;
  /** Trailing crumbs — "Home / Account" is always prepended. */
  crumbs?: Crumb[];
  children?: React.ReactNode;
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

      <Reveal variant="fade" duration={0.8}>
        <p className="eyebrow mt-6 flex items-center gap-3 text-rose-600">
          <span aria-hidden="true" className="inline-block h-px w-8 bg-rose-600/40" />
          {eyebrow}
        </p>
      </Reveal>

      <h1 className="mt-3 font-display text-heading text-ink uppercase">
        {title}
      </h1>

      {script && (
        <Reveal variant="up" delay={0.12}>
          <p
            aria-hidden="true"
            className="mt-2 font-script text-3xl leading-tight text-lilac-500 md:text-4xl"
          >
            {script}
          </p>
        </Reveal>
      )}

      {body && (
        <Reveal variant="up" delay={0.08}>
          <p className="mt-4 max-w-lg text-body text-ink-soft">{body}</p>
        </Reveal>
      )}

      {children}
    </header>
  );
}
