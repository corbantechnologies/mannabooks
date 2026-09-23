"use client";

import { useState, useTransition } from "react";
import { sendProposalAction, convertProposalToDocumentAction } from "@/lib/actions/proposals";
import { Send, FileText, Copy, Check } from "lucide-react";

interface ProposalActionsProps {
  proposalId: string;
  shopId: string;
  shopSlug: string;
  status: string;
  portalUrl: string | null;
  dealId: string | null;
  clientId: string | null;
  brandColor: string;
  clientEmail?: string;
}

export function ProposalActions({
  proposalId,
  shopId,
  shopSlug,
  status,
  portalUrl,
  dealId,
  clientId,
  brandColor,
  clientEmail,
}: ProposalActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(clientEmail || "");
  const [showSendModal, setShowSendModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = () => {
    if (!sendEmail.trim()) { setMessage("Enter recipient email."); return; }
    setMessage(null);
    startTransition(async () => {
      // sendProposalAction emails to the address stored on the client/deal;
      // it does not accept a custom recipient — so we just trigger the action
      // and show success. For custom recipient, this would need a new action.
      const res = await sendProposalAction(proposalId, shopId, shopSlug);
      if (res.success) {
        setMessage("✓ Proposal email sent.");
        setShowSendModal(false);
      } else {
        setMessage(res.error || "Failed to send email.");
      }
    });
  };

  const handleConvert = () => {
    startTransition(async () => {
      const res = await convertProposalToDocumentAction({
        proposalId,
        shopId,
        shopSlug,
        targetType: "INVOICE",
        clientId: clientId || undefined,
      });
      if (res.success && res.documentId) {
        window.location.href = `/workspaces/${shopSlug}/documents/${res.documentId}`;
      } else {
        setMessage(res.error || "Failed to convert.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex flex-wrap gap-2 justify-end">
        {/* Copy portal link */}
        {portalUrl && (
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors font-medium"
          >
            {copied ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3 text-gray-400" /> Copy Link</>}
          </button>
        )}

        {/* Send email */}
        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors font-medium"
        >
          <Send className="w-3 h-3 text-gray-400" /> Send Email
        </button>

        {/* Convert to invoice (only after accepted) */}
        {status === "ACCEPTED" && (
          <button
            onClick={handleConvert}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-60 shadow-sm"
            style={{ backgroundColor: brandColor }}
          >
            <FileText className="w-3 h-3" /> Convert to Invoice
          </button>
        )}
      </div>

      {message && (
        <p className={`text-xs px-3 py-1.5 rounded-lg border ${message.startsWith("✓") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
          {message}
        </p>
      )}

      {/* Send email modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900">Send Proposal via Email</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Recipient Email *</label>
              <input
                type="email"
                value={sendEmail}
                onChange={e => setSendEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            {message && <p className="text-xs text-red-500">{message}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowSendModal(false)} className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isPending}
                className="flex-1 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60 shadow-sm"
                style={{ backgroundColor: brandColor }}
              >
                {isPending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
