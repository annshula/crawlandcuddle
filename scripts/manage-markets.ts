/**
 * `npm run shopify:markets` — inspect and manage Shopify Markets via the
 * Admin GraphQL API (`marketCreate` / `marketCurrencySettingsUpdate`).
 *
 * Every non-primary market is set to Shopify's automatic/live currency
 * conversion (rounding off, rate managed by Shopify) off the shop's base
 * currency (USD) — no manual fixed rates.
 *
 * Usage:
 *   npm run shopify:markets -- --list
 *   npm run shopify:markets -- --add-country=ZA --name="South Africa" --currency=ZAR
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getAdminToken } from "../src/lib/shopify/admin-token";
import { shopifyConfig } from "../src/lib/shopify/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/* ── minimal .env loader (mirrors scripts/register-webhooks.ts) ───────── */
function loadEnv(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const text = readFileSync(join(ROOT, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  } catch {
    /* no .env — rely on process env */
  }
  return result;
}

const env = loadEnv();
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined && value !== undefined)
    process.env[key] = value;
}

/* ── Shopify Admin GraphQL ─────────────────────────────────────────────── */

async function graphql<T>(
  token: string,
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as {
    data?: T;
    errors?: Array<{ message?: string; extensions?: { code?: string } }>;
  };
  if (body.errors?.length) {
    const message = body.errors.map((e) => e.message).join("; ");
    const code = body.errors[0]?.extensions?.code;
    throw new Error(`${message}${code ? ` (code: ${code})` : ""}`);
  }
  return body.data as T;
}

type Market = {
  id: string;
  name: string;
  handle: string;
  enabled: boolean;
  type?: string;
  currencySettings?: {
    baseCurrency?: { currencyCode: string } | null;
    localCurrencies?: boolean | null;
  } | null;
  regions?: { edges: Array<{ node: { name?: string; code?: string } }> };
};

async function main() {
  const cfg = shopifyConfig();
  if (!cfg.storeDomain) {
    console.error("✖ SHOPIFY_STORE_DOMAIN is not set");
    process.exit(1);
  }
  const endpoint = `https://${cfg.storeDomain}/admin/api/${cfg.apiVersion}/graphql.json`;
  const token = await getAdminToken();

  if (process.argv.includes("--list")) {
    const full = process.argv.includes("--full-regions");
    const result = await graphql<{ markets: { edges: Array<{ node: Market }> } }>(
      token,
      endpoint,
      /* GraphQL */ `
        query Markets {
          markets(first: 50) {
            edges {
              node {
                id
                name
                handle
                enabled
                type
                currencySettings {
                  baseCurrency {
                    currencyCode
                  }
                  localCurrencies
                }
                regions(first: ${full ? 250 : 10}) {
                  edges {
                    node {
                      ... on MarketRegionCountry {
                        name
                        code
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      {},
    );
    const markets = result.markets?.edges.map((e) => e.node) ?? [];
    console.log(`Store: ${cfg.storeDomain}`);
    console.log(`Markets (${markets.length}):`);
    for (const m of markets) {
      const codes = m.regions?.edges.map((e) => e.node.code ?? e.node.name) ?? [];
      const hasZA = codes.includes("ZA");
      const regions = full ? codes.join(", ") : codes.join(", ");
      console.log(
        `  • [${m.enabled ? "on " : "off"}] ${m.name} (${m.handle})  type=${m.type ?? "-"}  base=${
          m.currencySettings?.baseCurrency?.currencyCode ?? "-"
        }  localCurrencies(autoFX)=${m.currencySettings?.localCurrencies ?? false}  regionCount=${codes.length}${hasZA ? "  ← includes ZA" : ""}${full ? `\n      regions=[${regions}]` : ""}`,
      );
    }
    return;
  }

  const countryCode = process.argv
    .find((arg) => arg.startsWith("--add-country="))
    ?.slice("--add-country=".length);
  if (countryCode) {
    const name =
      process.argv
        .find((arg) => arg.startsWith("--name="))
        ?.slice("--name=".length) ?? countryCode;
    const currency =
      process.argv
        .find((arg) => arg.startsWith("--currency="))
        ?.slice("--currency=".length) ?? null;

    console.log(`Creating market "${name}" for country ${countryCode}...`);
    const created = await graphql<{
      marketCreate: {
        userErrors?: Array<{ field?: string[]; message?: string }>;
        market?: Market | null;
      };
    }>(
      token,
      endpoint,
      /* GraphQL */ `
        mutation MarketCreate($input: MarketCreateInput!) {
          marketCreate(input: $input) {
            userErrors {
              field
              message
            }
            market {
              id
              name
              handle
              enabled
            }
          }
        }
      `,
      {
        input: {
          name,
          enabled: true,
          regions: [{ countryCode }],
        },
      },
    );
    const errors = created.marketCreate?.userErrors ?? [];
    if (errors.length > 0) {
      console.error(
        "✖ Shopify rejected marketCreate:",
        errors
          .map((e) => `${e.field?.join(".") ?? ""} ${e.message}`.trim())
          .join("; "),
      );
      process.exit(1);
    }
    const market = created.marketCreate?.market;
    if (!market) {
      console.error("✖ No market returned.");
      process.exit(1);
    }
    console.log(`✓ Created market: ${market.id} (${market.name})`);

    if (currency) {
      console.log(
        `Setting local currency ${currency} with Shopify auto (live) FX conversion...`,
      );
      const updated = await graphql<{
        marketCurrencySettingsUpdate: {
          userErrors?: Array<{ field?: string[]; message?: string }>;
          market?: Market | null;
        };
      }>(
        token,
        endpoint,
        /* GraphQL */ `
          mutation MarketCurrencySettingsUpdate(
            $marketId: ID!
            $input: MarketCurrencySettingsUpdateInput!
          ) {
            marketCurrencySettingsUpdate(marketId: $marketId, input: $input) {
              userErrors {
                field
                message
              }
              market {
                id
                currencySettings {
                  baseCurrency {
                    currencyCode
                  }
                  localCurrencies
                }
              }
            }
          }
        `,
        {
          marketId: market.id,
          input: {
            localCurrencies: true,
          },
        },
      );
      const curErrors = updated.marketCurrencySettingsUpdate?.userErrors ?? [];
      if (curErrors.length > 0) {
        console.error(
          "✖ Shopify rejected marketCurrencySettingsUpdate:",
          curErrors
            .map((e) => `${e.field?.join(".") ?? ""} ${e.message}`.trim())
            .join("; "),
        );
        process.exit(1);
      }
      console.log(`✓ Auto FX (local currencies) enabled for ${market.name}.`);
      console.log(
        `Note: local currency display (${currency}) is derived from the region's ` +
          `country and Shopify's supported currency list — verify in Settings → Markets → ${market.name}.`,
      );
    }
    return;
  }

  console.log(
    "Usage:\n" +
      "  npm run shopify:markets -- --list\n" +
      '  npm run shopify:markets -- --add-country=ZA --name="South Africa" --currency=ZAR',
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("✖", message);
  process.exit(1);
});
