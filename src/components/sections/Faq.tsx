"use client";

import { useState } from "react";

import { LineArt } from "@/components/art/LineArt";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqs } from "@/content/site";
import { cn } from "@/lib/utils";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative overflow-hidden bg-paper section-y"
    >
      <LineArt
        name="bottle"
        className="pointer-events-none absolute top-24 right-8 hidden w-16 rotate-12 text-lilac-200 lg:block"
      />

      <div className="container-page relative z-10 grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <SectionHeading
          id="faq-heading"
          eyebrow="Good questions"
          title={["Everything", "parents ask"]}
          script="before the first wobble"
          className="lg:sticky lg:top-32 lg:self-start"
        />

        <Reveal variant="up" stagger={0.06}>
          <ul className="flex flex-col">
            {faqs.map((faq, i) => (
              <FaqItem
                key={faq.q}
                {...faq}
                isOpen={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="border-b border-hairline first:border-t">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="group flex w-full items-center justify-between gap-6 py-6 text-left"
        >
          <span
            className={cn(
              "font-headline text-lg transition-colors duration-300 md:text-xl",
              isOpen ? "text-rose-600" : "text-ink group-hover:text-rose-600",
            )}
          >
            {q}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "relative grid size-9 shrink-0 place-items-center rounded-full border transition-colors duration-300",
              isOpen
                ? "border-rose-600 bg-rose-600 text-paper"
                : "border-hairline text-ink group-hover:border-rose-600",
            )}
          >
            <span className="absolute h-px w-3.5 bg-current" />
            <span
              className={cn(
                "absolute h-3.5 w-px bg-current transition-transform duration-400 ease-out-soft",
                isOpen && "scale-y-0",
              )}
            />
          </span>
        </button>
      </h3>

      {/* grid-rows trick: animates to auto height without measuring in JS */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-500 ease-out-soft",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-7 text-body text-ink-soft">{a}</p>
        </div>
      </div>
    </li>
  );
}
