import type { Metadata, Viewport } from "next";

import { ClarityAnalytics } from "@/components/analytics/ClarityAnalytics";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { CartProvider } from "@/components/providers/CartProvider";
import { LocalizationProvider } from "@/components/providers/LocalizationProvider";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/content/site";
import { fontVariables } from "@/lib/fonts";
import { absoluteUrl } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: "Baby Head Protector Backpack | Anti-Fall Cushion — 10 Styles",
    template: `%s · ${site.name}`,
  },
  description:
    "Baby head protector backpack for 5–24 months. A 190 g breathable anti-fall cushion that shields the head and back through crawling, standing and first steps. Ten styles, free gift, free tracked shipping.",
  applicationName: site.name,
  authors: [{ name: site.legalName }],
  creator: site.legalName,
  publisher: site.legalName,
  keywords: [
    "baby head protector backpack",
    "toddler anti-fall cushion pillow",
    "baby head and back protector",
    "baby walking safety pillow",
    "infant head guard for crawling",
    "baby head protection pad",
    "toddler head protector for walking",
    "butterfly baby head protector",
  ],
  category: "Baby & Nursery",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName: site.name,
    title: "Baby Head Protector Backpack — Ten Styles, One Promise",
    description: site.shortDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baby Head Protector Backpack — Ten Styles, One Promise",
    description: site.shortDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf4f3" },
    { media: "(prefers-color-scheme: dark)", color: "#4b3269" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      {/* suppressHydrationWarning: some Chrome extensions inject attributes
          (e.g. cz-shortcut-listen) onto <body>; without this the client DOM
          would not match the server HTML and React logs a hydration error. */}
      <body className="antialiased" suppressHydrationWarning>
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-70 focus:rounded-btn focus:bg-rose-600 focus:px-5 focus:py-3 focus:text-paper"
        >
          Skip to content
        </a>

        <LocalizationProvider>
          <CartProvider>
            <SmoothScrollProvider>
              <ScrollProgress />
              <AnnouncementBar />
              <Header />
              <main>{children}</main>
              <Footer />
              <CartDrawer />
            </SmoothScrollProvider>
          </CartProvider>
        </LocalizationProvider>

        <JsonLd />
        <ClarityAnalytics />
      </body>
    </html>
  );
}
