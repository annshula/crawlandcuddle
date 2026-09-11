import type { MetadataRoute } from "next";

import { blogHref, posts } from "@/content/blog";
import { variantHref, variants } from "@/content/site";
import { absoluteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

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
    ...variants.map((variant) => ({
      url: absoluteUrl(variantHref(variant.slug)),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: variant.featured ? 0.8 : 0.7,
    })),
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
