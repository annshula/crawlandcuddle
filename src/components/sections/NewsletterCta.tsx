"use client";

import { useState, type FormEvent } from "react";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { SplitLines } from "@/components/motion/SplitLines";
import { Icon } from "@/components/ui/Icon";

type Status = "idle" | "done";

export function NewsletterCta() {
  const [status, setStatus] = useState<Status>("idle");

  /* No backend yet — swap this for a server action when the ESP is chosen. */
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("done");
  };

  return (
    <section className="relative overflow-hidden bg-blush py-20 md:py-28">
      <Blob
        shape="a"
        spin={15}
        className="pointer-events-none absolute top-0 left-0 w-120 text-petal/40"
      />
      <Blob
        shape="d"
        spin={-30}
        className="pointer-events-none absolute right-0 bottom-0 w-lg text-lilac-200/60"
      />
      <LineArt
        name="butterfly"
        className="pointer-events-none absolute top-12 right-1/4 hidden w-20 text-rose-400/50 animate-wobble lg:block"
      />

      <div className="container-page relative z-10 max-w-3xl text-center">
        <Reveal variant="fade">
          <p className="eyebrow text-rose-600">Join the cuddle club</p>
        </Reveal>

        <h2 className="mt-6 font-mega text-heading-lg font-black text-ink">
          <SplitLines
            lines={["Get 10% off", "the first landing"]}
            className="text-center"
          />
        </h2>

        <Reveal variant="up" delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-body text-ink-soft">
            Milestone tips from paediatric physiotherapists, first look at new
            styles, and a code for your first order. One email a month — never
            more.
          </p>
        </Reveal>

        <Reveal variant="up" delay={0.15}>
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-14 flex-1 rounded-card border border-hairline bg-paper px-5 text-body text-ink placeholder:text-ink-faint focus:border-rose-500 focus:outline-none"
            />
            <Magnetic strength={0.2}>
              <button
                type="submit"
                className="btn-primary group/btn h-14 w-full sm:w-auto"
              >
                <span>{status === "done" ? "You're in" : "Join"}</span>
                <Icon
                  name={status === "done" ? "check" : "arrow-right"}
                  className="size-4 transition-transform duration-500 group-hover/btn:translate-x-1"
                />
              </button>
            </Magnetic>
          </form>
        </Reveal>

        <p aria-live="polite" className="mt-4 text-body-sm text-ink-soft">
          {status === "done"
            ? "Thanks — check your inbox for the code."
            : "No spam. Unsubscribe in one click."}
        </p>
      </div>
    </section>
  );
}
