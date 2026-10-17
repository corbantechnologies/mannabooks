// src/app/workspaces/[slug]/documents/[id]/DocumentStatusPanel.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDuplicateDocument, useDeleteDocument } from "@/hooks/useDocuments";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

import { DocumentActionsPopover } from "./DocumentActionsPopover";
import { DocumentLifecycle, type DocumentWorkflow } from "./DocumentLifecycle";
import type { DocumentType } from "@/types/models";
import { isFiscalDocType } from "@/lib/utils";
import Link from "next/link";
import { ThermalReceiptModal, type ThermalReceiptData } from "@/components/ThermalReceiptModal";
import ReceiptAttachmentUploader from "@/components/ReceiptAttachmentUploader";

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
  currentStatus: string;
  docType: DocumentType;
  workflow: DocumentWorkflow;
  items: DocumentItem[];
  portalLink: string | null;
  clientEmail: string;
  docNumber: string;
  dueDate?: string | Date | null;
  kraCuInvoiceNumber?: string | null;
  requiresEtims?: boolean;
  initialPaymentChannel?: string | null;
  initialPaymentReference?: string | null;
  parentDocument?: { id: string; docNumber: string; type: string } | null;
  childDocuments?: Array<{ id: string; docNumber: string; type: string; status: string }> | null;
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
  initialAttachmentUrl?: string | null;
  initialAttachmentName?: string | null;
  initialAttachmentSize?: number | null;
}

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
  dueDate: _dueDate,
  kraCuInvoiceNumber,
  requiresEtims = false,
  initialPaymentChannel = "",
  initialPaymentReference = "",
  parentDocument,
  childDocuments,
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
  initialAttachmentUrl,
  initialAttachmentName,
  initialAttachmentSize,
  workflow,
}: DocumentStatusPanelProps) {
  const router = useRouter();
  const status = currentStatus;
  const [cuNumber, setCuNumber] = useState(kraCuInvoiceNumber || "");
  const [paymentChannel, setPaymentChannel] = useState(initialPaymentChannel || (docType === "PAYMENT_VOUCHER" ? "BANK" : ""));
  const [paymentReference, setPaymentReference] = useState(initialPaymentReference || "");
  const [attachmentUrl, setAttachmentUrl] = useState(initialAttachmentUrl || "");
  const [attachmentName, setAttachmentName] = useState(initialAttachmentName || "");
  const [attachmentSize, setAttachmentSize] = useState<number | undefined>(initialAttachmentSize || undefined);
  const [savingCu, setSavingCu] = useState(false);
  const [savingSettlement, setSavingSettlement] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showThermalModal, setShowThermalModal] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const duplicateDocMutation = useDuplicateDocument(shopId, shopSlug);
  const deleteDocMutation = useDeleteDocument(shopId, shopSlug);

  async function handleSaveCuNumber() {
    setSavingCu(true);
    try {
      const res = await axiosClient.patch(`/documents/${documentId}?shop_id=${shopId}`, {
        kra_cu_invoice_number: cuNumber || null,
      });
      if (res.data?.id) {
        toast.success("KRA eTIMS CU Serial Number saved.");
        router.refresh();
      } else {
        toast.error("Failed to update eTIMS CU Number.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update eTIMS CU Number.");
    } finally {
      setSavingCu(false);
    }
  }

  async function handleSaveSettlement() {
    setSavingSettlement(true);
    try {
      const res = await axiosClient.patch(`/documents/${documentId}?shop_id=${shopId}`, {
        kra_cu_invoice_number: cuNumber || null,
        payment_channel: paymentChannel || null,
        payment_reference: paymentReference || null,
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
        attachment_size: attachmentSize || null,
      });
      if (res.data?.id) {
        toast.success(
          docType === "PAYMENT_VOUCHER"
            ? "Supplier receipt & disbursement details recorded!"
            : "Settlement & receipt details saved."
        );
        router.refresh();
      } else {
        toast.error("Failed to save settlement details.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "An unexpected error occurred while saving settlement.");
    } finally {
      setSavingSettlement(false);
    }
  }

  async function executeSendEmail(targetEmail: string, isReminder = false) {
    setSending(true);
    const toastId = toast.loading(
      isReminder
        ? `Dispatching aging reminder to ${targetEmail}...`
        : `Dispatching email to ${targetEmail}...`
    );

    try {
      // Next.js route handler (not the FastAPI proxy): it renders and sends the email via Resend.
      const res = {
        data: await fetch("/api/documents/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, documentId, recipientEmail: targetEmail, isReminder }),
        }).then((r) => r.json()),
      };
      setSending(false);

      if (res.data?.success) {
        toast.success(
          isReminder
            ? `Aging reminder sent to ${targetEmail}!`
            : `Document successfully emailed to ${targetEmail}!`,
          { id: toastId }
        );
      } else {
        toast.error(res.data?.error || "Failed to send email.", { id: toastId });
      }
    } catch (err: any) {
      setSending(false);
      toast.error(err?.response?.data?.error || "Error dispatching email.", { id: toastId });
    }
  }

  function promptEmailDispatch(isReminder = false) {
    const defaultEmail = clientEmail || "";
    let editedEmail = defaultEmail;

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-in fade-in zoom-in-95 duration-200" : "animate-out fade-out zoom-out-95 duration-150"
          } max-w-md w-full bg-white border border-zinc-200/90 rounded-xl shadow-2xl p-4 space-y-3 font-sans text-xs text-black pointer-events-auto`}
        >
          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{isReminder ? "🔔" : "✉️"}</span>
              <div>
                <p className="font-bold text-sm uppercase tracking-tight text-black">
                  {isReminder ? "Send Aging Reminder" : "Email Document"}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {docNumber} ({docType})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="text-zinc-400 hover:text-black p-1 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-zinc-500 block">
              Recipient Email Address
            </label>
            <input
              type="email"
              defaultValue={defaultEmail}
              onChange={(e) => {
                editedEmail = e.target.value;
              }}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black text-xs font-mono bg-white"
              autoFocus
            />
            <p className="text-[10px] text-zinc-400 font-sans">
              Confirm or edit the email address before dispatching via secure mail gateway.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const finalEmail = editedEmail.trim();
                if (!finalEmail || !finalEmail.includes("@")) {
                  toast.error("Please enter a valid recipient email address.");
                  return;
                }
                toast.dismiss(t.id);
                executeSendEmail(finalEmail, isReminder);
              }}
              className="btn-primary-modern px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-2xs"
            >
              Confirm &amp; Send
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  }

  return (
    <div className="card-modern p-4 sm:p-6 space-y-5 font-mono text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Manage Lifecycle</span>
          <h3 className="font-semibold uppercase tracking-tight text-sm mt-1 text-black font-sans">Status &amp; Actions</h3>
          {parentDocument && (
            <p className="text-[10px] text-zinc-500 mt-1">
              Derived from:{" "}
              <Link
                href={`/workspaces/${shopSlug}/documents/${parentDocument.id}`}
                className="font-semibold text-black underline hover:no-underline font-mono"
              >
                {parentDocument.docNumber} ({parentDocument.type})
              </Link>
            </p>
          )}
          {childDocuments && childDocuments.length > 0 && (
            <div className="text-[10px] text-zinc-500 mt-1 flex flex-wrap items-center gap-1.5">
              <span>Progressed to:</span>
              {childDocuments.map((child) => (
                <Link
                  key={child.id}
                  href={`/workspaces/${shopSlug}/documents/${child.id}`}
                  className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded underline hover:no-underline font-mono"
                >
                  {child.docNumber} ({child.type}) ➔
                </Link>
              ))}
            </div>
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
          workflow={workflow}
        />
      </div>

      {/* LIFECYCLE: only the actions the API allows for this document */}
      <DocumentLifecycle
        documentId={documentId}
        shopId={shopId}
        docType={docType}
        status={status}
        workflow={workflow}
        currency={currency || "KES"}
      />

      {/* CLIENT DELIVERY ACTIONS & SHARING POPOVER */}
      <div className="border-t border-zinc-200/80 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Client Delivery &amp; Distribution</p>
          {status !== "DRAFT" && (
            <span
              title="Issued documents can't be edited or deleted. Void them, or raise a credit note to correct amounts."
              className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1"
            >
              🔒 Audit Protected
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PRIMARY CONFIRMABLE DISPATCH CTA */}
          <button
            type="button"
            disabled={sending}
            onClick={() => promptEmailDispatch(false)}
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
              "Email Document"
            )}
          </button>

          {/* AGING REMINDER FOR OVERDUE INVOICES */}
          {docType === "INVOICE" && status === "OVERDUE" && (
            <button
              type="button"
              disabled={sending}
              onClick={() => promptEmailDispatch(true)}
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
                      onSuccess: (data: any) => {
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

                {(workflow.canEdit || workflow.canDelete) && (
                  <div className="border-t border-zinc-100 my-1 pt-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Draft Management
                    </div>
                    {workflow.canEdit && <Link
                      href={`/workspaces/${shopSlug}/documents/${documentId}/edit`}
                      onClick={() => setIsShareOpen(false)}
                      className="w-full text-left px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-2 no-underline"
                    >
                      <span>✏️</span> Edit Draft
                    </Link>}

                    {!workflow.canDelete ? null : showDeleteConfirm ? (
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

      {/* VENDOR RECEIPT & SETTLEMENT DETAILS FOR PAYMENT VOUCHER */}
      {docType === "PAYMENT_VOUCHER" && (
        <div className="border-t border-zinc-200/80 pt-4 space-y-3 bg-zinc-50/70 p-4 rounded-lg border border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-sans text-xs font-bold text-black uppercase tracking-tight flex items-center gap-1.5">
                <span>🧾</span>
                <span>Supplier Official Receipt &amp; Settlement Recording</span>
              </p>
              <p className="font-sans text-[11px] text-zinc-500 mt-0.5">
                Record the vendor&apos;s ETR tax invoice / eTIMS receipt number and disbursement reference for compliance.
              </p>
            </div>
            {cuNumber ? (
              <span className="badge-emerald text-[10px] shrink-0">✓ Receipt Recorded</span>
            ) : (
              <span className="badge-amber text-[10px] shrink-0">⚠️ Receipt Pending</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 font-semibold uppercase block">
                Supplier Receipt / eTIMS CU # *
              </label>
              <input
                type="text"
                value={cuNumber}
                onChange={(e) => setCuNumber(e.target.value)}
                placeholder="e.g. CU0123456789/2026 or REC-9821"
                className="w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs uppercase font-mono bg-white focus:outline-none focus:border-black font-semibold h-[33px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 font-semibold uppercase block">
                Disbursement Channel
              </label>
              <select
                value={paymentChannel}
                onChange={(e) => setPaymentChannel(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs font-semibold uppercase bg-white focus:outline-none focus:border-black h-[33px]"
              >
                <option value="BANK">Bank Transfer (EFT / RTGS)</option>
                <option value="MPESA">M-Pesa (Paybill / Till / Direct)</option>
                <option value="CASH">Cash / Petty Cash</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="OTHER">Other Disbursement</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 font-semibold uppercase block">
                Transaction Reference #
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. QAB71239X or CHQ-0045"
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs font-mono bg-white focus:outline-none focus:border-black font-semibold uppercase h-[33px]"
                />
                <button
                  type="button"
                  onClick={handleSaveSettlement}
                  disabled={savingSettlement}
                  className="btn-primary-modern px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 h-[33px]"
                >
                  {savingSettlement ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* MINIO RECEIPT ATTACHMENT */}
          <div className="pt-2 border-t border-zinc-200">
            <ReceiptAttachmentUploader
              shopSlug={shopSlug}
              category="payment-vouchers"
              attachmentUrl={attachmentUrl}
              attachmentName={attachmentName}
              attachmentSize={attachmentSize}
              onUploadSuccess={async (data) => {
                setAttachmentUrl(data.url);
                setAttachmentName(data.name);
                setAttachmentSize(data.size);
                await axiosClient.patch(`/documents/${documentId}?shop_id=${shopId}`, {
                  attachment_url: data.url,
                  attachment_name: data.name,
                  attachment_size: data.size,
                });
                router.refresh();
              }}
              onRemove={async () => {
                setAttachmentUrl("");
                setAttachmentName("");
                setAttachmentSize(undefined);
                await axiosClient.patch(`/documents/${documentId}?shop_id=${shopId}`, {
                  attachment_url: null,
                  attachment_name: null,
                  attachment_size: null,
                });
                router.refresh();
              }}
              label="Supplier Official Receipt / Proof Attachment (MinIO)"
              helperText="Upload official eTIMS CU receipt PDF, photo of paper receipt, or bank disbursement slip"
            />
          </div>
        </div>
      )}

      {/* COMPACT KRA eTIMS CU SERIAL NUMBER (IF FISCAL DOC TYPE) */}
      {isFiscalDocType(docType) && docType !== "PAYMENT_VOUCHER" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-zinc-100 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase text-zinc-500">Statutory KRA eTIMS CU:</span>
            {requiresEtims && !cuNumber && (
              <span className="badge-amber text-[9px]">CU Pending</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 max-w-sm w-full sm:w-auto">
            <input
              type="text"
              value={cuNumber}
              onChange={(e) => setCuNumber(e.target.value)}
              placeholder="e.g. CU0123456789/2026"
              className="px-2.5 py-1 border border-zinc-300 rounded text-xs uppercase font-mono flex-1 sm:w-48 bg-white focus:outline-none focus:border-black"
            />
            <button
              type="button"
              onClick={handleSaveCuNumber}
              disabled={savingCu}
              className="btn-secondary-modern px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            >
              {savingCu ? "Saving..." : "Save CU"}
            </button>
          </div>
        </div>
      )}

      {/* UNIVERSAL MEDIA ATTACHMENT FOR EXISTING DOCUMENTS (INVOICES, LPOs, LSOs, ETC.) */}
      {docType !== "PAYMENT_VOUCHER" && (
        <div className="border-t border-zinc-100 pt-3">
          <ReceiptAttachmentUploader
            shopSlug={shopSlug}
            category={
              docType === "INVOICE"
                ? "receipts"
                : docType === "LPO" || docType === "PO"
                ? "payment-vouchers"
                : "attachments"
            }
            attachmentUrl={attachmentUrl}
            attachmentName={attachmentName}
            attachmentSize={attachmentSize}
            onUploadSuccess={async (data) => {
              setAttachmentUrl(data.url);
              setAttachmentName(data.name);
              setAttachmentSize(data.size);
              await axiosClient.patch(`/documents/${documentId}?shop_id=${shopId}`, {
                attachment_url: data.url,
                attachment_name: data.name,
                attachment_size: data.size,
              });
              router.refresh();
            }}
            onRemove={async () => {
              setAttachmentUrl("");
              setAttachmentName("");
              setAttachmentSize(undefined);
              await axiosClient.patch(`/documents/${documentId}?shop_id=${shopId}`, {
                attachment_url: null,
                attachment_name: null,
                attachment_size: null,
              });
              router.refresh();
            }}
            label={
              docType === "INVOICE"
                ? "Attached Tax Invoice / Stamped Client Copy (MinIO)"
                : docType === "LPO" || docType === "PO"
                ? "Attached Supplier Proforma / Order Acceptance (MinIO)"
                : docType === "LSO" || docType === "SERVICE_COMPLETION_NOTE"
                ? "Attached Service Completion Certificate / Sign-off (MinIO)"
                : docType === "DELIVERY_NOTE" || docType === "GOODS_RECEIVED_NOTE"
                ? "Attached Stamped Delivery Note / Gate Pass (MinIO)"
                : "Document Attachment / Media Proof (MinIO)"
            }
            helperText="Attach signed copy, eTIMS invoice scan, delivery note, or photo proof (Max 10MB to media.mannabooks.co.ke)"
            compact
          />
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
