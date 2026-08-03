// src/app/workspaces/[slug]/documents/[id]/DocumentActionsPopover.tsx
"use client";

import { useState } from "react";
import { convertDocumentAction, cancelQuotationAction, cancelInvoiceAction, DocumentType } from "@/lib/actions/documents";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CreditNotePopover } from "./CreditNotePopover";

interface DocumentItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  itemTotal: string;
}

interface DocumentActionsPopoverProps {
  documentId: string;
  shopId: string;
  shopSlug: string;
  docType: DocumentType;
  items: DocumentItem[];
  kraCuInvoiceNumber?: string | null;
  status: "DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "PARTIALLY_PAID" | "RECEIVED" | "CANCELLED";
}

export function DocumentActionsPopover({
  documentId,
  shopId,
  shopSlug,
  docType,
  items,
  kraCuInvoiceNumber,
  status,
}: DocumentActionsPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function handleCancelQuotation() {
    setLoading(true);
    setConfirmCancel(false);
    try {
      const res = await cancelQuotationAction(shopId, documentId);
      if (res.success) {
        toast.success("Quotation has been successfully cancelled.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to cancel quotation.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during cancellation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelInvoice() {
    setLoading(true);
    setConfirmCancel(false);
    try {
      const res = await cancelInvoiceAction(shopId, documentId);
      if (res.success) {
        toast.success("Invoice successfully cancelled & reversed in GL.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to cancel invoice.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during cancellation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConvert(targetType: DocumentType) {
    setLoading(true);
    setIsOpen(false);
    try {
      const res = await convertDocumentAction(documentId, targetType, shopId, shopSlug);
      if (res.success) {
        toast.success(`Generated ${targetType} (${res.serial}) successfully.`);
        router.push(`/workspaces/${shopSlug}/documents/${res.newDocumentId}`);
      } else {
        toast.error(res.error || "Failed to execute conversion.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during document conversion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="border border-black bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-2"
      >
        <span>⚡ Document Actions</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* POPOVER MENU PANEL */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 border border-black bg-white shadow-lg z-40 font-mono text-xs divide-y divide-zinc-200 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 bg-zinc-50 font-bold uppercase text-[9px] text-zinc-400">
            Lifecycle Conversions
          </div>

          {/* QUOTATION CONVERSIONS */}
          {docType === "QUOTATION" && (
            <>
              {status !== "CANCELLED" && (
                <button
                  onClick={() => handleConvert("INVOICE")}
                  className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
                >
                  ➔ Convert to Invoice
                </button>
              )}

              {status !== "CANCELLED" ? (
                confirmCancel ? (
                  <div className="bg-rose-50 p-2 flex flex-col gap-1 border-t border-zinc-200">
                    <span className="text-[9px] text-rose-600 font-bold uppercase block px-2 leading-tight">Cancel this quotation?</span>
                    <button
                      onClick={handleCancelQuotation}
                      className="w-full text-left px-2 py-1 text-rose-700 hover:bg-rose-600 hover:text-white font-bold uppercase text-[10px] rounded transition-colors"
                    >
                      Confirm Cancel
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="w-full text-left px-2 py-1 text-zinc-500 hover:bg-zinc-100 font-bold uppercase text-[10px] rounded transition-colors"
                    >
                      Keep Quotation
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-bold uppercase text-[11px] transition-colors border-t border-zinc-100"
                  >
                    ➔ Cancel Quotation
                  </button>
                )
              ) : (
                <div className="px-4 py-2 text-[10px] text-zinc-400 italic font-semibold">
                  Quotation Cancelled
                </div>
              )}
            </>
          )}

          {/* INVOICE CONVERSIONS & CREDIT NOTES */}
          {docType === "INVOICE" && (
            <>
              <button
                onClick={() => handleConvert("RECEIPT")}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
              >
                ➔ Issue Official Receipt
              </button>

              <button
                onClick={() => handleConvert("DELIVERY_NOTE")}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
              >
                ➔ Generate Delivery Note
              </button>

              <button
                onClick={() => {
                  if (status !== "PAID") return;
                  setIsOpen(false);
                  setShowCreditNoteModal(true);
                }}
                disabled={status !== "PAID"}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={status !== "PAID" ? "Invoice must be paid to raise a credit note" : ""}
              >
                ➔ Raise Credit Note {status !== "PAID" && "(Invoice Unpaid)"}
              </button>

              <button
                onClick={() => handleConvert("DEBIT_NOTE")}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
              >
                ➔ Raise Debit Note
              </button>

              {status !== "CANCELLED" && (status === "ISSUED" || status === "OVERDUE") && (
                <>
                  {confirmCancel ? (
                    <div className="bg-rose-50 p-2 flex flex-col gap-1 border-t border-zinc-200">
                      <span className="text-[9px] text-rose-600 font-bold uppercase block px-2 leading-tight">Cancel &amp; reverse in GL?</span>
                      <button
                        onClick={handleCancelInvoice}
                        className="w-full text-left px-2 py-1 text-rose-700 hover:bg-rose-600 hover:text-white font-bold uppercase text-[10px] rounded transition-colors"
                      >
                        Confirm Cancel
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="w-full text-left px-2 py-1 text-zinc-500 hover:bg-zinc-100 font-bold uppercase text-[10px] rounded transition-colors"
                      >
                        Keep Invoice
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-bold uppercase text-[11px] transition-colors border-t border-zinc-100"
                    >
                      ➔ Cancel Invoice
                    </button>
                  )}
                </>
              )}

              {status === "CANCELLED" && (
                <div className="px-4 py-2.5 text-[10px] text-zinc-400 italic font-semibold border-t border-zinc-100">
                  Invoice Cancelled
                </div>
              )}
            </>
          )}

          {/* LPO / PO CONVERSIONS */}
          {(docType === "LPO" || docType === "PO") && (
            <>
              <button
                onClick={() => handleConvert("GOODS_RECEIVED_NOTE")}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
              >
                ➔ Convert to Goods Received Note
              </button>
              <button
                onClick={() => handleConvert("PAYMENT_VOUCHER")}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
              >
                ➔ Issue Payment Voucher
              </button>
            </>
          )}

          {/* GENERIC FALLBACK CONVERSIONS */}
          {docType !== "QUOTATION" && docType !== "INVOICE" && docType !== "LPO" && docType !== "PO" && (
            <button
              onClick={() => handleConvert("INVOICE")}
              className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
            >
              ➔ Duplicate / Convert to Invoice
            </button>
          )}
        </div>
      )}

      {/* CREDIT NOTE POPOVER DIALOG */}
      {showCreditNoteModal && (
        <CreditNotePopover
          invoiceId={documentId}
          shopId={shopId}
          shopSlug={shopSlug}
          items={items}
          defaultCuNumber={kraCuInvoiceNumber}
          onClose={() => setShowCreditNoteModal(false)}
        />
      )}
    </div>
  );
}
