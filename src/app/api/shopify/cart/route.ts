import { NextRequest, NextResponse } from "next/server";

import { getVariantForStyle } from "@/lib/catalog";
import { isStorefrontConfigured } from "@/lib/shopify/config";
import { createCart } from "@/lib/shopify/storefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckoutLine = { slug?: string; qty?: number };

/**
 * Builds a Shopify Storefront cart from the current bag lines and returns the
 * hosted checkout URL. The client navigates to it — Shopify owns the rest of
 * the purchase flow.
 */
export async function POST(request: NextRequest) {
  if (!isStorefrontConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Shopify checkout is not connected yet." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    lines?: CheckoutLine[];
  } | null;
  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (lines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Your bag is empty." },
      { status: 400 },
    );
  }

  const cartLines = lines
    .map((line) => {
      if (!line.slug) return null;
      const variant = getVariantForStyle(line.slug);
      if (!variant.id) return null;
      const qty = Math.max(1, Math.min(Number(line.qty) || 1, 20));
      return { merchandiseId: variant.id, quantity: qty };
    })
    .filter(
      (l): l is { merchandiseId: string; quantity: number } => l !== null,
    );

  if (cartLines.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "We could not match the items in your bag to the store.",
      },
      { status: 400 },
    );
  }

  try {
    const cart = await createCart(cartLines);
    return NextResponse.json({
      ok: true,
      checkoutUrl: cart.checkoutUrl,
      totalQuantity: cart.totalQuantity,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "We could not create your checkout.",
      },
      { status: 500 },
    );
  }
}
