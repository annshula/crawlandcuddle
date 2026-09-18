import type { MetadataRoute } from "next";

import { blogHref, posts } from "@/content/blog";
import { getLiveProduct } from "@/lib/product-live";
import { absoluteUrl } from "@/lib/utils";

/**
 * Mirrors the reference's sitemap: it reads the product handle through
 * `getLiveProduct()` (Vercel Blob, falling back to the build-time snapshot)
 * rather than a hardcoded path, so a handle change synced by the
 * products/create|update webhook shows up here without a redeploy. This is a
 * non-pricing surface — no cart or checkout path reads it — which is exactly
 * why the reference wires live reads here first.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const product = await getLiveProduct();
  const productHref = `/products/${product.handle}`;

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl(productHref),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/blogs"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(blogHref(post.slug)),
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
