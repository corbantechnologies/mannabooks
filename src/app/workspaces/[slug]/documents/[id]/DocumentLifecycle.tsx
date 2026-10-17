// src/app/workspaces/[slug]/documents/[id]/DocumentLifecycle.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { axiosClient } from "@/lib/api/axios";
import { formatCurrency } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";

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

/** One-line explanation of where the document stands and what changes it next. */
function guidance(docType: string, status: string, wf: DocumentWorkflow, currency: string): string {
  const balance = parseFloat(wf.balanceDue || "0");
  const paid = parseFloat(wf.amountPaid || "0");
  if (status === "DRAFT") return "Drafts can be edited or deleted. Issuing locks the amounts.";
  if (status === "CANCELLED") return "Cancelled documents are kept for the audit trail and can't be changed.";
  if (wf.statusManagedBySystem) {
    if (status === "PAID") return "Fully settled. Corrections now need a credit note.";
    const owed = `${formatCurrency(balance, currency)} outstanding`;
    if (status === "OVERDUE") return `${owed}${paid > 0 ? ` after ${formatCurrency(paid, currency)} paid` : ""}. Past the due date.`;
    return `${owed}. The status updates itself as payments and credit notes are recorded.`;
  }
  if (docType === "QUOTATION" && status === "EXPIRED") return "The validity date has passed. Revise it, or extend the validity date.";
  if (docType === "QUOTATION" && status === "CONFIRMED") return "Accepted. Convert it to an invoice from Document actions.";
  return "This document is locked once issued.";
}

export function DocumentLifecycle({
  documentId,
  shopId,
  docType,
  status,
  workflow,
  currency,
}: {
  documentId: string;
  shopId: string;
  docType: string;
  status: string;
  workflow: DocumentWorkflow;
  currency: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<WorkflowAction | null>(null);
  const [reason, setReason] = useState("");

  const paid = parseFloat(workflow.amountPaid || "0");
  const showPartialTag = status === "OVERDUE" && paid > 0;

  async function run(a: WorkflowAction, why?: string) {
    setPending(a.action);
    try {
      await axiosClient.post(`/documents/${documentId}/actions/${a.action}`, { reason: why || undefined }, {
        params: { shop_id: shopId },
      });
      toast.success(`${a.label}: done.`);
      setConfirming(null);
      setReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || `Couldn't ${a.label.toLowerCase()}.`);
    } finally {
      setPending(null);
    }
  }

  function start(a: WorkflowAction) {
    if (!a.enabled) return;
    if (a.confirm || a.needsReason) {
      setConfirming(a);
      setReason("");
      return;
    }
    run(a);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] text-zinc-400 uppercase font-semibold mr-1">Status</p>
        <span className={`${statusBadgeClass(status)} text-[11px]`}>{statusLabel(docType, status)}</span>
        {showPartialTag && <span className="badge-amber text-[11px]">Partially paid</span>}
        {workflow.isLocked && status !== "CANCELLED" && (
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">🔒 Locked</span>
        )}
      </div>
      <p className="font-sans text-xs text-zinc-600">{guidance(docType, status, workflow, currency)}</p>

      {workflow.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workflow.actions.map((a) => {
            const base =
              a.tone === "primary"
                ? "btn-primary-modern"
                : a.tone === "danger"
                ? "btn-secondary-modern text-rose-700 border-rose-200 hover:bg-rose-50"
                : "btn-secondary-modern";
            return (
              <button
                key={a.action}
                type="button"
                disabled={!a.enabled || pending !== null}
                title={a.enabled ? undefined : a.reason || undefined}
                onClick={() => start(a)}
                className={`${base} px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {pending === a.action && <Spinner size={10} color="currentColor" />}
                {a.label}
              </button>
            );
          })}
        </div>
      )}
      {workflow.actions.some((a) => !a.enabled && a.reason) && (
        <ul className="font-sans text-[11px] text-zinc-500 space-y-0.5">
          {workflow.actions
            .filter((a) => !a.enabled && a.reason)
            .map((a) => (
              <li key={a.action}>
                <span className="font-semibold">{a.label}</span> unavailable: {a.reason}
              </li>
            ))}
        </ul>
      )}

      {confirming && (
        <div className="border border-zinc-200 rounded-lg p-3 space-y-2 bg-zinc-50/70">
          <p className="font-sans text-xs font-semibold text-black">{confirming.label}?</p>
          {confirming.confirm && <p className="font-sans text-xs text-zinc-600">{confirming.confirm}</p>}
          {confirming.needsReason && (
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (kept in the audit trail)"
              maxLength={500}
              className="w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs bg-white focus:outline-none focus:border-black font-sans"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending !== null || (confirming.needsReason && confirming.action === "void" && !reason.trim())}
              onClick={() => run(confirming, reason.trim())}
              className={`${confirming.tone === "danger" ? "bg-rose-600 hover:bg-rose-700 text-white rounded-md" : "btn-primary-modern"} px-3 py-1.5 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5`}
            >
              {pending === confirming.action && <Spinner size={10} color="white" />}
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold"
            >
              Keep as is
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
