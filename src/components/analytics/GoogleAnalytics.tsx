"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Minimal shape of the gtag stub the loader snippet installs on `window`. */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4 — gtag.js measurement for traffic and conversions.
 * Loads only in the browser, only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set,
 * so local runs and previews without the id stay out of production data.
 *
 * The loader's gtag('config', …) fires the first page_view itself. App Router
 * navigations are client-side, so no further page loads happen and the effect
 * below re-sends page_view for each subsequent route change.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pathname = usePathname();
  /** Skips the initial render — the loader snippet already sent that one. */
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (!measurementId) return;
    if (!bootstrapped.current) {
      bootstrapped.current = true;
      return;
    }
    window.gtag?.("config", measurementId, { page_path: pathname });
  }, [measurementId, pathname]);

  if (!measurementId) return null;

  return (
    <>
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script id="google-analytics-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
