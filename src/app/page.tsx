import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Milestones } from "@/components/sections/Milestones";
import { NewsletterCta } from "@/components/sections/NewsletterCta";
import { PeekingBaby } from "@/components/sections/PeekingBaby";
import { Reviews } from "@/components/sections/Reviews";
import { StyleGallery } from "@/components/sections/StyleGallery";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { WhyItWorks } from "@/components/sections/WhyItWorks";

/**
 * Section rhythm follows DESIGN.md: quiet cream -> white -> bold band ->
 * quiet cream -> dark footer, with organic wave dividers at every colour change.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Left peek: the child grips the left screen edge for the whole scroll
          from just past the hero down to the milestone band ("Every wobble has
          a season"), then retreats before it arrives. */}
      <div className="relative">
        <PeekingBaby side="left" />
        <TrustStrip />
        <StyleGallery />
        <WhyItWorks />
      </div>
      <Milestones />
      {/* Right peek: the mirrored child grips the right screen edge from the
          milestone band all the way down to the footer, stepping out of the
          way for the "From the nursery floor" review band. */}
      <div className="relative">
        <PeekingBaby side="right" hide={["#reviews"]} />
        <HowItWorks />
        <Reviews />
        <Faq />
        <NewsletterCta />
      </div>
    </>
  );
}
