import { LineArt } from "@/components/art/LineArt";
import { Reveal } from "@/components/motion/Reveal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { trustBadges } from "@/content/site";

const icons: IconName[] = ["shield", "star", "gift", "feather"];

export function TrustStrip() {
  return (
    <section
      id="trust"
      aria-label="Product highlights"
      className="relative bg-paper py-14 md:py-20"
    >
      <LineArt
        name="sprig"
        className="pointer-events-none absolute -top-8 right-10 hidden w-24 rotate-[18deg] text-lilac-200 lg:block"
      />

      <div className="container-page">
        <Reveal variant="up" stagger={0.09}>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {trustBadges.map((badge, i) => (
              <li key={badge.label} className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
                  <Icon name={icons[i] ?? "check"} />
                </span>
                <span>
                  <span className="eyebrow block text-ink">{badge.label}</span>
                  <span className="mt-1.5 block text-body-sm text-ink-soft">
                    {badge.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
