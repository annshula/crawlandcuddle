/**
 * Visitor country from whichever edge/CDN in front of the app already
 * geolocated the request — never computed by this app. Returns null on
 * localhost (no such header) so pricing falls back to the shop default.
 */

type HeaderSource = { get(name: string): string | null };

export function detectVisitorCountry(headers: HeaderSource): string | null {
  const candidate =
    headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country");
  if (!candidate) return null;
  const code = candidate.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "T1") return null;
  return code;
}
