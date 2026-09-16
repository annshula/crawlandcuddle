import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { quality } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * "Put to the test" — the quality/QC trust band on the product page.
 * Modeled on AccuPenPro's QualityTests (reference/components/product/QualityTests.tsx):
 * one card per check, each with a "Pass" pill and an icon.
 */
export function QualityChecks() {
  return (
    <section
      id="quality-test"
      aria-labelledby="quality-heading"
      className="scroll-mt-24 bg-cream py-16 md:py-24"
    >
      <div className="container-page">
        <SectionHeading
          id="quality-heading"
          align="center"
          eyebrow={quality.eyebrow}
          title={[quality.heading]}
          body={quality.lede}
          className="mx-auto"
        />

        <Reveal
          as="ul"
          variant="up"
          stagger={0.06}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3"
        >
          {quality.checks.map((check) => (
            <li
              key={check.title}
              className={cn(
                "group relative overflow-hidden rounded-panel border border-hairline bg-paper p-6 shadow-drift transition-transform duration-500 ease-out-soft hover:-translate-y-1",
              )}
            >
              <span className="eyebrow absolute top-5 right-5 inline-flex items-center gap-1 rounded-tag bg-mint/40 px-2.5 py-1 text-[0.6rem] text-ink">
                <Icon name="check" className="size-2.5" strokeWidth={2.4} />
                Pass
              </span>
              <span className="grid size-10 place-items-center rounded-pill bg-rose-50 text-rose-600">
                <Icon name={check.icon} className="size-4.5" strokeWidth={1.6} />
              </span>
              <h3 className="mt-5 pr-14 font-headline text-base text-ink">
                {check.title}
              </h3>
              <p className="mt-2 text-body-sm text-ink-soft">{check.body}</p>
            </li>
          ))}
        </Reveal>

        <p className="mx-auto mt-8 max-w-2xl text-center text-body-sm text-ink-faint">
          Every check happens by hand before dispatch. The full spec is
          listed above, and care details are in the FAQ.
        </p>
      </div>
    </section>
  );
}
