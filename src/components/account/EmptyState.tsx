import type { ReactNode } from "react";

import { LineArt, type LineArtName } from "@/components/art/LineArt";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * The "nothing here yet" panel. Carries the same soft line-art decoration the
 * storefront sections use, so an empty account never looks like a broken page.
 */
export function EmptyState({
  icon,
  art = "sprig",
  title,
  script,
  body,
  children,
}: {
  icon: IconName;
  art?: LineArtName;
  title: string;
  script?: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-panel border border-hairline bg-paper px-6 py-14 text-center shadow-soft">
      <LineArt
        name={art}
        className="pointer-events-none absolute -top-4 -right-4 w-28 rotate-12 text-rose-100"
      />
      <span className="relative mx-auto grid size-14 place-items-center rounded-full bg-blush text-rose-500">
        <Icon name={icon} className="size-6" />
      </span>
      <p className="relative mt-5 font-display text-heading-sm text-ink uppercase">
        {title}
      </p>
      {script && (
        <p
          aria-hidden="true"
          className="relative mt-1 font-script text-2xl text-lilac-500"
        >
          {script}
        </p>
      )}
      <p className="relative mx-auto mt-3 max-w-sm text-body-sm text-ink-soft">
        {body}
      </p>
      {children && <div className="relative mt-6">{children}</div>}
    </div>
  );
}
