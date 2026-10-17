// src/app/workspaces/[slug]/documents/[id]/documentWorkflow.ts
// Plain helpers shared by the server page and the client components. Keep this file free of
// "use client": a server component can't call functions exported from a client module.

export interface WorkflowAction {
  action: string;
  label: string;
  target: string;
  tone: "primary" | "default" | "danger";
  confirm?: string | null;
  needsReason?: boolean;
  enabled: boolean;
  reason?: string | null;
}

export interface WorkflowConversion {
  target: string;
  label: string;
  enabled: boolean;
  reason?: string | null;
}

/** What the API says this document can do next (GET /documents/{id}?full=true → workflow). */
export interface DocumentWorkflow {
  actions: WorkflowAction[];
  conversions: WorkflowConversion[];
  canEdit: boolean;
  canDelete: boolean;
  canRecordPayment: boolean;
  canRemovePayments: boolean;
  canCreditNote: boolean;
  canChangeDueDate: boolean;
  isLocked: boolean;
  statusManagedBySystem: boolean;
  amountPaid: string | null;
  amountCredited: string | null;
  balanceDue: string | null;
  creditableAmount: string | null;
  isOverdue: boolean;
}

/**
 * Used when the API response has no `workflow` (an older backend, or a partial response): only drafts
 * can be changed and no actions are offered, so the page still renders instead of failing.
 */
export function fallbackWorkflow(status: string): DocumentWorkflow {
  const draft = status === "DRAFT";
  return {
    actions: [],
    conversions: [],
    canEdit: draft,
    canDelete: draft,
    canRecordPayment: false,
    canRemovePayments: false,
    canCreditNote: false,
    canChangeDueDate: draft,
    isLocked: !draft,
    statusManagedBySystem: false,
    amountPaid: null,
    amountCredited: null,
    balanceDue: null,
    creditableAmount: null,
    isOverdue: status === "OVERDUE",
  };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partially paid",
  OVERDUE: "Overdue",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

const TYPE_STATUS_LABELS: Record<string, Record<string, string>> = {
  QUOTATION: { ISSUED: "Sent", CONFIRMED: "Accepted" },
  LPO: { ISSUED: "Sent", CONFIRMED: "Supplier confirmed" },
  PO: { ISSUED: "Sent", CONFIRMED: "Supplier confirmed" },
  LSO: { ISSUED: "Sent", CONFIRMED: "Supplier confirmed", RECEIVED: "Completed" },
  DELIVERY_NOTE: { ISSUED: "Dispatched", RECEIVED: "Delivered" },
  SERVICE_COMPLETION_NOTE: { RECEIVED: "Signed off" },
  PAYMENT_VOUCHER: { CONFIRMED: "Approved" },
  PAYROLL_VOUCHER: { CONFIRMED: "Approved" },
  CREDIT_NOTE: { PAID: "Refunded" },
  RECEIPT: { PAID: "Issued" },
};

export function statusLabel(docType: string, status: string): string {
  return TYPE_STATUS_LABELS[docType]?.[status] || STATUS_LABELS[status] || status.replace(/_/g, " ").toLowerCase();
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "PAID":
    case "CONFIRMED":
    case "RECEIVED":
      return "badge-emerald";
    case "PARTIALLY_PAID":
    case "EXPIRED":
      return "badge-amber";
    case "OVERDUE":
    case "CANCELLED":
      return "badge-rose";
    default:
      return "badge-zinc";
  }
}
