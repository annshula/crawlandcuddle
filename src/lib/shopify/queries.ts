/**
 * GraphQL operations for the Storefront (cart + localization) and Customer
 * Account (profile, orders) APIs. Kept here so the transports stay thin.
 */

/* ── Storefront: localization / currency ────────────────────────────────── */

/**
 * The merchant-configured list of countries/currencies (Shopify Markets), the
 * shop's default market for a given country context, and live per-variant
 * prices already converted to a country's presentment currency via
 * `@inContext(country:)`. This app never computes an exchange rate itself.
 */
export const LOCALIZATION_QUERY = /* GraphQL */ `
  query Localization($country: CountryCode) @inContext(country: $country) {
    localization {
      country {
        isoCode
        name
        currency {
          isoCode
          symbol
        }
      }
      availableCountries {
        isoCode
        name
        currency {
          isoCode
          symbol
        }
      }
    }
  }
`;

export const VARIANTS_AVAILABILITY_QUERY = /* GraphQL */ `
  query VariantsAvailability($ids: [ID!]!, $country: CountryCode)
  @inContext(country: $country) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        availableForSale
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

/* ── Storefront: cart ──────────────────────────────────────────────────── */

export const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    updatedAt
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            product {
              id
              handle
              title
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export const CART_QUERY = /* GraphQL */ `
  query Cart($cartId: ID!, $country: CountryCode = ZZ)
  @inContext(country: $country) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    updatedAt
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            product {
              id
              handle
              title
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    updatedAt
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price {
              amount
              currencyCode
            }
            product {
              id
              handle
              title
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    updatedAt
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price {
              amount
              currencyCode
            }
            product {
              id
              handle
              title
            }
          }
        }
      }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    updatedAt
    lines(first: 100) {
      nodes {
        id
        quantity
      }
    }
  }
`;

/* ── Customer Account: profile ─────────────────────────────────────────── */

export const CUSTOMER_QUERY = /* GraphQL */ `
  query Customer {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress {
        emailAddress
      }
      phoneNumber {
        phoneNumber
      }
      defaultAddress {
        id
      }
      addresses(first: 20) {
        nodes {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          zoneCode
          territoryCode
          zip
          phoneNumber
          formatted(withName: true)
        }
      }
    }
  }
`;

export const CUSTOMER_UPDATE_MUTATION = /* GraphQL */ `
  mutation CustomerUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        firstName
        lastName
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/* ── Customer Account: orders ──────────────────────────────────────────── */

export const CUSTOMER_ORDERS_QUERY = /* GraphQL */ `
  query CustomerOrders($first: Int!, $after: String) {
    customer {
      orders(
        first: $first
        after: $after
        sortKey: PROCESSED_AT
        reverse: true
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          name
          processedAt
          financialStatus
          fulfillments(first: 1) {
            nodes {
              status
            }
          }
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 4) {
            nodes {
              id
              title
              image {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

export const CUSTOMER_ORDER_QUERY = /* GraphQL */ `
  query CustomerOrder($id: ID!) {
    order(id: $id) {
      id
      number
      name
      processedAt
      cancelledAt
      financialStatus
      statusPageUrl
      email
      phone
      totalPrice {
        amount
        currencyCode
      }
      subtotal {
        amount
        currencyCode
      }
      totalShipping {
        amount
        currencyCode
      }
      totalTax {
        amount
        currencyCode
      }
      totalRefunded {
        amount
        currencyCode
      }
      shippingAddress {
        id
        firstName
        lastName
        address1
        address2
        city
        zoneCode
        territoryCode
        zip
        formatted(withName: true)
      }
      billingAddress {
        id
        firstName
        lastName
        address1
        address2
        city
        zoneCode
        territoryCode
        zip
        formatted(withName: true)
      }
      lineItems(first: 100) {
        nodes {
          id
          title
          variantTitle
          quantity
          sku
          image {
            url
            altText
          }
          price {
            amount
            currencyCode
          }
          totalPrice {
            amount
            currencyCode
          }
        }
      }
      fulfillments(first: 20) {
        nodes {
          id
          status
          createdAt
          estimatedDeliveryAt
          trackingInformation {
            number
            company
            url
          }
          events(first: 20) {
            nodes {
              status
              happenedAt
            }
          }
          fulfillmentLineItems(first: 50) {
            nodes {
              lineItem {
                id
              }
              quantity
            }
          }
        }
      }
    }
  }
`;
