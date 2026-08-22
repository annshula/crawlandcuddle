import Script from "next/script";

/**
 * Google Tag Manager — the site's tag-management container (GTM-W96TWWW9).
 *
 * The loader runs with `beforeInteractive`, which the server injects into the
 * initial HTML's <head> before any Next.js module — the App Router equivalent
 * of "as high in the head as possible". The required <noscript> fallback (the
 * iframe Google serves to no-JS visitors) renders right here, so this
 * component must stay the FIRST child of <body> in the root layout.
 *
 * Unlike GA/Clarity/Pixel (opt-in, env-gated), GTM is a permanent install, so
 * it always renders and its CSP entries in middleware.ts are unconditional.
 * The id is read from NEXT_PUBLIC_GTM_ID so the container can be overridden
 * per environment, and falls back to the production container.
 */
export function GTM() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || "GTM-W96TWWW9";

  return (
    <>
      <Script id="google-tag-manager" strategy="beforeInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
          aria-hidden="true"
        />
      </noscript>
    </>
  );
}
