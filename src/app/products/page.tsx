import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ProductPrice } from "@/components/product/ProductPrice";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { defaultVariant, product, productPath, site, variants } from "@/content/site";
import { absoluteUrl, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop — Baby Head Protector Backpack, 10 Styles",
  description:
    "The Crawl & Cuddle baby head protector backpack. Identical anti-fall protection, 190 g, breathable 3D mesh, 5–24 months, in ten styles. Free gift and free tracked shipping.",
  alternates: { canonical: "/products" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/products"),
    siteName: site.name,
    title: "Shop — Baby Head Protector Backpack, 10 Styles",
    description: site.shortDescription,
    locale: "en_US",
    images: [{ ...site.ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop — Baby Head Protector Backpack, 10 Styles",
    description: site.shortDescription,
    images: [{ ...site.ogImage }],
  },
};

export default function ProductsPage() {
  return (
    <section aria-label="Shop" className="relative bg-paper pb-16 md:pb-20">
      <div className="container-page pt-[calc(var(--nav-height)+1.75rem)]">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Products" }]}
        />

        <h1 className="mt-5 font-display text-heading text-ink uppercase">
          Shop
        </h1>
        <p className="mt-2 max-w-lg text-body-sm text-ink-soft">
          The baby head protector backpack, in ten styles — identical
          protection, only the print changes.
        </p>

        <ul className="mt-8 grid grid-cols-1 sm:w-56">
          <li className="group flex flex-col">
            <Link href={productPath} className="flex flex-1 flex-col gap-3">
              <span
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-panel transition-shadow duration-500 ease-out-soft group-hover:shadow-drift",
                  defaultVariant().tone,
                )}
              >
                <Image
                  src={defaultVariant().image}
                  alt={`${product.shortName}, toddler anti-fall cushion pillow`}
                  fill
                  priority
                  sizes="14rem"
                  className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.05]"
                />
                <span className="eyebrow absolute top-2.5 left-2.5 rounded-tag bg-paper/90 px-2 py-1 text-[0.55rem] text-rose-600 backdrop-blur-sm">
                  Bestseller
                </span>
              </span>

              <span className="flex flex-1 flex-col">
                <span className="font-headline text-base text-ink transition-colors duration-300 group-hover:text-rose-600">
                  {product.shortName}
                </span>
                <span className="mt-1 flex-1 text-body-sm text-ink-soft">
                  {variants.length} styles — pick yours on the product page.
                </span>
                <span className="mt-3 flex items-center justify-between gap-3">
                  <ProductPrice slug={defaultVariant().slug} size="sm" />
                  <span className="eyebrow flex items-center gap-1 text-rose-600">
                    View
                    <Icon
                      name="arrow-right"
                      className="size-3.5 transition-transform duration-500 group-hover:translate-x-1"
                    />
                  </span>
                </span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
