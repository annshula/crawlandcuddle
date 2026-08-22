# Security hardening (parity with trackify reference)

## Added

- **HSTS** in `next.config.ts` securityHeaders: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (+ Shopify `images.remotePatterns`: `cdn.shopify.com`, `*.myshopify.com`).
- **CSP + account-guard middleware**: `src/middleware.ts` (Next 15 name; trackify's is `proxy.ts` under Next 16). Two jobs:
  1. Attaches `Content-Security-Policy` to every response: `default-src 'self'; script-src 'self' 'unsafe-inline' (+ 'unsafe-eval' DEV only); style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://cdn.shopify.com https://*.myshopify.com (+ `c.bing.com`Clarity sync beacon GIF when Clarity enabled); media-src 'self' <shopify cdn>; font-src 'self' data:; connect-src 'self' (+ ws localhost DEV) (+ Meta CAPI event hosts`https://_.run.app https://_.on.aws` when pixel enabled); object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests (PROD only)`.
  2. Presence-only guard: `/account/*` (except `/account/login|authorize|callback|logout`) redirects to `/account/login?returnTo=...` when `_cc_session` cookie absent. Real auth still enforced server-side by `requireCustomer()`.
- `'unsafe-inline'` script-src is a deliberate trade-off (Next's inline RSC hydration payload can't be nonced under static gen) — same as trackify, documented in the middleware.
- **Deviation from trackify**: `upgrade-insecure-requests` is gated to PROD only because this project's dev server runs plain `http://localhost` (would upgrade every same-origin asset to https and break dev). Trackify runs dev over an https ngrok tunnel so ships it unconditionally. `'unsafe-eval'` dev-only like trackify.

## Already at parity (verified, no change needed)

- Session cookies AES-256-GCM, `httpOnly`, `secure` (prod), `sameSite: lax` — `src/lib/shopify/session.ts`.
- OAuth2 + PKCE, `timingSafeEqual` in callback; admin token via client-credentials (24h, cached).
- next.config headers: X-DNS-Prefetch-Control, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy; `poweredByHeader: false`, `reactStrictMode: true`.
- No third-party scripts/analytics → CSP stays tight (no GTM/FB/Cloudflare hosts needed).

## Verify

- `curl -sI localhost:3000` shows CSP + HSTS. `/account` without cookie → 307 to `/account/login?returnTo=%2Faccount`. Pages render with 0 CSP violations (checked /, /products, PDP, /checkout, /account/login).
