/**
 * Typed read layer over the Customer Account API. Every call goes through
 * `customerRequest`, which injects the signed-in customer's own access token.
 */

import { customerRequest } from "@/lib/shopify/customer-account";
import {
  CUSTOMER_ORDERS_QUERY,
  CUSTOMER_ORDER_QUERY,
  CUSTOMER_QUERY,
  CUSTOMER_UPDATE_MUTATION,
} from "@/lib/shopify/queries";
import type {
  Customer,
  CustomerAddress,
  Order,
  OrderSummary,
} from "@/lib/shopify/types";

export class CustomerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerServiceError";
  }
}

/* ── Customer ──────────────────────────────────────────────────────────── */

type RawAddress = {
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

export async function getCustomer(): Promise<Customer> {
  const data = await customerRequest<{
    customer: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      displayName: string;
      emailAddress: { emailAddress: string } | null;
      phoneNumber: { phoneNumber: string } | null;
      defaultAddress: { id: string } | null;
      addresses: { nodes: RawAddress[] };
    } | null;
  }>({ query: CUSTOMER_QUERY });

  const raw = data.customer;
  if (!raw) throw new CustomerServiceError("We could not load your account.");

  const addresses: CustomerAddress[] = raw.addresses.nodes.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    company: a.company,
    address1: a.address1,
    address2: a.address2,
    city: a.city,
    zoneCode: a.zoneCode,
    territoryCode: a.territoryCode,
    zip: a.zip,
    phoneNumber: a.phoneNumber,
    formatted: a.formatted,
  }));

  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    displayName: raw.displayName,
    emailAddress: raw.emailAddress?.emailAddress ?? null,
    phoneNumber: raw.phoneNumber?.phoneNumber ?? null,
    defaultAddressId: raw.defaultAddress?.id ?? null,
    addresses,
  };
}

export async function updateCustomer(input: {
  firstName?: string;
  lastName?: string;
}): Promise<{ firstName: string | null; lastName: string | null }> {
  const data = await customerRequest<{
    customerUpdate: {
      customer: { firstName: string | null; lastName: string | null } | null;
      userErrors?: Array<{ field?: string[]; message?: string }>;
    };
  }>({ query: CUSTOMER_UPDATE_MUTATION, variables: { input }, retries: 1 });

  const error = data.customerUpdate?.userErrors?.[0]?.message;
  if (error) throw new CustomerServiceError(error);
  const customer = data.customerUpdate?.customer;
  if (!customer) throw new CustomerServiceError("We could not save your details.");
  return { firstName: customer.firstName, lastName: customer.lastName };
}

/* ── Orders ────────────────────────────────────────────────────────────── */

