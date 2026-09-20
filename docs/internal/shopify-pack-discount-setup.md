# Shopify setup: pack pricing (2-pack / 3-pack automatic discounts)

The product page now sells 3 pack tiers for every style (displayed as "Just
One" / "Duo Deal" / "Family Bundle" — internal size still 1/2/3):

| Size (qty) | Displayed as   | Discount | Notes            |
| ---------- | -------------- | -------- | ----------------- |
| 1          | Just One       | 0%       | —                  |
| 2          | Duo Deal       | 10%      | "Most popular"     |
| 3          | Family Bundle  | 20%      | + free gift claim  |

**Every tier checks out as the SAME Shopify variant, just at a higher
quantity.** No new product, no new SKU, no new CJ product connection or API
call — CJ fulfils the existing mapped SKU N times. The site only changes what
quantity it sends to `createCart`.

For the price shown on the page to match the price Shopify actually charges,
create **one automatic discount** in Shopify Admin (not a discount code —
automatic discounts apply with no code entry, which is what "buy more, save
more" pricing needs):

## Steps

1. Shopify Admin → **Discounts** → **Create discount** → **Amount off products** → **Automatic discount**.
2. Name it something internal, e.g. `Pack pricing — Baby Head Protector Backpack`.
3. **Applies to**: Specific products → select *Baby Head Protector Backpack* (all variants/styles).
4. Set up **quantity break tiers** (Shopify's "Buy X get Y" / tiered quantity discount UI):
   - Buy **2** → **10%** off
   - Buy **3** → **20%** off
5. **Combines with**: leave "Combines with other discounts" off unless you intentionally stack with another storewide promo — stacking would make the checkout price lower than what the page shows.
6. No usage limits, no minimum purchase requirement, no end date (unless you want the promo to expire).
7. Save and activate.

## Verify

1. On the live product page, add a 2-pack to the bag and go to checkout.
2. Checkout subtotal should equal `unit price × 2 × 0.90`.
3. Repeat for a 3-pack: `unit price × 3 × 0.80`.
4. If the numbers don't match, the automatic discount's tiers/percentages
   don't match `packTiers` in [../../src/content/site.ts](../../src/content/site.ts) —
   fix whichever one is wrong (don't let them drift).

## If you ever change the discount %

Update `discountPercent` on the matching tier in `packTiers`
(`src/content/site.ts`) to the same number you set in the Shopify automatic
discount. The two are not linked — they're kept in sync by hand.

## The free gift on the 3-pack

The 3-pack's "+ free gift" claim needs the gift to actually ship. Two ways to
back this, in order of simplicity:

- **Cheapest**: hand-pack a free gift into every order's default packing job
  at your fulfillment/CJ step for this SKU — regardless of pack size — and
  only market it on the 3-pack. No storefront change needed.
- **Per-tier**: if you want the gift to appear specifically because it's a
  3-pack (not on every order), that requires a real Shopify line-item
  condition (e.g. a free-gift-with-purchase app, or a second product added to
  cart automatically at qty 3+). That *would* need its own SKU/CJ mapping for
  the gift item — outside what this change touches. Flag if you want that
  built next.
