// src/app/workspaces/[slug]/documents/[id]/DocumentStatusPanel.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDocumentStatus } from "@/lib/actions/documents";
import { dispatchDocumentEmail } from "@/lib/actions/email";

interface DocumentStatusPanelProps {
  documentId: string;
  shopId: string;
  shopSlug: string;
  currentStatus: "DRAFT" | "SENT" | "OVERDUE" | "PAID";
  portalLink: string | null;
  clientEmail: string;
  docNumber: string;
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
] as const;

export function DocumentStatusPanel({
  documentId,
  shopId,
  shopSlug,
  currentStatus,
  portalLink,
  clientEmail,
  docNumber,
}: DocumentStatusPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"DRAFT" | "SENT" | "OVERDUE" | "PAID">(currentStatus);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleStatusUpdate(newStatus: typeof status) {
    if (newStatus === status) return;
    setSaving(true);
    setMessage(null);

    const res = await updateDocumentStatus({
      documentId,
      shopId,
      shopSlug,
      status: newStatus,
    });

    setSaving(false);
    if (res.success) {
      setStatus(newStatus);
      setMessage({ type: "success", text: `Status updated to ${newStatus}.` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update status." });
    }
  }

  async function handleSendEmail() {
    setSending(true);
    setMessage(null);

    const res = await dispatchDocumentEmail({ documentId });
    setSending(false);

    if (res.success) {
      setMessage({ type: "success", text: `Document emailed to ${clientEmail} successfully.` });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to send email." });
    }
  }

  return (
    <div className="border border-black p-6 bg-white space-y-6 font-mono text-xs">
      <div>
        <span className="text-[10px] text-zinc-400 uppercase">CONTROL_PANEL // LIFECYCLE_MANAGEMENT</span>
        <h3 className="font-bold uppercase tracking-tight text-sm mt-1">Status &amp; Actions</h3>
      </div>

      {message && (
        <div className={`border p-3 font-bold uppercase tracking-tight text-xs ${
          message.type === "success"
            ? "border-black bg-black text-white"
            : "border-black bg-zinc-50 text-black"
        }`}>
          &gt; {message.text}
        </div>
      )}

      {/* STATUS TOGGLE */}
      <div className="space-y-2">
        <p className="text-[10px] text-zinc-400 uppercase">Update Document Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              onClick={() => handleStatusUpdate(opt.value)}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border transition-colors rounded-none disabled:opacity-40 ${
                status === opt.value
                  ? "bg-black text-white border-black"
                  : "bg-white text-zinc-600 border-zinc-300 hover:border-black hover:text-black"
              }`}
            >
              {saving && status !== opt.value ? "..." : opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* PORTAL LINK + EMAIL */}
      <div className="border-t border-zinc-200 pt-4 space-y-3">
        <p className="text-[10px] text-zinc-400 uppercase">Client Delivery Actions</p>

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
        </div>
      </div>
    </div>
  );
}
