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
    setIsOpen(false); // Close popover before action so router.refresh() works cleanly
    try {
      const res = await cancelQuotationAction(shopId, documentId, shopSlug);
      if (res.success) {
        toast.success("Quotation cancelled successfully.");
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
      const res = await cancelInvoiceAction(shopId, documentId, shopSlug);
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
        // Context-aware success message
        if (targetType === "INVOICE" && docType === "QUOTATION") {
          toast.success(`✓ Quotation confirmed! Invoice (${res.serial}) created.`);
        } else if (targetType === "RECEIPT" && docType === "INVOICE") {
          toast.success(`✓ Receipt (${res.serial}) issued. Invoice marked as PAID.`);
        } else {
          toast.success(`✓ ${targetType} (${res.serial}) generated successfully.`);
        }
        const params = new URLSearchParams({ converted: docType, from: res.serial || "" });
        router.push(`/workspaces/${shopSlug}/documents/${res.newDocumentId}?${params.toString()}`);
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
        className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
      >
        <span>⚡ Document Actions</span>
        <span className="text-[9px] opacity-70">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* POPOVER MENU PANEL */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 border border-zinc-200/80 bg-white rounded-xl shadow-xl z-40 text-xs divide-y divide-zinc-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-2 bg-zinc-50/80 font-bold uppercase text-[9px] text-zinc-400">
            Lifecycle Conversions
          </div>

          {/* QUOTATION CONVERSIONS */}
          {docType === "QUOTATION" && (
            <>
              {status !== "CANCELLED" && (
                <button
                  onClick={() => handleConvert("INVOICE")}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
                >
                  <span>📄</span> Convert to Tax Invoice
                </button>
              )}

              {status !== "CANCELLED" ? (
                confirmCancel ? (
                  <div className="bg-rose-50 p-2.5 flex flex-col gap-1.5 border-t border-zinc-100">
                    <span className="text-[10px] text-rose-700 font-bold uppercase block px-1 leading-tight">Cancel this quotation?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCancelQuotation}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 font-semibold uppercase text-[10px] rounded-md transition-colors cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="btn-secondary-modern px-2 py-1 text-[10px] font-semibold uppercase"
                      >
                        Keep Quote
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold text-[11px] transition-colors border-t border-zinc-100 cursor-pointer flex items-center gap-2"
                  >
                    <span>✕</span> Cancel Quotation
                  </button>
                )
              ) : (
                <div className="px-3.5 py-2 text-[10px] text-zinc-400 italic font-semibold">
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
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
              >
                <span>🧾</span> Issue Official Receipt
              </button>

              <button
                onClick={() => handleConvert("DELIVERY_NOTE")}
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
              >
                <span>🚚</span> Generate Delivery Note
              </button>

              <button
                onClick={() => {
                  if (status !== "PAID") return;
                  setIsOpen(false);
                  setShowCreditNoteModal(true);
                }}
                disabled={status !== "PAID"}
                className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 hover:text-rose-900 font-semibold text-[11px] text-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                title={status !== "PAID" ? "Invoice must be paid to raise a credit note" : ""}
              >
                <span>↩️</span> Raise Credit Note {status !== "PAID" && "(Unpaid)"}
              </button>

              <button
                onClick={() => handleConvert("DEBIT_NOTE")}
                className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-100 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
              >
                <span>➕</span> Raise Debit Note
              </button>

              {status !== "CANCELLED" && (status === "ISSUED" || status === "OVERDUE") && (
                <>
                  {confirmCancel ? (
                    <div className="bg-rose-50 p-2.5 flex flex-col gap-1.5 border-t border-zinc-100">
                      <span className="text-[10px] text-rose-700 font-bold uppercase block px-1 leading-tight">Cancel &amp; reverse in GL?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleCancelInvoice}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 font-semibold uppercase text-[10px] rounded-md transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmCancel(false)}
                          className="btn-secondary-modern px-2 py-1 text-[10px] font-semibold uppercase"
                        >
                          Keep Invoice
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold text-[11px] transition-colors border-t border-zinc-100 cursor-pointer flex items-center gap-2"
                    >
                      <span>✕</span> Cancel Invoice
                    </button>
                  )}
                </>
              )}

              {status === "CANCELLED" && (
                <div className="px-3.5 py-2 text-[10px] text-zinc-400 italic font-semibold border-t border-zinc-100">
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
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
              >
                <span>📦</span> Convert to Goods Received Note
              </button>
              <button
                onClick={() => handleConvert("PAYMENT_VOUCHER")}
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
              >
                <span>💳</span> Issue Payment Voucher
              </button>
            </>
          )}

          {/* GOODS RECEIVED NOTE CONVERSIONS */}
          {docType === "GOODS_RECEIVED_NOTE" && (
            <button
              onClick={() => handleConvert("PAYMENT_VOUCHER")}
              className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
            >
              <span>💳</span> Issue Payment Voucher
            </button>
          )}

          {/* DELIVERY NOTE CONVERSIONS */}
          {docType === "DELIVERY_NOTE" && (
            <>
              <button
                onClick={() => handleConvert("INVOICE")}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
              >
                ➔ Issue Invoice
              </button>
              <button
                onClick={() => handleConvert("RECEIPT")}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
              >
                ➔ Issue Official Receipt
              </button>
            </>
          )}

          {/* GENERIC FALLBACK CONVERSIONS */}
          {docType !== "QUOTATION" && docType !== "INVOICE" && docType !== "LPO" && docType !== "PO" && docType !== "GOODS_RECEIVED_NOTE" && docType !== "DELIVERY_NOTE" && (
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
