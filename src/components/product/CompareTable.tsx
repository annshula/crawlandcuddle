import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { comparison } from "@/content/site";

/**
 * "Us vs. a typical head protector" — a generic category comparison (never a
 * named competitor, see content/site.ts's `comparison` doc comment). Sits
 * right after the hero, before QualityChecks: this is the first thing a
 * comparison-shopping parent asks — "how is this different from the other
 * one in my cart tabs?" — before the deeper QC trust band. `bg-paper` here
 * (the hero and QualityChecks are both `bg-cream`) keeps the three sections
 * from reading as one flat block.
 *
 * Two-column card on phones (each row stacks label/us/other), a real table
 * from sm up. The "us" column carries a rose check in a filled pill; the
 * "other" column stays quiet grey with a plain dash-style mark — same
 * hierarchy as SwatchPicker/PackPicker's selected-vs-not styling.
 */
export function CompareTable() {
  return (
    <section
      aria-labelledby="compare-heading"
      className="bg-paper py-16 md:py-24"
    >
      <div className="container-page">
        <SectionHeading
          id="compare-heading"
          align="center"
          eyebrow={comparison.eyebrow}
          title={[comparison.heading]}
          script={comparison.script}
          className="mx-auto"
        />

        <Reveal
          variant="up"
          className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-panel border border-hairline bg-cream shadow-drift lg:mt-16"
        >
          <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-hairline">
            <div className="p-4 sm:p-5" />
            <div className="flex items-center justify-center gap-1.5 border-x border-hairline bg-rose-50 p-4 text-center sm:p-5">
              <Icon
                name="shield"
                className="size-3.5 shrink-0 text-rose-600"
              />
              <span className="font-headline text-sm text-ink sm:text-base">
                {comparison.ourLabel}
              </span>
            </div>
            <div className="p-4 text-center text-body-sm text-ink-faint sm:p-5">
              {comparison.otherLabel}
            </div>
          </div>

          <ul>
            {comparison.rows.map((row) => (
              <li
                key={row.feature}
                className="grid grid-cols-[1fr_1fr_1fr] border-b border-hairline last:border-b-0 odd:bg-paper/60"
              >
                <div className="flex items-center p-4 font-headline text-sm text-ink sm:p-5">
                  {row.feature}
                </div>
                <div className="flex items-center gap-2 border-x border-hairline bg-rose-50/40 p-4 text-body-sm text-ink sm:p-5">
                  <Icon
                    name="check"
                    className="size-4 shrink-0 text-rose-600"
                    strokeWidth={2.4}
                  />
                  {row.us}
                </div>
                <div className="flex items-center gap-2 p-4 text-body-sm text-ink-faint sm:p-5">
                  <span
                    aria-hidden="true"
                    className="size-4 shrink-0 text-center leading-none text-ink-faint/70"
                  >
                    –
                  </span>
                  {row.other}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <p className="mx-auto mt-6 max-w-xl text-center text-body-sm text-ink-faint">
          Based on our own product specs against commonly sold alternatives in
          the category — always check the listing for the exact item
          you&apos;re comparing.
        </p>
      </div>
    </section>
  );
}
