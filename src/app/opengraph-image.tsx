import { ImageResponse } from "next/og";

import { site } from "@/content/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated at build time so the brand never ships a missing social card. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#fdf4f3",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -140,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "#fbe1e7",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -120,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "#f0e9fa",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "4px solid #e4487d",
            }}
          />
          <div
            style={{
              fontSize: 30,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#2e2530",
            }}
          >
            Crawl &amp; Cuddle
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Satori needs every multi-child node to declare display, and leaf
              nodes to hold a single text child — hence the split lines. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 84,
              lineHeight: 1.02,
              fontWeight: 800,
              color: "#2e2530",
              maxWidth: 940,
            }}
          >
            <div>Baby head protector backpack.</div>
            <div style={{ color: "#e4487d" }}>Ten styles, one promise.</div>
          </div>
          <div style={{ fontSize: 30, color: "#6b5c68", maxWidth: 860 }}>
            A 190 g breathable anti-fall cushion for babies 5 to 24 months.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 24,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#a82454",
          }}
        >
          <span>Protects head &amp; back</span>
          <span>·</span>
          <span>Breathable 3D mesh</span>
          <span>·</span>
          <span>Free gift inside</span>
        </div>
      </div>
    ),
    size,
  );
}
