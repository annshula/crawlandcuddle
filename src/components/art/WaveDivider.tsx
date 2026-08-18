import { cn } from "@/lib/utils";

/**
 * Organic section boundary. Per DESIGN.md sections never meet on a straight
 * line — a single-colour wave path carries the colour of the section below.
 */
const shapes = {
  wave: "M0,64 C180,120 380,4 640,44 C900,84 1080,132 1280,88 C1360,70 1420,52 1440,44 L1440,160 L0,160 Z",
  swell:
    "M0,96 C220,20 420,140 720,96 C1020,52 1240,140 1440,72 L1440,160 L0,160 Z",
  drip: "M0,40 C160,40 200,120 360,120 C520,120 560,32 740,32 C920,32 960,124 1140,124 C1300,124 1340,48 1440,48 L1440,160 L0,160 Z",
} as const;

interface WaveDividerProps {
  /** Tailwind text-* class — the wave fills with currentColor. */
  className?: string;
  shape?: keyof typeof shapes;
  flip?: boolean;
  height?: number;
}

export function WaveDivider({
  className,
  shape = "wave",
  flip = false,
  height = 120,
}: WaveDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none w-full leading-0", className)}
      style={{ height }}
    >
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className={cn("h-full w-full", flip && "rotate-180")}
        focusable="false"
      >
        <path d={shapes[shape]} fill="currentColor" />
      </svg>
    </div>
  );
}
