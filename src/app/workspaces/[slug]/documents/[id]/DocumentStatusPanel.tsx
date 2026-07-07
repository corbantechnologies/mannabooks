// src/app/workspaces/[slug]/documents/[id]/DocumentStatusPanel.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateDocumentStatus, useDuplicateDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { dispatchDocumentEmail } from "@/lib/actions/email";
import { toast } from "react-hot-toast";

import { DocumentActionsPopover } from "./DocumentActionsPopover";
import { updateDocumentKraCuNumberAction, DocumentType } from "@/lib/actions/documents";
import Link from "next/link";

interface DocumentItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  itemTotal: string;
}

interface DocumentStatusPanelProps {
  documentId: string;
  shopId: string;
  shopSlug: string;
  currentStatus: "DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "RECEIVED";
  docType: DocumentType;
  items: DocumentItem[];
  portalLink: string | null;
  clientEmail: string;
  docNumber: string;
  kraCuInvoiceNumber?: string | null;
  requiresEtims?: boolean;
  initialPaymentChannel?: string | null;
  initialPaymentReference?: string | null;
  parentDocument?: { id: string; docNumber: string; type: string } | null;
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED", label: "Issued" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "RECEIVED", label: "Received" },
] as const;

export function DocumentStatusPanel({
  documentId,
  shopId,
  shopSlug,
  currentStatus,
  docType,
  items,
  portalLink,
  clientEmail,
  docNumber,
  kraCuInvoiceNumber,
  requiresEtims = false,
  initialPaymentChannel = "",
  initialPaymentReference = "",
  parentDocument,
}: DocumentStatusPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "RECEIVED">(currentStatus as any);
  const [cuNumber, setCuNumber] = useState(kraCuInvoiceNumber || "");
  const [paymentChannel, setPaymentChannel] = useState(initialPaymentChannel || "");
  const [paymentReference, setPaymentReference] = useState(initialPaymentReference || "");
  const [savingCu, setSavingCu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateStatusMutation = useUpdateDocumentStatus(shopId, shopSlug);
  const duplicateDocMutation = useDuplicateDocument(shopId, shopSlug);
  const deleteDocMutation = useDeleteDocument(shopId, shopSlug);

  async function handleSaveCuNumber() {
    setSavingCu(true);
    try {
      const res = await updateDocumentKraCuNumberAction(documentId, shopId, shopSlug, cuNumber);
      if (res.success) {
        toast.success("KRA eTIMS CU Serial Number saved.");
        router.refresh();
        
        // Auto-dispatch the finalized receipt to the client if email exists
        if (clientEmail && clientEmail !== "—") {
            handleSendEmail();
        }
      } else {
        toast.error(res.error || "Failed to update eTIMS CU Number.");
      }
    } catch (err) {
      toast.error("Failed to update eTIMS CU Number.");
    } finally {
      setSavingCu(false);
    }
  }

  async function handleStatusUpdate(newStatus: "DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "RECEIVED") {
    if (newStatus === status) return;
    updateStatusMutation.mutate(
      { documentId, status: newStatus },
      {
        onSuccess: () => {
          setStatus(newStatus);
          router.refresh();
        },
      }
    );
  }

  async function handleSendEmail() {
    setSending(true);
    setMessage(null);
    const toastId = toast.loading(`Dispatching email to ${clientEmail}...`);

    const res = await dispatchDocumentEmail({ documentId, isReminder: false });
    setSending(false);

    if (res.success) {
      const text = `Document emailed to ${clientEmail} successfully.`;
      setMessage({ type: "success", text });
      toast.success(text, { id: toastId });
    } else {
      const text = res.error || "Failed to send email.";
      setMessage({ type: "error", text });
      toast.error(text, { id: toastId });
    }
  }

  async function handleSendReminder() {
    setSending(true);
    setMessage(null);
    const toastId = toast.loading(`Dispatching aging reminder to ${clientEmail}...`);

    const res = await dispatchDocumentEmail({ documentId, isReminder: true });
    setSending(false);

    if (res.success) {
      const text = `Aging reminder emailed to ${clientEmail} successfully.`;
      setMessage({ type: "success", text });
      toast.success(text, { id: toastId });
    } else {
      const text = res.error || "Failed to send reminder.";
      setMessage({ type: "error", text });
      toast.error(text, { id: toastId });
    }
  }

  return (
    <div className="card-modern p-4 sm:p-6 space-y-6 font-mono text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">CONTROL_PANEL // LIFECYCLE_MANAGEMENT</span>
          <h3 className="font-semibold uppercase tracking-tight text-sm mt-1 text-black font-sans">Status &amp; Actions</h3>
          {parentDocument && (
            <p className="text-[10px] text-zinc-500 mt-1">
              Derived from:{" "}
              <Link
                href={`/workspaces/${shopSlug}/documents/${parentDocument.id}`}
                className="font-semibold text-black underline hover:no-underline"
              >
                {parentDocument.docNumber} ({parentDocument.type})
              </Link>
            </p>
          )}
        </div>

        {/* 1-CLICK DOCUMENT ACTIONS POPOVER */}
        <DocumentActionsPopover
          documentId={documentId}
          shopId={shopId}
          shopSlug={shopSlug}
          docType={docType}
          items={items}
          kraCuInvoiceNumber={kraCuInvoiceNumber}
        />
      </div>

      {message && (
        <div className={`border p-3 font-semibold uppercase tracking-tight text-xs rounded ${
          message.type === "success"
            ? "border-black bg-black text-white"
            : "border-zinc-200 bg-zinc-50 text-black"
        }`}>
          &gt; {message.text}
        </div>
      )}

      {/* STATUS TOGGLE */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Update Document Status</p>
          {status === "PAID" && (
            <span className="text-[9px] text-zinc-400 italic">PAID status is final. Use Credit Note to reverse.</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const isBlocked = status === "PAID" && opt.value !== "PAID";
            return (
              <button
                key={opt.value}
                type="button"
                disabled={saving || isBlocked}
                onClick={() => handleStatusUpdate(opt.value)}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border transition-colors rounded-none disabled:opacity-40 ${
                  status === opt.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-zinc-600 border-zinc-300 hover:border-black hover:text-black"
                }`}
              >
                {saving && status !== opt.value ? "..." : opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* PORTAL LINK + EMAIL */}
      <div className="border-t border-zinc-200 pt-4 space-y-3">
        <p className="text-[10px] text-zinc-400 uppercase font-semibold">Client Delivery Actions</p>

        {portalLink && (
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <span className="text-zinc-500 text-[10px] uppercase">Portal Link:</span>
            <a
              href={portalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black underline underline-offset-2 font-bold text-[11px] break-all hover:no-underline"
            >
              {portalLink}
            </a>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {portalLink && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(portalLink);
                setMessage({ type: "success", text: "Portal link copied to clipboard." });
                toast.success("Portal link copied to clipboard.");
              }}
              className="border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-50 transition-colors rounded-none"
            >
              Copy Portal Link
            </button>
          )}

          <button
            type="button"
            disabled={sending}
            onClick={handleSendEmail}
            className="border border-black bg-black text-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors rounded-none disabled:bg-zinc-400"
          >
            {sending ? "Dispatching..." : `Email to ${clientEmail}`}
          </button>

          {portalLink && (
            <a
              href={portalLink.replace("/portal/invoice/", "/portal/pdf/")}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-300 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:border-black hover:bg-zinc-50 transition-colors rounded-none no-underline text-black"
            >
              Download PDF
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              duplicateDocMutation.mutate(documentId, {
                onSuccess: (data) => {
                  if (data.documentId) {
                    router.push(`/workspaces/${shopSlug}/documents/${data.documentId}`);
                  }
                },
              });
            }}
            className="border border-zinc-400 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:border-black transition-colors rounded-none"
          >
            Duplicate
          </button>

          {status === "DRAFT" && (
            <Link
              href={`/workspaces/${shopSlug}/documents/${documentId}/edit`}
              className="border border-black bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-50 transition-colors rounded-none no-underline text-black inline-block"
            >
              Edit Draft
            </Link>
          )}

          {status === "DRAFT" ? (
            <button
              type="button"
              onClick={() => {
                if (!confirm("Are you sure you want to delete this DRAFT document? This action cannot be undone.")) return;
                deleteDocMutation.mutate(documentId, {
                  onSuccess: () => {
                    router.push(`/workspaces/${shopSlug}/documents`);
                  },
                });
              }}
              className="border border-rose-600 text-rose-600 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-colors rounded-none"
            >
              Delete Draft
            </button>
          ) : (
            <span
              title="Issued or Paid documents cannot be deleted. Raise a Credit Note to reverse financial value."
              className="border border-zinc-200 bg-zinc-100 text-zinc-400 px-3 py-2 text-[10px] font-bold uppercase tracking-wider cursor-not-allowed select-none"
            >
              🔒 Deletion Blocked (Audit Protected)
            </span>
          )}
        </div>
      </div>

      {/* KRA eTIMS / CONTROL UNIT SERIAL NUMBER (OPTIONAL STATUTORY FIELD) */}
      <div className="border border-zinc-200/80 p-4 bg-zinc-50/50 rounded space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold uppercase text-black">Statutory KRA eTIMS CU Serial Number</span>
          {requiresEtims && !cuNumber ? (
            <span className="border border-amber-300 bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-tight rounded">
              ⚠️ eTIMS CU Serial Pending
            </span>
          ) : (
            <span className="text-[9px] text-zinc-400 italic">Optional Tax Control Number</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={cuNumber}
            onChange={(e) => setCuNumber(e.target.value)}
            placeholder="e.g. CU0123456789/2026"
            className="flex-1 px-3 py-1.5 border border-zinc-300 rounded bg-white focus:outline-none focus:border-black text-xs uppercase font-mono"
          />
          <button
            type="button"
            onClick={handleSaveCuNumber}
            disabled={savingCu}
            className="btn-primary-modern px-4 py-1.5 font-semibold uppercase text-[10px] disabled:bg-zinc-400"
          >
            {savingCu ? "Saving..." : "Save CU #"}
          </button>
        </div>
      </div>

      {/* MAIN EMAIL DISPATCH & REMINDER */}
      <div className="flex gap-4">
        <button
          onClick={handleSendEmail}
          disabled={sending || !clientEmail}
          className="flex-1 border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 font-mono text-[10px] font-bold uppercase transition-colors"
        >
          {sending ? "Dispatching..." : clientEmail ? "✉ Email Secure Portal Link" : "✉ Missing Client Email"}
        </button>
        
        {(docType === "INVOICE" && currentStatus === "OVERDUE") && (
          <button
            onClick={handleSendReminder}
            disabled={sending || !clientEmail}
            className="flex-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 font-mono text-[10px] font-bold uppercase transition-colors"
          >
            {sending ? "Dispatching..." : "🔔 Send Aging Reminder"}
          </button>
        )}
      </div>

      {/* PAYMENT CONFIRMATION DETAILS (OPTIONAL) */}
      <div className="border border-zinc-200/80 p-4 bg-zinc-50/50 rounded space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold uppercase text-black">Payment Confirmation &amp; Remittance Ref</span>
          <span className="text-[9px] text-zinc-400 italic">Optional Settlement Details</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={paymentChannel}
            onChange={(e) => setPaymentChannel(e.target.value)}
            className="w-full px-3 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs uppercase"
          >
            <option value="">-- PAYMENT CHANNEL / METHOD --</option>
            <option value="BANK">Bank Account / Transfer</option>
            <option value="MPESA">M-Pesa (Till / Paybill)</option>
            <option value="CASH">Cash Settlement</option>
            <option value="CHEQUE">Bank Cheque</option>
            <option value="OTHER">Other Custom Method</option>
          </select>
          <input
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="e.g. M-Pesa Code QAB71239X or Bank Ref"
            className="w-full px-3 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs uppercase"
          />
        </div>
      </div>
    </div>
  );
}
