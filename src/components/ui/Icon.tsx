import { cn } from "@/lib/utils";

type IconName =
  | "arrow-right"
  | "arrow-down"
  | "shield"
  | "gift"
  | "globe"
  | "check"
  | "plus"
  | "star"
  | "feather"
  | "leaf"
  | "menu"
  | "close"
  | "bag"
  | "minus"
  | "user"
  | "package"
  | "map-pin"
  | "logout"
  | "trash"
  | "chevron-down";

const glyphs: Record<IconName, React.ReactNode> = {
  "arrow-right": <path d="M4 12h16m0 0-6-6m6 6-6 6" />,
  "arrow-down": <path d="M12 4v16m0 0 6-6m-6 6-6-6" />,
  shield: (
    <>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.9 7.5 9 4.3-1.1 7.5-4.5 7.5-9V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  gift: (
    <>
      <path d="M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M2.5 7.5h19V11h-19zM12 7.5V21" />
      <path d="M12 7.5S10.8 3 8.2 3a2.3 2.3 0 0 0 0 4.5zM12 7.5S13.2 3 15.8 3a2.3 2.3 0 0 1 0 4.5z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  plus: <path d="M12 5v14M5 12h14" />,
  star: (
    <path d="m12 3 2.7 6.1 6.3.7-4.7 4.3 1.3 6.4L12 17.3 6.4 20.5l1.3-6.4L3 9.8l6.3-.7z" />
  ),
  feather: (
    <>
      <path d="M20.2 3.8c-2.6-2.6-8.2-1-11.6 2.4C5.6 9.4 5 14 5 19l14-14c.7-.4 1.6-.6 1.2-1.2z" />
      <path d="M5 19 3 21M14 8l-6 6M18 9h-6" />
    </>
  ),
  leaf: (
    <>
      <path d="M4 20c0-9 5-15 16-16 0 11-6 16-14 16H4z" />
      <path d="M4 20C7 15 11 11 16 8.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  bag: (
    <>
      <path d="M4.5 8h15l-1 12.5a1 1 0 0 1-1 .9H6.5a1 1 0 0 1-1-.9z" />
      <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
      <path d="M6.6 7.8 7.5 20a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l.9-12.2" />
      <path d="M10.5 11.2v6M13.5 11.2v6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  package: (
    <>
      <path d="m4 8 8-4 8 4-8 4-8-4z" />
      <path d="M4 8v8l8 4 8-4V8" />
      <path d="M12 12v8" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
};

interface IconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("size-5", className)}
    >
      {glyphs[name]}
    </svg>
  );
}

export type { IconName };
