import { redirect } from "next/navigation";

import { productPath, variants } from "@/content/site";

/**
 * Old per-style route (/products/lion, /products/green-owl, …). Style
 * selection is now a client-side swatch picker on the single product page,
 * not a separate URL, so every old style link permanently redirects to the
 * one product page — preserving SEO value from any indexed/bookmarked links.
 */
type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return variants.map((v) => ({ slug: v.slug }));
}

export default function LegacyStylePage() {
  redirect(productPath);
}
