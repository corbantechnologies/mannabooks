// src/app/workspaces/[slug]/documents/[id]/DocumentActionsPopover.tsx
"use client";

import { useState } from "react";
import { axiosClient } from "@/lib/api/axios";
import type { DocumentType } from "@/types/models";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CreditNotePopover } from "./CreditNotePopover";
import type { DocumentWorkflow } from "./DocumentLifecycle";

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
  status: string;
  workflow: DocumentWorkflow;
}

export function DocumentActionsPopover({
  documentId,
  shopId,
  shopSlug,
  docType,
  items,
  kraCuInvoiceNumber,
  workflow,
}: DocumentActionsPopoverProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
        toast.success(`✓ Receipt (${data.serial || data.doc_number}) issued.`);
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
            Create from this document
          </div>

          {workflow.conversions.map((c) => (
            <button
              key={c.target}
              onClick={() => c.enabled && handleConvert(c.target as DocumentType)}
              disabled={!c.enabled}
              title={c.reason || undefined}
              className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 hover:text-emerald-950 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-2 text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ➔ {c.label}
              {!c.enabled && c.reason && <span className="font-normal text-zinc-400"> ({c.reason})</span>}
            </button>
          ))}

          {docType === "INVOICE" && (
            <button
              onClick={() => {
                if (!workflow.canCreditNote) return;
                setIsOpen(false);
                setShowCreditNoteModal(true);
              }}
              disabled={!workflow.canCreditNote}
              className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 hover:text-rose-900 font-semibold text-[11px] text-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              title={workflow.canCreditNote ? "" : "Available once the invoice is issued and not fully credited"}
            >
              <span>↩️</span> Raise credit note
            </button>
          )}

          {workflow.conversions.length === 0 && docType !== "INVOICE" && (
            <div className="px-3.5 py-2.5 text-[11px] text-zinc-400 italic">
              Nothing can be created from this document in its current status.
            </div>
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
