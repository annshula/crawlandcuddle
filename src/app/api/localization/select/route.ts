import { NextRequest, NextResponse } from "next/server";

import {
  clearSelectedCountry,
  writeSelectedCountry,
} from "@/lib/localization/country";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/localization/select
 *   body: { countryCode: "CA" }   → set the shopper's country
 *   body: { countryCode: "AUTO" } → clear it (use the shop default / detected)
 *
 * Prices re-fetch live from Shopify on the client; this only persists which
 * country to ask for.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const code = (body as { countryCode?: unknown })?.countryCode;

  // "AUTO" is checked before the ISO shape test — it is four characters, so a
  // 2-letter guard placed first would reject it and silently leave the old
  // country cookie in place while the UI showed "Auto".
  if (code === "AUTO") {
    await clearSelectedCountry();
    return NextResponse.json({ ok: true });
  }

  if (typeof code !== "string" || !/^[A-Z]{2}$/.test(code)) {
    return NextResponse.json(
      { ok: false, error: "Invalid country code." },
      { status: 400 },
    );
  }

  await writeSelectedCountry(code);

  return NextResponse.json({ ok: true });
}
