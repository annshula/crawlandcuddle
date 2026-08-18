import { LineArt } from "@/components/art/LineArt";
import { Reveal } from "@/components/motion/Reveal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { hero, trustBadges } from "@/content/site";

const icons: IconName[] = ["shield", "star", "gift", "feather"];

/**
 * The hero's headline stats (10 styles / 190 g / 5–24 m) land here instead —
 * out of the one-screen fold, given room to breathe as a proper stat row,
 * paired with the four trust badges underneath.
 */
export function TrustStrip() {
  return (
    <section
      id="trust"
      aria-label="Product highlights"
      className="relative overflow-hidden bg-paper py-14 md:py-20"
    >
      <LineArt
        name="butterfly"
        className="pointer-events-none absolute -top-8 right-10 hidden w-24 rotate-18 text-lilac-200 lg:block"
      />

      <div className="container-page">
        <Reveal
          as="dl"
          variant="up"
          stagger={0.08}
          className="grid grid-cols-3 divide-x divide-hairline overflow-hidden rounded-panel bg-cream"
        >
          {hero.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1.5 px-3 py-7 text-center sm:gap-2 sm:py-9"
            >
              <dd className="font-mega text-[clamp(1.8rem,5vw,3.25rem)] leading-none font-black text-rose-600">
                {stat.value}
              </dd>
              <dt className="eyebrow text-ink-faint">{stat.label}</dt>
            </div>
          ))}
        </Reveal>

        <Reveal
          as="ul"
          variant="up"
          stagger={0.09}
          delay={0.1}
          className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
        >
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
        </Reveal>
      </div>
    </section>
  );
}
