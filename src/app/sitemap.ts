import type { MetadataRoute } from "next";

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
  ];
}
