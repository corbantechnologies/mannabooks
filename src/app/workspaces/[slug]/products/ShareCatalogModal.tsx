"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

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
  const [copied, setCopied] = useState(false);

  const isCurated = selectedProductIds && selectedProductIds.length > 0;
  const count = selectedProductIds?.length || 0;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const base = `${window.location.origin}/portal/catalog/${shopSlug}`;
      if (isCurated) {
        setCatalogUrl(`${base}?items=${selectedProductIds.join(",")}`);
      } else {
        setCatalogUrl(base);
      }
    }
  }, [shopSlug, selectedProductIds, isCurated]);

  function handleCopy() {
    if (!catalogUrl) return;
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    toast.success("Catalog link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  }

  const pdfUrl = isCurated
    ? `/api/catalog/${shopSlug}/pdf?items=${selectedProductIds.join(",")}`
    : `/api/catalog/${shopSlug}/pdf`;

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
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
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
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black font-mono text-xs uppercase font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 font-sans">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-colors text-center"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>

              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-black px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-colors text-center"
              >
                <span>📄</span>
                <span>{isCurated ? "PDF Selected" : "Price PDF"}</span>
              </a>

              <a
                href={catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-zinc-800 bg-black text-white hover:bg-zinc-800 px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-colors text-center"
              >
                <span>↗</span>
                <span>Preview</span>
              </a>
            </div>

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