export async function listOrders(options: {
  first?: number;
  after?: string | null;
}): Promise<{ orders: OrderSummary[]; hasNextPage: boolean; endCursor: string | null }> {
  const first = options.first ?? 10;
  const after = options.after ?? null;
  const data = await customerRequest<{
    customer: {
      orders: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: Array<{
          id: string;
          number: number;
          name: string;
          processedAt: string;
          financialStatus: string | null;
          fulfillments: { nodes: Array<{ status: string | null }> } | null;
          totalPrice: { amount: string; currencyCode: string } | null;
          lineItems: { nodes: Array<{ id: string; title: string; image: { url: string; altText: string | null } | null }> };
        }>;
      };
    } | null;
  }>({ query: CUSTOMER_ORDERS_QUERY, variables: { first, after } });

  const orders = data.customer?.orders;
  if (!orders) throw new CustomerServiceError("We could not load your orders.");

  return {
    orders: orders.nodes.map((node) => ({
      id: node.id,
      number: node.number,
      name: node.name,
      processedAt: node.processedAt,
      financialStatus: node.financialStatus,
      fulfillmentStatus: node.fulfillments?.nodes?.[0]?.status ?? null,
      totalPrice: node.totalPrice
        ? { amount: node.totalPrice.amount, currencyCode: node.totalPrice.currencyCode }
        : null,
      lineItemCount: node.lineItems.nodes.length,
      previewImages: node.lineItems.nodes.map((li) =>
        li.image ? { url: li.image.url, altText: li.image.altText } : null,
      ),
    })),
    hasNextPage: orders.pageInfo.hasNextPage,
    endCursor: orders.pageInfo.endCursor,
  };
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const data = await customerRequest<{
    order: {
      id: string;
      number: number;
      name: string;
      processedAt: string;
      cancelledAt: string | null;
      financialStatus: string | null;
      statusPageUrl: string | null;
      email: string | null;
      phone: string | null;
      totalPrice: { amount: string; currencyCode: string } | null;
      subtotal: { amount: string; currencyCode: string } | null;
      totalShipping: { amount: string; currencyCode: string } | null;
      totalTax: { amount: string; currencyCode: string } | null;
      totalRefunded: { amount: string; currencyCode: string } | null;
      shippingAddress: RawAddress | null;
      billingAddress: RawAddress | null;
      lineItems: {
        nodes: Array<{
          id: string;
          title: string;
          variantTitle: string | null;
          quantity: number;
          sku: string | null;
          image: { url: string; altText: string | null } | null;
          price: { amount: string; currencyCode: string } | null;
          totalPrice: { amount: string; currencyCode: string } | null;
        }>;
      };
      fulfillments: {
        nodes: Array<{
          id: string;
          status: string | null;
          createdAt: string | null;
          estimatedDeliveryAt: string | null;
          trackingInformation: Array<{ number: string | null; company: string | null; url: string | null }>;
          events: Array<{ status: string | null; happenedAt: string | null }>;
          fulfillmentLineItems: {
            nodes: Array<{ lineItem: { id: string }; quantity: number }>;
          };
        }>;
      };
    } | null;
  }>({ query: CUSTOMER_ORDER_QUERY, variables: { id: orderId } });

  const order = data.order;
  if (!order) return null;

  return {
    id: order.id,
    number: order.number,
    name: order.name,
    processedAt: order.processedAt,
    cancelledAt: order.cancelledAt,
    financialStatus: order.financialStatus,
    statusPageUrl: order.statusPageUrl,
    email: order.email,
    phone: order.phone,
    totalPrice: order.totalPrice
      ? { amount: order.totalPrice.amount, currencyCode: order.totalPrice.currencyCode }
      : null,
    subtotal: order.subtotal
      ? { amount: order.subtotal.amount, currencyCode: order.subtotal.currencyCode }
      : null,
    totalShipping: order.totalShipping
      ? { amount: order.totalShipping.amount, currencyCode: order.totalShipping.currencyCode }
      : null,
    totalTax: order.totalTax
      ? { amount: order.totalTax.amount, currencyCode: order.totalTax.currencyCode }
      : null,
    totalRefunded: order.totalRefunded
      ? { amount: order.totalRefunded.amount, currencyCode: order.totalRefunded.currencyCode }
      : null,
    shippingAddress: order.shippingAddress ? mapAddress(order.shippingAddress) : null,
    billingAddress: order.billingAddress ? mapAddress(order.billingAddress) : null,
    lineItems: order.lineItems.nodes.map((li) => ({
      id: li.id,
      title: li.title,
      variantTitle: li.variantTitle,
      quantity: li.quantity,
      sku: li.sku,
      image: li.image ? { url: li.image.url, altText: li.image.altText } : null,
      price: li.price ? { amount: li.price.amount, currencyCode: li.price.currencyCode } : null,
      totalPrice: li.totalPrice
        ? { amount: li.totalPrice.amount, currencyCode: li.totalPrice.currencyCode }
        : null,
    })),
    fulfillments: order.fulfillments.nodes.map((f) => ({
      id: f.id,
      status: f.status,
      createdAt: f.createdAt,
      estimatedDeliveryAt: f.estimatedDeliveryAt,
      trackingInformation: f.trackingInformation,
      events: f.events,
      lineItemIds: f.fulfillmentLineItems.nodes.map((n) => n.lineItem.id),
    })),
  };
}

function mapAddress(a: RawAddress): CustomerAddress {
  return {
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    company: a.company,
    address1: a.address1,
    address2: a.address2,
    city: a.city,
    zoneCode: a.zoneCode,
    territoryCode: a.territoryCode,
    zip: a.zip,
    phoneNumber: a.phoneNumber,
    formatted: a.formatted,
  };
}
