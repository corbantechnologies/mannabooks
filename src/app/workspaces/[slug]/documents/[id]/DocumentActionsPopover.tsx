// src/app/workspaces/[slug]/documents/[id]/DocumentActionsPopover.tsx
"use client";

import { useState } from "react";
import { axiosClient } from "@/lib/api/axios";
import type { DocumentType } from "@/types/models";
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
  status: "DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "PARTIALLY_PAID" | "RECEIVED" | "CANCELLED" | "CONFIRMED";
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
    setIsOpen(false);
    try {
      await axiosClient.patch(`/documents/${documentId}?shop_id=${shopId}`, { status: "CANCELLED" });
      toast.success("Quotation cancelled successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to cancel quotation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelInvoice() {
    setLoading(true);
    setConfirmCancel(false);
    try {
      await axiosClient.patch(`/documents/${documentId}?shop_id=${shopId}`, { status: "CANCELLED" });
      toast.success("Invoice successfully cancelled.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to cancel invoice.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConvert(targetType: DocumentType) {
    setLoading(true);
    setIsOpen(false);
    try {
      const res = await axiosClient.post<any>(`/documents/${documentId}/convert?shop_id=${shopId}`, {
        target_type: targetType,
      });
      const data = res.data;
      if (targetType === "INVOICE" && docType === "QUOTATION") {
        toast.success(`✓ Quotation confirmed! Invoice (${data.serial || data.doc_number}) created.`);
      } else if (targetType === "RECEIPT" && docType === "INVOICE") {
        toast.success(`✓ Receipt (${data.serial || data.doc_number}) issued. Invoice marked as PAID.`);
      } else {
        toast.success(`✓ ${targetType} (${data.serial || data.doc_number}) generated successfully.`);
      }
      const params = new URLSearchParams({ converted: docType, from: data.serial || data.doc_number || "" });
      router.push(`/workspaces/${shopSlug}/documents/${data.new_document_id}?${params.toString()}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to execute conversion.");
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
              {status === "CONFIRMED" ? (
                <div className="px-3.5 py-2 text-[10px] text-emerald-700 italic font-semibold">
                  ✓ Confirmed &amp; Converted to Invoice
                </div>
              ) : status === "CANCELLED" ? (
                <div className="px-3.5 py-2 text-[10px] text-zinc-400 italic font-semibold">
                  Quotation Cancelled
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleConvert("INVOICE")}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
                  >
                    <span>📄</span> Convert to Tax Invoice
                  </button>

                  {confirmCancel ? (
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
                  )}
                </>
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

          {/* LSO CONVERSIONS */}
          {docType === "LSO" && (
            <>
              <button
                onClick={() => handleConvert("SERVICE_COMPLETION_NOTE")}
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
              >
                <span>📋</span> Sign Off Service Completion (SCC)
              </button>
              <button
                onClick={() => handleConvert("PAYMENT_VOUCHER")}
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
              >
                <span>💳</span> Issue Payment Voucher
              </button>
            </>
          )}

          {/* SERVICE COMPLETION NOTE CONVERSIONS */}
          {docType === "SERVICE_COMPLETION_NOTE" && (
            <button
              onClick={() => handleConvert("PAYMENT_VOUCHER")}
              className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
            >
              <span>💳</span> Issue Payment Voucher
            </button>
          )}

          {/* RECEIPT CONVERSIONS — Delivery Note only */}
          {docType === "RECEIPT" && (
            <button
              onClick={() => handleConvert("DELIVERY_NOTE")}
              className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
            >
              <span>🚚</span> Generate Delivery Note
            </button>
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

          {/* DELIVERY NOTE CONVERSIONS — Issue Receipt only */}
          {docType === "DELIVERY_NOTE" && (
            <button
              onClick={() => handleConvert("RECEIPT")}
              className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800"
            >
              <span>🧾</span> Issue Official Receipt
            </button>
          )}

          {/* GENERIC FALLBACK CONVERSIONS */}
          {docType !== "QUOTATION" &&
           docType !== "INVOICE" &&
           docType !== "RECEIPT" &&
           docType !== "LPO" &&
           docType !== "PO" &&
           docType !== "LSO" &&
           docType !== "GOODS_RECEIVED_NOTE" &&
           docType !== "SERVICE_COMPLETION_NOTE" &&
           docType !== "DELIVERY_NOTE" &&
           docType !== "CREDIT_NOTE" &&
           docType !== "DEBIT_NOTE" &&
           docType !== "PAYMENT_VOUCHER" &&
           docType !== "PAYROLL_VOUCHER" && (
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
