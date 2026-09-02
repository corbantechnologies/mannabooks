// src/app/workspaces/[slug]/documents/[id]/DocumentStatusPanel.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateDocumentStatus, useDuplicateDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { dispatchDocumentEmail } from "@/lib/actions/email";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

import { DocumentActionsPopover } from "./DocumentActionsPopover";
import { updateDocumentKraCuNumberAction, DocumentType } from "@/lib/actions/documents";
import { isFiscalDocType } from "@/lib/utils";
import Link from "next/link";
import { ThermalReceiptModal, type ThermalReceiptData } from "@/components/ThermalReceiptModal";

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
  currentStatus: "DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "PARTIALLY_PAID" | "RECEIVED" | "CANCELLED";
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
  shopName?: string;
  shopShortName?: string | null;
  shopPhone?: string | null;
  shopEmail?: string | null;
  shopTaxPin?: string | null;
  shopVatNumber?: string | null;
  currency?: string;
  subTotal?: string | number;
  taxAmount?: string | number;
  grandTotal?: string | number;
  partyName?: string;
  partyPhone?: string | null;
  partyTaxPin?: string | null;
  issueDate?: string | Date;
}

const DEFAULT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED", label: "Issued" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
];

const SUPPLIER_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED", label: "Issued" },
  { value: "RECEIVED", label: "Received" },
  { value: "PAID", label: "Paid" },
];

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
  shopName,
  shopShortName,
  shopPhone,
  shopEmail,
  shopTaxPin,
  shopVatNumber,
  currency,
  subTotal,
  taxAmount,
  grandTotal,
  partyName,
  partyPhone,
  partyTaxPin,
  issueDate,
}: DocumentStatusPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "RECEIVED" | "CANCELLED">(currentStatus as any);
  const [cuNumber, setCuNumber] = useState(kraCuInvoiceNumber || "");
  const [paymentChannel, setPaymentChannel] = useState(initialPaymentChannel || "");
  const [paymentReference, setPaymentReference] = useState(initialPaymentReference || "");
  const [savingCu, setSavingCu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showThermalModal, setShowThermalModal] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

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
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Manage Lifecycle</span>
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
          status={status}
        />
      </div>

      {message && (
        <div className={`border p-3 font-semibold text-xs rounded ${
          message.type === "success"
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-rose-200 bg-rose-50 text-rose-800"
        }`}>
          {message.type === "success" ? "✓ " : "⚠ "}{message.text}
        </div>
      )}

      {/* STATUS TOGGLE */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Update Document Status</p>
          {status === "PAID" && (
            <span className="text-[9px] text-zinc-400 italic">PAID status is final. Use Credit Note to reverse.</span>
          )}
          {status === "CANCELLED" && (
            <span className="text-[9px] text-rose-600 italic">CANCELLED status is final. Document is voided.</span>
          )}
        </div>

        {/* QUICK RECEIVE ACTION FOR LPO / PO */}
        {(docType === "LPO" || docType === "PO") && status !== "RECEIVED" && status !== "PAID" && status !== "CANCELLED" && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-sans text-xs font-bold text-emerald-900">📦 Goods Delivered from Supplier?</p>
              <p className="font-sans text-[11px] text-emerald-700 mt-0.5">
                Marking as received will automatically increment your product and warehouse location stock.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleStatusUpdate("RECEIVED")}
              disabled={updateStatusMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-xs font-semibold px-3.5 py-1.5 rounded transition-colors shrink-0 shadow-2xs"
            >
              {updateStatusMutation.isPending && updateStatusMutation.variables?.status === "RECEIVED" ? "Receiving..." : "Mark as Received"}
            </button>
          </div>
        )}

        {status === "RECEIVED" && (docType === "LPO" || docType === "PO" || docType === "GOODS_RECEIVED_NOTE") && (
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded text-xs font-semibold text-emerald-900 flex items-center gap-2 font-sans">
            <span>✓</span>
            <span>Goods marked as received. Inventory quantities and location balances have been credited.</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {(["LPO", "PO", "GOODS_RECEIVED_NOTE", "PAYMENT_VOUCHER"].includes(docType) ? SUPPLIER_STATUS_OPTIONS : DEFAULT_STATUS_OPTIONS).map((opt) => {
            const isBlocked = (status === "PAID" || status === "CANCELLED") && opt.value !== status;
            const isCurrentPending = updateStatusMutation.isPending && updateStatusMutation.variables?.status === opt.value;
            const isActive = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={updateStatusMutation.isPending || isBlocked}
                onClick={() => handleStatusUpdate(opt.value as any)}
                className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider border transition-all rounded-md disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-emerald-900 text-white border-emerald-900 shadow-2xs"
                    : "bg-white text-zinc-700 border-zinc-300 hover:border-emerald-600 hover:bg-emerald-50/50 hover:text-emerald-900"
                }`}
              >
                {isCurrentPending ? (
                  <>
                    <Spinner size={10} color={isActive ? "white" : "currentColor"} />
                    <span>{opt.label}</span>
                  </>
                ) : (
                  opt.label
                )}
              </button>
            );
          })}

          {status === "CANCELLED" && (
            <button
              type="button"
              disabled
              className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider border bg-rose-600 text-white border-rose-600 rounded-md cursor-not-allowed"
            >
              Cancelled
            </button>
          )}
        </div>
      </div>

      {/* CLIENT DELIVERY ACTIONS & SHARING POPOVER */}
      <div className="border-t border-zinc-200/80 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Client Delivery &amp; Distribution</p>
          {status !== "DRAFT" && (
            <span
              title="Issued or Paid documents cannot be deleted. Raise a Credit Note to reverse financial value."
              className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1"
            >
              🔒 Audit Protected
            </span>
          )}
        </div>

        {portalLink && (
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <span className="text-zinc-500 text-[10px] uppercase">Portal Link:</span>
            <a
              href={portalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-800 underline underline-offset-2 font-bold text-xs break-all hover:text-emerald-950"
            >
              {portalLink}
            </a>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* PRIMARY DIRECT DISPATCH CTA */}
          <button
            type="button"
            disabled={sending || !clientEmail}
            onClick={handleSendEmail}
            className="btn-primary-modern px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider disabled:bg-zinc-400 disabled:opacity-50"
          >
            {sending ? (
              <span className="flex items-center justify-center gap-1.5">
                <Spinner size={10} color="white" />
                <span>Dispatching...</span>
              </span>
            ) : clientEmail ? (
              `Email to ${clientEmail}`
            ) : (
              "Missing Client Email"
            )}
          </button>

          {/* AGING REMINDER FOR OVERDUE INVOICES */}
          {docType === "INVOICE" && status === "OVERDUE" && (
            <button
              type="button"
              disabled={sending || !clientEmail}
              onClick={handleSendReminder}
              className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 disabled:opacity-50"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Spinner size={10} color="currentColor" />
                  <span>Dispatching...</span>
                </span>
              ) : (
                "🔔 Send Aging Reminder"
              )}
            </button>
          )}

          {/* SHARE & EXPORT POPOVER DROPDOWN */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsShareOpen(!isShareOpen)}
              className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
            >
              <span>Share &amp; Export</span>
              <span className="text-[9px] opacity-70">{isShareOpen ? "▲" : "▼"}</span>
            </button>

            {isShareOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-56 bg-white border border-zinc-200/80 rounded-xl shadow-xl z-40 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Export &amp; Share
                </div>

                {portalLink && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(portalLink);
                      setMessage({ type: "success", text: "Portal link copied to clipboard." });
                      toast.success("Portal link copied to clipboard.");
                      setIsShareOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>🔗</span> Copy Portal Link
                  </button>
                )}

                {portalLink && (
                  <a
                    href={portalLink.replace("/portal/invoice/", "/portal/pdf/")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsShareOpen(false)}
                    className="w-full text-left px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors flex items-center gap-2 no-underline"
                  >
                    <span>📄</span> Download PDF
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowThermalModal(true);
                    setIsShareOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>🖨️</span> Print Thermal Slip
                </button>

                <button
                  type="button"
                  disabled={duplicateDocMutation.isPending}
                  onClick={() => {
                    setIsShareOpen(false);
                    duplicateDocMutation.mutate(documentId, {
                      onSuccess: (data) => {
                        if (data.documentId) {
                          router.push(`/workspaces/${shopSlug}/documents/${data.documentId}`);
                        }
                      },
                    });
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>📋</span> {duplicateDocMutation.isPending ? "Duplicating..." : "Duplicate Document"}
                </button>

                {status === "DRAFT" && (
                  <div className="border-t border-zinc-100 my-1 pt-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Draft Management
                    </div>
                    <Link
                      href={`/workspaces/${shopSlug}/documents/${documentId}/edit`}
                      onClick={() => setIsShareOpen(false)}
                      className="w-full text-left px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-2 no-underline"
                    >
                      <span>✏️</span> Edit Draft
                    </Link>

                    {showDeleteConfirm ? (
                      <div className="p-2 bg-rose-50 rounded-lg space-y-1.5 mt-1">
                        <span className="text-[10px] text-rose-700 font-bold uppercase block">Purge this draft?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deleteDocMutation.isPending}
                            onClick={() => {
                              deleteDocMutation.mutate(documentId, {
                                onSuccess: () => {
                                  router.push(`/workspaces/${shopSlug}/documents`);
                                },
                              });
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 text-[10px] font-semibold uppercase rounded-md"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="btn-secondary-modern px-2 py-1 text-[10px] font-semibold uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full text-left px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>🗑️</span> Delete Draft
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KRA eTIMS / CONTROL UNIT SERIAL NUMBER (OPTIONAL STATUTORY FIELD) */}
      <div className="border border-zinc-200/80 p-4 bg-zinc-50/50 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold uppercase text-black">Statutory KRA eTIMS CU Serial Number</span>
          {isFiscalDocType(docType) && requiresEtims && !cuNumber ? (
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
            {savingCu ? (
              <span className="flex items-center justify-center gap-1.5">
                <Spinner size={10} color="white" />
                <span>Saving...</span>
              </span>
            ) : (
              "Save CU #"
            )}
          </button>
        </div>
      </div>

      {/* SETTLEMENT CONFIRMATION / PAYMENT REMITTANCE */}
      {(status === "PAID" || status === "RECEIVED") ? (
        <div className="border border-emerald-200/80 bg-emerald-50/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-700 font-bold text-xs">✓</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">
                Payment Settled &amp; Recorded
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 font-sans">
              {paymentChannel || paymentReference ? (
                <>
                  Settlement via <strong className="font-semibold uppercase">{paymentChannel || "Direct Remittance"}</strong>
                  {paymentReference && <> • Ref: <span className="font-mono font-bold">{paymentReference}</span></>}
                </>
              ) : (
                "Settlement transaction recorded in the Payment History ledger."
              )}
            </p>
          </div>
          <span className="badge-emerald self-start sm:self-auto text-[10px] px-2.5 py-1">
            PAID IN FULL
          </span>
        </div>
      ) : (
        <div className="border border-zinc-200/80 p-4 bg-zinc-50/50 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold uppercase text-black">Payment Confirmation &amp; Remittance Ref</span>
            <span className="text-[9px] text-zinc-400 italic">Optional Settlement Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={paymentChannel}
              onChange={(e) => setPaymentChannel(e.target.value)}
              className="w-full px-3 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs uppercase rounded-md"
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
              className="w-full px-3 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs uppercase rounded-md"
            />
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT MODAL */}
      <ThermalReceiptModal
        isOpen={showThermalModal}
        onClose={() => setShowThermalModal(false)}
        receipt={{
          shopName: shopName || "Business Tenant",
          shopShortName: shopShortName,
          shopPhone: shopPhone,
          shopEmail: shopEmail,
          shopWebsite: undefined,
          shopTaxPin: shopTaxPin,
          shopVatNumber: shopVatNumber,
          currency: currency || "KES",
          docNumber: docNumber,
          docType: docType,
          issueDate: issueDate || new Date(),
          customerName: partyName,
          customerPhone: partyPhone,
          customerTaxPin: partyTaxPin,
          items: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            itemTotal: i.itemTotal,
          })),
          subTotal: subTotal || "0.00",
          taxAmount: taxAmount || "0.00",
          grandTotal: grandTotal || "0.00",
          paymentChannel: paymentChannel,
          paymentReference: paymentReference,
          kraCuInvoiceNumber: cuNumber || kraCuInvoiceNumber,
          cashierName: "System Operator",
          footerNote: "THANK YOU FOR YOUR BUSINESS!",
        }}
      />
    </div>
  );
}
