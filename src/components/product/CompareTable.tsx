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
 * On phones each row stacks — feature name, then "C&C:"/"Others:" as their
 * own labelled lines — instead of squeezing a 3-column table into a narrow
 * width; from sm up it becomes the real 3-column table with its own header
 * row. The "us" side carries a rose check; the "other" side stays quiet grey
 * with a plain dash-style mark — same hierarchy as SwatchPicker/PackPicker's
 * selected-vs-not styling.
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
          {/* Column header row — only makes sense once there are columns to
              label, so it's sm-and-up only. On phones each row below carries
              its own "Crawl & Cuddle" / "Typical" labels instead (see the
              stacked layout there), since a 3-column header crammed onto a
              phone width was the thing actually breaking here. */}
          <div className="hidden border-b border-hairline sm:grid sm:grid-cols-[1fr_1fr_1fr]">
            <div className="p-5" />
            <div className="flex items-center justify-center gap-1.5 border-x border-hairline bg-rose-50 p-5 text-center">
              <Icon
                name="shield"
                className="size-3.5 shrink-0 text-rose-600"
              />
              <span className="font-headline text-base text-ink">
                {comparison.ourLabel}
              </span>
            </div>
            <div className="p-5 text-center text-body-sm text-ink-faint">
              {comparison.otherLabel}
            </div>
          </div>

          <ul>
            {comparison.rows.map((row) => (
              <li
                key={row.feature}
                className="border-b border-hairline p-4 last:border-b-0 odd:bg-paper/60 sm:grid sm:grid-cols-[1fr_1fr_1fr] sm:p-0"
              >
                {/* Phone: the feature name leads, then each side stacks as
                    its own labelled line — the row reads top to bottom
                    instead of three squeezed columns. From sm up this
                    collapses back into the real 3-column table. */}
                <div className="font-headline text-sm text-ink sm:flex sm:items-center sm:p-5">
                  {row.feature}
                </div>
                <div className="mt-2 flex items-center gap-2 text-body-sm text-ink sm:mt-0 sm:border-x sm:border-hairline sm:bg-rose-50/40 sm:p-5">
                  <Icon
                    name="check"
                    className="size-4 shrink-0 text-rose-600"
                    strokeWidth={2.4}
                  />
                  <span className="font-label text-[0.62rem] tracking-widest text-rose-600 uppercase sm:hidden">
                    C&amp;C:
                  </span>
                  {row.us}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-body-sm text-ink-faint sm:mt-0 sm:p-5">
                  <span
                    aria-hidden="true"
                    className="size-4 shrink-0 text-center leading-none text-ink-faint/70"
                  >
                    –
                  </span>
                  <span className="font-label text-[0.62rem] tracking-widest text-ink-faint uppercase sm:hidden">
                    Others:
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
