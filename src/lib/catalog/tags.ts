import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Cache tag vocabulary shared by pages and webhook/API revalidation — ported
 * from the reference (`reference/lib/catalog/tags.ts`).
 *
 * Honest scope note (same limitation as the reference): `revalidateTag()` only
 * does something for a cache entry that was *tagged*, via `cacheTag()` /
 * `unstable_cache()`. Nothing in this project tags anything yet, so the tag
 * purges below are inert — the effective lever is `revalidatePath()`, which
 * drops the ISR entry for that route. And a path purge only produces *new*
 * data on routes that read live storage (`lib/product-live.ts`): today that is
 * the sitemap and the llms*.txt feeds. Every other surface renders from the
 * build-time `data/product.json` import, so it changes on the next deploy.
 *
 * Next 15 — `revalidateTag(tag)` takes no cache-life profile argument (that's
 * a Next 16 addition), so the purge helpers stay one-argument.
 */

export const CACHE_TAGS = {
  catalog: "catalog",
  cart: "cart",
  product: (handle: string) => `product:${handle}`,
} as const;

/** Purge every cache entry tagged `tag`. */
export function purgeTag(tag: string): void {
  revalidateTag(tag);
}

export function purgePath(path: string, type?: "layout" | "page"): void {
  revalidatePath(path, type);
}

/** A product changed — drop its own tag, the whole catalog tag, and its ISR page. */
export function revalidateProduct(handle: string): void {
  purgeTag(CACHE_TAGS.product(handle));
  purgeTag(CACHE_TAGS.catalog);
  purgePath(`/products/${handle}`);
}
