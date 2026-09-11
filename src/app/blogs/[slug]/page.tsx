import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Blob } from "@/components/art/Blob";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import {
  blogHref,
  getPost,
  getRelatedPosts,
  posts,
  type BlogPost,
} from "@/content/blog";
import { site, variants } from "@/content/site";
import { absoluteUrl } from "@/lib/utils";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const title = post.metaTitle ?? post.title;

  return {
    title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: blogHref(slug) },
    authors: [{ name: post.author }],
    openGraph: {
      type: "article",
      url: absoluteUrl(blogHref(slug)),
      siteName: site.name,
      title,
      description: post.description,
      locale: "en_US",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      images: [
        { url: post.image, width: 1200, height: 750, alt: post.imageAlt },
        { ...site.ogImage },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
      images: [
        { url: post.image, width: 1200, height: 750, alt: post.imageAlt },
        { ...site.ogImage },
      ],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildJsonLd(post: BlogPost, slug: string) {
  const url = absoluteUrl(blogHref(slug));

  const article = {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    image: [absoluteUrl(post.image)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: site.legalName,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category,
    keywords: post.keywords.join(", "),
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteUrl("/blogs"),
      },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [article, breadcrumb, faqPage],
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);
  const spotlightVariant = variants.find((v) => v.featured) ?? variants[0];
  const jsonLd = buildJsonLd(post, slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* --- header --- */}
      <section
        style={{ clipPath: "inset(-160px 0 0 0)" }}
        className="relative -mt-(--nav-height) bg-cream pt-[calc(var(--nav-height)+2.5rem)] pb-14 md:pb-16"
      >
        <Blob
          shape="c"
          spin={20}
          className="pointer-events-none absolute -top-32 -right-48 w-xl text-lilac-100"
        />

        <div className="container-page relative z-10 max-w-3xl">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blogs" },
              { label: post.category },
            ]}
          />

          <p className="eyebrow mt-8 text-rose-600">{post.category}</p>
          <h1 className="mt-4 font-display text-heading text-ink uppercase">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-body-sm text-ink-faint">
            <span>{post.author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Icon name="clock" className="size-4" />
              {post.readingMinutes} min read
            </span>
          </div>
        </div>
      </section>

      {/* --- hero image --- */}
      <div className="container-page -mt-6 md:-mt-10">
        <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-panel shadow-drift">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 56rem, 92vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* --- body --- */}
      <article className="bg-paper py-14 md:py-20">
        <div className="container-page mx-auto max-w-3xl">
          {/* Direct-answer lede — first thing on the page for skimmers,
              featured snippets and AI answer engines alike. */}
          <p className="rounded-panel bg-cream px-6 py-5 text-body-lg text-ink">
            {post.answer}
          </p>

          <div className="prose-content mt-10 flex flex-col gap-10">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-headline text-xl text-ink md:text-2xl">
                  {section.heading}
                </h2>
                <div className="mt-4 flex flex-col gap-4">
                  {section.body.map((para, i) => (
                    <p key={i} className="text-body text-ink-soft">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* --- product mention --- */}
          {spotlightVariant && (
            <div className="mt-14 flex flex-col items-center gap-6 rounded-panel bg-cream p-8 text-center md:flex-row md:text-left">
              <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-card">
                <Image
                  src={spotlightVariant.image}
                  alt={`${spotlightVariant.name} baby head protector backpack`}
                  fill
                  sizes="8rem"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="eyebrow text-rose-600">{site.name}</p>
                <h3 className="mt-2 font-headline text-lg text-ink">
                  A soft head &amp; back cushion for exactly this stage
                </h3>
                <p className="mt-2 max-w-md text-body-sm text-ink-soft">
                  190 g, breathable 3D mesh, adjustable from 5 to 24 months —
                  built around the backward-fall pattern this article covers.
                </p>
                <Link
                  href="/products"
                  className="link-underline mt-4 inline-flex items-center gap-2 font-label text-[0.72rem] tracking-[0.2em] text-rose-600 uppercase"
                >
                  Shop all ten styles
                  <Icon name="arrow-right" className="size-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* --- FAQ --- */}
          {post.faqs.length > 0 && (
            <div className="mt-14">
              <h2 className="font-headline text-xl text-ink md:text-2xl">
                Frequently asked questions
              </h2>
              <ul className="mt-4 flex flex-col">
                {post.faqs.map((faq) => (
                  <li
                    key={faq.q}
                    className="border-b border-hairline py-6 first:border-t first:pt-6"
                  >
                    <h3 className="font-headline text-base text-ink">
                      {faq.q}
                    </h3>
                    <p className="mt-2 text-body-sm text-ink-soft">{faq.a}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>

      {/* --- related --- */}
      {related.length > 0 && (
        <section
          aria-labelledby="related-posts-heading"
          className="bg-cream py-16 md:py-20"
        >
          <div className="container-page">
            <div className="flex items-end justify-between gap-6">
              <h2
                id="related-posts-heading"
                className="font-display text-heading-sm text-ink uppercase"
              >
                Related reading
              </h2>
              <Link
                href="/blogs"
                className="link-underline font-label text-[0.72rem] tracking-[0.2em] text-rose-600 uppercase"
              >
                All guides
              </Link>
            </div>

            <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug} className="group">
                  <Link
                    href={blogHref(item.slug)}
                    className="flex flex-col gap-3"
                  >
                    <span className="relative block aspect-16/10 overflow-hidden rounded-panel bg-paper transition-shadow duration-500 group-hover:shadow-drift">
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                    </span>
                    <span className="font-headline text-base text-ink transition-colors group-hover:text-rose-600">
                      {item.title}
                    </span>
                    <span className="text-body-sm text-ink-soft">
                      {item.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
