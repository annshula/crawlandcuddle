import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Milestones } from "@/components/sections/Milestones";
import { NewsletterCta } from "@/components/sections/NewsletterCta";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
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
      <TrustStrip />
      <StyleGallery />
      <WhyItWorks />
      <Milestones />
      <HowItWorks />
      <ProductShowcase />
      <Reviews />
      <Faq />
      <NewsletterCta />
    </>
  );
}
