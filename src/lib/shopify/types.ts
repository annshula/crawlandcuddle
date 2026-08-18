/**
 * Shopify domain types (Storefront cart + Customer Account profile/orders).
 * Mirror the shapes the GraphQL layer returns, normalised for our UI.
 */

export type Money = { amount: string; currencyCode: string };

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price?: Money | null;
    compareAtPrice?: Money | null;
    product?: { id: string; handle: string; title: string } | null;
  } | null;
  cost?: { totalAmount?: Money | null } | null;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  updatedAt: string;
  cost?: {
    subtotalAmount?: Money | null;
    totalAmount?: Money | null;
    totalTaxAmount?: Money | null;
  } | null;
  lines: CartLine[];
};

export type CartLineInput = { merchandiseId: string; quantity: number };

/* ── Customer Account ──────────────────────────────────────────────────── */

export type CustomerAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  zoneCode: string | null;
  territoryCode: string | null;
  zip: string | null;
  phoneNumber: string | null;
  formatted: string[];
};

export type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: string | null;
  phoneNumber: string | null;
  defaultAddressId: string | null;
  addresses: CustomerAddress[];
};

export type OrderSummary = {
  id: string;
  number: number;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: Money | null;
  lineItemCount: number;
  previewImages: Array<{ url: string; altText: string | null } | null>;
};

export type OrderLineItem = {
  id: string;
  title: string;
  variantTitle: string | null;
  quantity: number;
  sku: string | null;
  image: { url: string; altText: string | null } | null;
  price: Money | null;
  totalPrice: Money | null;
};

export type OrderFulfillment = {
  id: string;
  status: string | null;
  createdAt: string | null;
  estimatedDeliveryAt: string | null;
  trackingInformation: Array<{ number: string | null; company: string | null; url: string | null }>;
  events: Array<{ status: string | null; happenedAt: string | null }>;
  lineItemIds: string[];
};

export type Order = {
  id: string;
  number: number;
  name: string;
  processedAt: string;
  cancelledAt: string | null;
  financialStatus: string | null;
  statusPageUrl: string | null;
  email: string | null;
  phone: string | null;
  totalPrice: Money | null;
  subtotal: Money | null;
  totalShipping: Money | null;
  totalTax: Money | null;
  totalRefunded: Money | null;
  shippingAddress: CustomerAddress | null;
  billingAddress: CustomerAddress | null;
  lineItems: OrderLineItem[];
  fulfillments: OrderFulfillment[];
};
