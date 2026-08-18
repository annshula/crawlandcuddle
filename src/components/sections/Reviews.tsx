import { LineArt } from "@/components/art/LineArt";
import { Marquee } from "@/components/motion/Marquee";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { reviews } from "@/content/site";

export function Reviews() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative overflow-hidden bg-cream py-20 md:py-28"
    >
      <LineArt
        name="cloud"
        className="pointer-events-none absolute top-16 left-8 hidden w-28 text-lilac-200 lg:block"
      />
      <LineArt
        name="moon"
        className="pointer-events-none absolute right-10 bottom-16 hidden w-20 text-rose-200 lg:block"
      />

      <div className="container-page relative z-10">
        <SectionHeading
          id="reviews-heading"
          eyebrow="From the nursery floor"
          title={["Parents who", "stopped hovering"]}
          script="4.9 out of 5, and counting"
          align="center"
        />
      </div>

      {/* Two rails moving in opposite directions — the section's own motion. */}
      <div className="relative z-10 mt-14 flex flex-col gap-6">
        <Marquee speed={58} fade>
          {reviews.map((review) => (
            <ReviewCard key={review.name} {...review} />
          ))}
        </Marquee>
        <Marquee speed={66} reverse fade>
          {[...reviews].reverse().map((review) => (
            <ReviewCard key={`${review.name}-b`} {...review} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function ReviewCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <figure className="mx-3 flex w-[20rem] shrink-0 flex-col justify-between gap-6 rounded-card border border-hairline bg-paper p-7 sm:w-[24rem]">
      <span className="flex gap-1 text-rose-500" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} name="star" className="size-4 fill-current" strokeWidth={1} />
        ))}
      </span>
      <blockquote className="text-body text-ink">“{quote}”</blockquote>
      <figcaption className="border-t border-hairline pt-4">
        <span className="block font-headline text-base text-ink">{name}</span>
        <span className="eyebrow mt-1 block text-ink-faint">{role}</span>
      </figcaption>
    </figure>
  );
}
