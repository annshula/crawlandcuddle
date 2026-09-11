import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Blob } from "@/components/art/Blob";
import { LineArt } from "@/components/art/LineArt";
import { Reveal } from "@/components/motion/Reveal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { blogHref, posts } from "@/content/blog";
import { site } from "@/content/site";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog — Baby Safety, Milestones & Baby Proofing Guides",
  description:
    "Practical, pediatrician-informed guides on baby falls, head bump safety, crawling and walking milestones, and room-by-room baby proofing for parents of babies 5–24 months.",
  alternates: { canonical: "/blogs" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/blogs"),
    siteName: site.name,
    title: "Blog — Baby Safety, Milestones & Baby Proofing Guides",
    description:
      "Practical, pediatrician-informed guides on baby falls, head bump safety, crawling and walking milestones, and baby proofing.",
    locale: "en_US",
    images: [{ ...site.ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Baby Safety, Milestones & Baby Proofing Guides",
    description:
      "Practical, pediatrician-informed guides on baby falls, head bump safety, crawling and walking milestones, and baby proofing.",
    images: [{ ...site.ogImage }],
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogsPage() {
  const sorted = [...posts].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );
  const [featured, ...rest] = sorted;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": absoluteUrl("/blogs#posts"),
    name: "Crawl & Cuddle blog",
    numberOfItems: sorted.length,
    itemListElement: sorted.map((post, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(blogHref(post.slug)),
      name: post.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      <section
        style={{ clipPath: "inset(-160px 0 0 0)" }}
        className="relative -mt-(--nav-height) flex min-h-[60svh] flex-col justify-center bg-cream pt-[calc(var(--nav-height)+2.5rem)] pb-16 md:pb-20"
      >
        <Blob
          shape="d"
          spin={22}
          className="pointer-events-none absolute -top-28 -left-40 w-120 text-rose-50"
        />
        <Blob
          shape="a"
          spin={-18}
          className="pointer-events-none absolute -right-56 -bottom-40 w-136 text-lilac-100"
        />
        <LineArt
          name="heart"
          className="pointer-events-none absolute top-24 right-[6%] hidden w-16 rotate-6 text-rose-200 lg:block"
        />

        <div className="container-page relative z-10">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Blog" }]}
          />

          <p className="eyebrow mt-8 text-rose-600">{site.name} Journal</p>
          <h1 className="mt-4 max-w-3xl font-display text-heading text-ink uppercase">
            Baby safety, milestones &amp; baby proofing guides
          </h1>
          <p className="mt-5 max-w-2xl text-body text-ink-soft">
            Straight answers on head bumps, backward falls, crawling and walking
            milestones, and room-by-room baby proofing — written for the exact
            stage your little one is in right now.
          </p>
        </div>
      </section>

      {featured && (
        <section aria-label="Featured post" className="bg-paper py-14 md:py-16">
          <div className="container-page">
            <Link
              href={blogHref(featured.slug)}
              className="group grid gap-8 overflow-hidden rounded-panel bg-cream shadow-drift lg:grid-cols-2 lg:items-stretch"
            >
              <div className="relative aspect-16/10 w-full lg:aspect-auto">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <span className="eyebrow text-rose-600">
                  {featured.category} · Latest
                </span>
                <h2 className="mt-4 font-display text-heading-sm text-ink uppercase">
                  {featured.title}
                </h2>
                <p className="mt-4 max-w-lg text-body text-ink-soft">
                  {featured.description}
                </p>
                <div className="mt-6 flex items-center gap-4 text-body-sm text-ink-faint">
                  <time dateTime={featured.publishedAt}>
                    {formatDate(featured.publishedAt)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" className="size-4" />
                    {featured.readingMinutes} min read
                  </span>
                </div>
                <span className="link-underline mt-6 inline-flex w-fit items-center gap-2 font-label text-[0.72rem] tracking-[0.2em] text-rose-600 uppercase">
                  Read the guide
                  <Icon
                    name="arrow-right"
                    className="size-3.5 transition-transform duration-500 group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section aria-label="All posts" className="bg-cream py-16 md:py-20">
        <div className="container-page">
          <p className="eyebrow text-ink-faint">{posts.length} guides</p>

          <Reveal
            as="ul"
            variant="up"
            stagger={0.05}
            className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          >
            {rest.map((post) => (
              <li key={post.slug} className="group flex flex-col">
                <Link
                  href={blogHref(post.slug)}
                  className="flex flex-1 flex-col gap-4"
                >
                  <span className="relative block aspect-16/10 overflow-hidden rounded-panel bg-paper transition-shadow duration-500 ease-out-soft group-hover:shadow-drift">
                    <Image
                      src={post.image}
                      alt={post.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                      className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.05]"
                    />
                    <span className="eyebrow absolute top-3 left-3 rounded-tag bg-paper/90 px-2.5 py-1.5 text-[0.6rem] text-rose-600 backdrop-blur-sm">
                      {post.category}
                    </span>
                  </span>

                  <span className="flex flex-1 flex-col">
                    <span className="font-headline text-lg text-ink transition-colors group-hover:text-rose-600">
                      {post.title}
                    </span>
                    <span className="mt-2 flex-1 text-body-sm text-ink-soft">
                      {post.description}
                    </span>
                    <span className="mt-4 flex items-center gap-3 text-caption text-ink-faint">
                      <time dateTime={post.publishedAt}>
                        {formatDate(post.publishedAt)}
                      </time>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Icon name="clock" className="size-3.5" />
                        {post.readingMinutes} min
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
