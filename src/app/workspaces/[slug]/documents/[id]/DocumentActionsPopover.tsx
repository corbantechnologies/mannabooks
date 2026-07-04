// src/app/workspaces/[slug]/documents/[id]/DocumentActionsPopover.tsx
"use client";

import { useState } from "react";
import { convertDocumentAction, DocumentType } from "@/lib/actions/documents";
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
}

export function DocumentActionsPopover({
  documentId,
  shopId,
  shopSlug,
  docType,
  items,
  kraCuInvoiceNumber,
}: DocumentActionsPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
            <button
              onClick={() => handleConvert("INVOICE")}
              className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
            >
              ➔ Convert to Invoice
            </button>
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
                  setIsOpen(false);
                  setShowCreditNoteModal(true);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] text-rose-600 transition-colors"
              >
                ➔ Raise Credit Note
              </button>

              <button
                onClick={() => handleConvert("DEBIT_NOTE")}
                className="w-full text-left px-4 py-2.5 hover:bg-black hover:text-white font-bold uppercase text-[11px] transition-colors"
              >
                ➔ Raise Debit Note
              </button>
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
