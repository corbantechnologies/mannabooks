// src/app/workspaces/[slug]/products/ShareCatalogModal.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "react-hot-toast";
import { encodeCatalogToken, sendCatalogEmailAction } from "@/lib/actions/catalog";

interface ShareCatalogModalProps {
  shopSlug: string;
  shopName: string;
  selectedProductIds?: string[];
  buttonLabel?: string;
  className?: string;
}

export function ShareCatalogModal({
  shopSlug,
  shopName,
  selectedProductIds,
  buttonLabel,
  className,
}: ShareCatalogModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  // Email Dispatch Form State
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isPendingEmail, startEmailTransition] = useTransition();

  const isCurated = selectedProductIds && selectedProductIds.length > 0;
  const count = selectedProductIds?.length || 0;

  useEffect(() => {
    let isMounted = true;
    async function generateUrl() {
      if (typeof window === "undefined") return;
      const base = `${window.location.origin}/portal/catalog/${shopSlug}`;
      if (isCurated && selectedProductIds) {
        const generatedToken = await encodeCatalogToken(selectedProductIds);
        if (isMounted) {
          setToken(generatedToken);
          setCatalogUrl(`${base}?token=${generatedToken}`);
          setPdfUrl(`/api/catalog/${shopSlug}/pdf?token=${generatedToken}`);
        }
      } else {
        if (isMounted) {
          setToken("");
          setCatalogUrl(base);
          setPdfUrl(`/api/catalog/${shopSlug}/pdf`);
        }
      }
    }
    generateUrl();
    return () => {
      isMounted = false;
    };
  }, [shopSlug, selectedProductIds, isCurated]);

  function handleCopy() {
    if (!catalogUrl) return;
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    toast.success("Catalog link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  }

  function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }

    startEmailTransition(async () => {
      const res = await sendCatalogEmailAction({
        shopSlug,
        recipientEmail,
        recipientName: recipientName.trim() || undefined,
        customMessage: customMessage.trim() || undefined,
        productIds: selectedProductIds,
        token: token || undefined,
      });

      if (res.success) {
        toast.success(res.message || "Catalog email dispatched successfully!");
        setRecipientEmail("");
        setRecipientName("");
        setCustomMessage("");
        setShowEmailForm(false);
      } else {
        toast.error(res.error || "Failed to dispatch email.");
      }
    });
  }

  const whatsappMessage = encodeURIComponent(
    isCurated
      ? `Hello! Please view our official product pricing for the selected models (${count} items) here: ${catalogUrl}`
      : `Hello! Please view our official product catalog and price list here: ${catalogUrl}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          (isCurated
            ? "bg-black hover:bg-zinc-800 text-white px-4 py-2 font-mono text-xs font-bold uppercase rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            : "border border-zinc-300 bg-white hover:bg-zinc-50 hover:border-black text-black px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-all shadow-sm flex items-center gap-1.5")
        }
      >
        <span>🔗</span>
        <span>
          {buttonLabel || (isCurated ? `Share Selected (${count})` : "Share Catalog")}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  {isCurated ? `Curated Product Selection (${count} Items)` : "Full Product Showcase"}
                </span>
                <h2 className="text-lg font-bold font-sans text-black">
                  {isCurated
                    ? `Share ${count} Selected Products`
                    : "Share Digital Product Catalog"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black font-mono text-xs uppercase font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 font-sans leading-relaxed">
              {isCurated
                ? `This custom link includes ONLY the ${count} selected products you checked. The client will only see these models, their specifications, and selling prices without seeing the rest of your inventory or cost margins.`
                : "Share your complete product catalog with potential clients. They can browse models, view specifications and selling prices (with your profit margins hidden), and select items to request a formal quotation."}
            </p>

            {/* LINK BOX */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase font-bold text-zinc-500 block">
                {isCurated ? "Curated Public Link (Selected Items Only)" : "Public Shareable Link"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={catalogUrl}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-700 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-mono text-xs font-bold uppercase transition-colors shrink-0"
                >
                  {copied ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* ACTION SHORTCUTS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-colors text-center"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setShowEmailForm((prev) => !prev)}
                className={`flex items-center justify-center gap-1.5 border px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all text-center ${
                  showEmailForm
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-sm"
                    : "border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900"
                }`}
              >
                <span>📧</span>
                <span>Email</span>
              </button>

              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-black px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-colors text-center"
              >
                <span>📄</span>
                <span>PDF</span>
              </a>

              <a
                href={catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border border-zinc-800 bg-black text-white hover:bg-zinc-800 px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-colors text-center"
              >
                <span>↗</span>
                <span>Preview</span>
              </a>
            </div>

            {/* EXPANDABLE SEND VIA EMAIL FORM */}
            {showEmailForm && (
              <form
                onSubmit={handleSendEmail}
                className="bg-zinc-50 border border-blue-200 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📧</span>
                    <h3 className="font-bold text-xs uppercase font-sans text-zinc-900">
                      Send Catalog to Client Email
                    </h3>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                    via Resend
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold text-zinc-600 block mb-1">
                      Recipient Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="client@company.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-sans text-black focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold text-zinc-600 block mb-1">
                      Client Name / Company (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe / Safaricom PLC"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-sans text-black focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold text-zinc-600 block mb-1">
                      Personal Message / Specifications Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Hi John, here are the All-in-One PC models we discussed today with current pricing."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-sans text-black focus:outline-none focus:border-black resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="text-zinc-500 hover:text-black font-mono text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPendingEmail}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-mono text-xs font-bold uppercase px-5 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2"
                  >
                    {isPendingEmail ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Send Catalog Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* MODAL FOOTER */}
            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg font-mono text-xs font-bold uppercase text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
