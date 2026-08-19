import { NextResponse, type NextRequest } from "next/server";

/**
 * Security middleware (Next 15 `middleware.ts`; trackify calls it `proxy.ts`
 * under Next 16 — same thing).
 *
 * Two jobs, both cheap enough for every request:
 *  1. Attach a Content-Security-Policy header.
 *  2. Send unauthenticated visitors away from /account/* before a page renders
 *     (presence-only check; the real authorization still happens server-side
 *     in `requireCustomer()`, so a forged cookie fails there, not here).
 *
 * On the CSP: `'unsafe-inline'` in script-src is a deliberate trade-off, not an
 * oversight. Next.js ships its RSC hydration payload as inline <script> tags
 * whose content is per-request, so it cannot be nonced or hashed without
 * forfeiting static generation. This app renders no raw user-submitted HTML
 * anywhere, so the XSS surface `'unsafe-inline'` leaves open is minimal, and
 * every other directive stays strict.
 *
 * `'unsafe-eval'` is dev-only (React's dev build calls eval() for Fast Refresh;
 * production builds never do). `upgrade-insecure-requests` is prod-only too —
 * on a plain http://localhost dev origin it would upgrade every same-origin
 * asset to https://localhost and break the dev server (trackify runs dev over
 * an https tunnel, so they ship it unconditionally).
 */
const SESSION_COOKIE = "_cc_session";

/** Public /account routes: the auth flow itself must stay reachable. */
const PUBLIC_ACCOUNT_PATHS = new Set([
  "/account/login",
  "/account/authorize",
  "/account/callback",
  "/account/logout",
]);

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Microsoft Clarity origins, allowed only when a project id is configured —
 * the tag script lives on clarity.ms, and replay/heatmap payloads upload to
 * regional *.clarity.ms hosts. With no id the app never loads Clarity, so the
 * CSP stays as tight as it was.
 */
const CLARITY_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
const CLARITY_SRC = CLARITY_ENABLED
  ? " https://www.clarity.ms https://*.clarity.ms"
  : "";

const CSP = [
  `default-src 'self'`,
  // See module doc for why 'unsafe-inline' is here (Next's inline RSC payload).
  `script-src 'self' 'unsafe-inline'${IS_DEV ? ` 'unsafe-eval'` : ""}${CLARITY_SRC}`,
  // Components set dynamic inline styles (GSAP, scroll progress, blobs), so
  // style attributes/`<style>` need 'unsafe-inline' — styles cannot execute
  // script, so this is low risk.
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://cdn.shopify.com https://*.myshopify.com${CLARITY_SRC}`,
  `media-src 'self' https://cdn.shopify.com https://*.myshopify.com`,
  `font-src 'self' data:`,
  `connect-src 'self'${IS_DEV ? " ws://localhost:* wss://localhost:*" : ""}${CLARITY_SRC}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'self'`,
  ...(IS_DEV ? [] : [`upgrade-insecure-requests`]),
].join("; ");

export default function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  const respond = (response: NextResponse): NextResponse => {
    response.headers.set("Content-Security-Policy", CSP);
    return response;
  };

  // ── Account guard (presence-only; authorize server-side later) ───────
  if (pathname.startsWith("/account") && !PUBLIC_ACCOUNT_PATHS.has(pathname)) {
    if (!request.cookies.has(SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/account/login";
      url.search = `?returnTo=${encodeURIComponent(pathname + search)}`;
      return respond(NextResponse.redirect(url));
    }
  }

  return respond(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static files. (API routes pass
     * through — only the CSP header is attached, which is harmless there.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|txt|json)$).*)",
  ],
};
