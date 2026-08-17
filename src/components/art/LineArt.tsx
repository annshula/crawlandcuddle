import { cn } from "@/lib/utils";

/**
 * Nursery line-art — the Pa'lais "botanical toile" layer re-drawn for a baby
 * brand. Stroke only, never filled, 1.5px weight, inherits currentColor.
 * Meant to bleed off section edges and overlap content, never to sit in a box.
 */

type LineArtName =
  | "butterfly"
  | "cloud"
  | "star"
  | "moon"
  | "rattle"
  | "teddy"
  | "pram"
  | "sprig"
  | "heart"
  | "footprints"
  | "bottle"
  | "sun";

const art: Record<LineArtName, React.ReactNode> = {
  butterfly: (
    <>
      <path d="M32 10c-6-8-18-9-23-2s0 18 10 21c-8 3-12 12-8 18s16 5 21-3" />
      <path d="M32 10c6-8 18-9 23-2s0 18-10 21c8 3 12 12 8 18s-16 5-21-3" />
      <path d="M32 10v40" />
      <path d="M32 10c-1-4-4-6-7-8M32 10c1-4 4-6 7-8" />
      <circle cx="24" cy="1.5" r="2" />
      <circle cx="40" cy="1.5" r="2" />
      <path d="M26 22c2 2 4 3 6 3s4-1 6-3" />
    </>
  ),
  cloud: (
    <>
      <path d="M14 40c-6 0-11-4-11-10s5-10 11-10c1-8 8-14 16-14 9 0 16 6 17 15 6 0 11 4 11 10s-5 9-11 9z" />
      <path d="M22 26c2-3 6-4 9-2" />
    </>
  ),
  star: (
    <path d="M28 2l7 16 17 2-12 12 3 17-15-8-15 8 3-17L4 20l17-2z" />
  ),
  moon: (
    <>
      <path d="M40 4a24 24 0 100 44A28 28 0 0140 4z" />
      <path d="M20 18c2 3 2 8 0 11" />
    </>
  ),
  rattle: (
    <>
      <circle cx="20" cy="20" r="15" />
      <path d="M20 8v24M8 20h24" />
      <path d="M30 31l12 12" />
      <rect x="40" y="41" width="12" height="8" rx="4" />
    </>
  ),
  teddy: (
    <>
      <circle cx="30" cy="30" r="18" />
      <circle cx="13" cy="13" r="8" />
      <circle cx="47" cy="13" r="8" />
      <circle cx="23" cy="27" r="2" />
      <circle cx="37" cy="27" r="2" />
      <ellipse cx="30" cy="36" rx="7" ry="5" />
      <path d="M30 36v4M26 43c2 2 6 2 8 0" />
    </>
  ),
  pram: (
    <>
      <path d="M6 30h34a18 18 0 00-18-18H6z" />
      <path d="M40 30V12a10 10 0 0110 10v8" />
      <path d="M6 30h44" />
      <circle cx="16" cy="44" r="6" />
      <circle cx="42" cy="44" r="6" />
      <path d="M50 30v8" />
    </>
  ),
  sprig: (
    <>
      <path d="M30 56V6" />
      <path d="M30 20c-8-2-13-8-14-16 9-1 15 4 14 16zM30 20c8-2 13-8 14-16-9-1-15 4-14 16z" />
      <path d="M30 38c-8-2-13-8-14-16 9-1 15 4 14 16zM30 38c8-2 13-8 14-16-9-1-15 4-14 16z" />
    </>
  ),
  heart: (
    <path d="M30 52S6 38 6 22C6 13 13 7 21 7c4 0 8 2 9 6 1-4 5-6 9-6 8 0 15 6 15 15 0 16-24 30-24 30z" />
  ),
  footprints: (
    <>
      <ellipse cx="17" cy="24" rx="9" ry="13" />
      <circle cx="10" cy="9" r="3" />
      <circle cx="17" cy="6" r="3.5" />
      <circle cx="24" cy="8" r="3" />
      <ellipse cx="43" cy="40" rx="9" ry="13" />
      <circle cx="36" cy="25" r="3" />
      <circle cx="43" cy="22" r="3.5" />
      <circle cx="50" cy="24" r="3" />
    </>
  ),
  bottle: (
    <>
      <path d="M22 4h12v8h-12z" />
      <path d="M20 12h16l3 8v32a6 6 0 01-6 6H23a6 6 0 01-6-6V20z" />
      <path d="M17 26h22M17 36h22" />
    </>
  ),
  sun: (
    <>
      <circle cx="30" cy="30" r="13" />
      <path d="M30 4v8M30 48v8M4 30h8M48 30h8M12 12l6 6M42 42l6 6M48 12l-6 6M18 42l-6 6" />
    </>
  ),
};

const viewBoxes: Partial<Record<LineArtName, string>> = {
  butterfly: "-2 -4 68 56",
  cloud: "0 0 60 44",
  star: "0 0 56 52",
  moon: "0 0 56 52",
  rattle: "0 0 56 52",
  teddy: "0 0 60 52",
  pram: "0 0 56 52",
  sprig: "0 0 60 60",
  heart: "0 0 60 56",
  footprints: "0 0 60 56",
  bottle: "0 0 56 60",
  sun: "0 0 60 60",
};

interface LineArtProps {
  name: LineArtName;
  className?: string;
  strokeWidth?: number;
}

export function LineArt({ name, className, strokeWidth = 1.5 }: LineArtProps) {
  return (
    <svg
      viewBox={viewBoxes[name] ?? "0 0 60 56"}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("h-full w-full", className)}
    >
      {art[name]}
    </svg>
  );
}

export type { LineArtName };
