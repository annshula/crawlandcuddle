import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { FooterWave } from "@/components/layout/FooterWave";
import { Reveal } from "@/components/motion/Reveal";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { footerLinks, site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="relative">
      {/* Wave carries the footer colour; its backing strip adapts to the
          section above so the transition is seamless on every page. */}
      <FooterWave />

      <div className="paper-grain relative overflow-hidden bg-lilac-700 text-paper">
        <Blob
          shape="c"
          spin={40}
          className="pointer-events-none absolute top-0 right-0 w-136 text-lilac-600/40"
        />
        <LineArt
          name="butterfly"
          className="pointer-events-none absolute bottom-10 -left-6 w-40 rotate-12 text-lilac-300/25"
        />
        <LineArt
          name="star"
          className="pointer-events-none absolute top-24 left-1/3 w-12 text-rose-200/25"
        />

        <div className="container-page relative z-10 pt-20 pb-10">
          <div className="grid gap-14 lg:grid-cols-[1.4fr_2fr]">
            <Reveal variant="up">
              <div className="flex flex-col gap-6">
                <Logo tone="light" className="h-16" />
                <p className="max-w-sm text-body text-paper/70">
                  {site.description}
                </p>
                <p className="font-script text-3xl text-rose-200">
                  {site.tagline}
                </p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2">
                  {site.socials.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        rel="noopener noreferrer me"
                        target="_blank"
                        className="link-underline font-label text-[0.7rem] tracking-[0.2em] text-paper/80 uppercase"
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal variant="up" delay={0.1} stagger={0.08}>
              <div className="grid gap-10 sm:grid-cols-3">
                {footerLinks.map((column) => (
                  <div key={column.title}>
                    <h3 className="eyebrow text-rose-200">{column.title}</h3>
                    <ul className="mt-5 flex flex-col gap-3">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            className="link-underline text-body-sm text-paper/75 transition-colors duration-300 hover:text-paper"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="mt-16 border-t border-paper/15 pt-8">
            <p className="font-display text-[clamp(2.5rem,11vw,9rem)] leading-[0.85] tracking-[0.02em] text-paper/10 uppercase select-none">
              Crawl &amp; Cuddle
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-6 text-body-sm text-paper/60 md:flex-row md:items-center md:justify-between">
            <p>
              © {year} {site.legalName}. All rights reserved.
            </p>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {/* <li className="flex items-center gap-2">
                <Icon name="globe" className="size-4" />
                {site.domain}
              </li> */}
              <li className="flex items-center gap-2">
                <Icon name="shield" className="size-4" />
                Trusted by parents
              </li>
              <li className="flex items-center gap-2">
                <Icon name="gift" className="size-4" />
                Free gift included
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
