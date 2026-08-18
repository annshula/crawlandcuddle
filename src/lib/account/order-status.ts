/**
 * Human labels + theme tones for Shopify order statuses.
 */

export type StatusTone =
  | "neutral"
  | "rose"
  | "lilac"
  | "mint"
  | "butter"
  | "ink";

const FINANCIAL: Record<string, { label: string; tone: StatusTone }> = {
  PAID: { label: "Paid", tone: "mint" },
  AUTHORIZED: { label: "Payment authorized", tone: "lilac" },
  PENDING: { label: "Payment pending", tone: "butter" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  PARTIALLY_REFUNDED: { label: "Partially refunded", tone: "neutral" },
  VOIDED: { label: "Voided", tone: "rose" },
  PARTIALLY_PAID: { label: "Partially paid", tone: "butter" },
};

const FULFILLMENT: Record<string, { label: string; tone: StatusTone }> = {
  SUCCESS: { label: "Fulfilled", tone: "mint" },
  IN_PROGRESS: { label: "Fulfilling", tone: "lilac" },
  ON_HOLD: { label: "On hold", tone: "butter" },
  OPEN: { label: "Processing", tone: "lilac" },
  PENDING_FULFILLMENT: { label: "Pending fulfilment", tone: "butter" },
  SCHEDULED: { label: "Scheduled", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "rose" },
  FAILURE: { label: "Fulfilment failed", tone: "rose" },
  ERROR: { label: "Fulfilment error", tone: "rose" },
  UNFULFILLED: { label: "Unfulfilled", tone: "neutral" },
};

export function financialStatus(status: string | null) {
  if (!status) return { label: "Pending", tone: "butter" as StatusTone };
  return FINANCIAL[status] ?? { label: status, tone: "neutral" as StatusTone };
}

export function fulfillmentStatus(status: string | null) {
  if (!status)
    return { label: "Awaiting fulfilment", tone: "butter" as StatusTone };
  return (
    FULFILLMENT[status] ?? { label: status, tone: "neutral" as StatusTone }
  );
}

export const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-ink/5 text-ink-soft",
  rose: "bg-rose-100 text-rose-700",
  lilac: "bg-lilac-100 text-lilac-700",
  mint: "bg-mint/40 text-ink",
  butter: "bg-butter/60 text-ink",
  ink: "bg-ink text-paper",
};
