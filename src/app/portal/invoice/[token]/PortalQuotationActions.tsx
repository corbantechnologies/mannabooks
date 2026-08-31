"use client";

import { useState } from "react";
import { acceptQuotationPortalAction, requestQuotationAmendmentPortalAction } from "@/lib/actions/portal-actions";
import toast from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

interface PortalQuotationActionsProps {
  token: string;
  docNumber: string;
  clientName?: string;
  initialResponse?: string | null;
  initialAmendmentNotes?: string | null;
  dueDate?: string | Date | null;
}

export function PortalQuotationActions({
  token,
  docNumber,
  clientName,
  initialResponse,
  initialAmendmentNotes,
  dueDate,
}: PortalQuotationActionsProps) {
  const isExpired = Boolean(dueDate && new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0)));
  const [responseState, setResponseState] = useState<string | null>(initialResponse || null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);

  const [acceptNotes, setAcceptNotes] = useState("");
  const [amendmentText, setAmendmentText] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Confirming quotation acceptance...");

    try {
      const res = await acceptQuotationPortalAction({
        token,
        clientName,
        clientNotes: acceptNotes.trim() || undefined,
      });

      if (res.success) {
        toast.success("Quotation accepted! The merchant has been notified.", { id: toastId });
        setResponseState("ACCEPTED");
        setIsAcceptModalOpen(false);
      } else {
        toast.error(res.error || "Failed to accept quotation.", { id: toastId });
      }
    } catch {
      toast.error("Network error submitting acceptance.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAmendment(e: React.FormEvent) {
    e.preventDefault();
    if (!amendmentText.trim()) {
      toast.error("Please describe what changes you would like.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Transmitting amendment request...");

    try {
      const res = await requestQuotationAmendmentPortalAction({
        token,
        clientName,
        amendmentNotes: amendmentText.trim(),
        contactEmail: contactEmail.trim() || undefined,
      });

      if (res.success) {
        toast.success("Amendment request sent! The merchant will get back to you.", { id: toastId });
        setResponseState("AMENDMENT_REQUESTED");
        setIsAmendmentModalOpen(false);
      } else {
        toast.error(res.error || "Failed to send amendment request.", { id: toastId });
      }
    } catch {
      toast.error("Network error submitting amendment request.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (responseState === "ACCEPTED") {
    return (
      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-emerald-600">✓</span>
          <div>
            <p className="font-bold text-emerald-900 text-sm font-sans">
              Quotation Accepted
            </p>
            <p className="text-emerald-700 text-xs font-sans mt-0.5">
              You have formally accepted this quotation. The vendor has been notified and will proceed with invoice execution.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-700 text-white rounded font-mono text-[10px] font-bold uppercase shrink-0">
          ACCEPTED
        </span>
      </div>
    );
  }

  if (responseState === "AMENDMENT_REQUESTED") {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-amber-600">📝</span>
          <div>
            <p className="font-bold text-amber-900 text-sm font-sans">
              Amendment Requested
            </p>
            <p className="text-amber-800 text-xs font-sans mt-0.5">
              Your requested revisions have been transmitted to the merchant for adjustments.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAmendmentModalOpen(true)}
          className="px-3 py-1 bg-amber-800 text-white rounded font-mono text-[10px] font-bold uppercase shrink-0 hover:bg-amber-900"
        >
          Update Request
        </button>
      </div>
    );
  }

  if (isExpired) {
    const formattedExpiry = dueDate
      ? new Date(dueDate).toLocaleDateString("en-KE", { dateStyle: "long" })
      : "the validity period";

    return (
      <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-rose-600">⏳</span>
          <div>
            <p className="font-bold text-rose-900 text-sm font-sans">
              Quotation Expired
            </p>
            <p className="text-rose-700 text-xs font-sans mt-0.5">
              This quotation reached its validity deadline on {formattedExpiry}. Formal acceptance is closed. You may request an updated quote below.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAmendmentModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold font-sans uppercase transition-colors shrink-0 shadow-sm"
        >
          ✏️ Request Updated Quote
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 border border-zinc-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
      <div>
        <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold block">Quotation Decision</span>
        <p className="text-sm font-bold text-black font-sans mt-0.5">
          Would you like to accept this proposal or request amendments?
        </p>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setIsAmendmentModalOpen(true)}
          className="flex-1 sm:flex-initial px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-100 rounded-lg text-xs font-bold font-sans uppercase transition-colors"
        >
          ✏️ Request Changes
        </button>
        <button
          type="button"
          onClick={() => setIsAcceptModalOpen(true)}
          className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-sans uppercase transition-colors shadow-sm"
        >
          ✓ Accept Quotation
        </button>
      </div>

      {/* ACCEPT MODAL */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleAccept}
            className="bg-white border border-zinc-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block font-mono">Formal Approval</span>
                <h3 className="font-bold text-base text-black font-sans">
                  Accept Quotation {docNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="text-zinc-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 font-sans leading-relaxed">
              By confirming, you approve the line items, commercial terms, and pricing specified in this quotation. The vendor will be immediately notified.
            </p>

            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                Optional Message / Purchase Order # (Optional)
              </label>
              <textarea
                value={acceptNotes}
                onChange={(e) => setAcceptNotes(e.target.value)}
                placeholder="e.g. Approved. Please deliver to Office B on Friday."
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans h-20 resize-none focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg font-bold text-xs font-sans text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs font-sans uppercase hover:bg-emerald-700 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={10} color="white" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  "Confirm Acceptance"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AMENDMENT MODAL */}
      {isAmendmentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleAmendment}
            className="bg-white border border-zinc-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block font-mono">Quotation Revision</span>
                <h3 className="font-bold text-base text-black font-sans">
                  Request Changes to {docNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAmendmentModalOpen(false)}
                className="text-zinc-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  What modifications or changes do you require? *
                </label>
                <textarea
                  required
                  value={amendmentText}
                  onChange={(e) => setAmendmentText(e.target.value)}
                  placeholder="e.g. Please reduce quantity of item #2 to 5 units and adjust delivery date."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans h-24 resize-none focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Your Contact Email (Optional)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. procurement@client.com"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setIsAmendmentModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg font-bold text-xs font-sans text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !amendmentText.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg font-bold text-xs font-sans uppercase hover:bg-zinc-800 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={10} color="white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
