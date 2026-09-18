import { NextResponse } from "next/server";

import {
  isAuthorizedAdminRequest,
  unauthorizedResponse,
} from "@/lib/admin/auth";
import { syncProduct } from "@/lib/shopify/sync-product";

/**
 * POST /api/admin/sync-product
 *
 * Mirrors the reference's route, scoped to this site's single product: the one
 * place besides `npm run shopify:sync` that talks to Shopify live. Refreshes
 * the product already in data/product.json (title, price, compare-at,
 * variants, every curated market's price list, media) and rewrites the file
 * through lib/catalog/storage.ts — the filesystem in dev, Vercel Blob in
 * production.
 *
 * Protected by ADMIN_API_KEY (Bearer token).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedAdminRequest(request)) return unauthorizedResponse();

  try {
    const result = await syncProduct();
    return NextResponse.json(
      {
        ok: true,
        handle: result.handle,
        title: result.title,
        price: result.price,
        compareAtPrice: result.compareAtPrice,
        currencyCode: result.currencyCode,
        mediaItems: result.mediaItems,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  } catch (error) {
    console.error("[admin/sync-product] failed:", (error as Error).message);
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
