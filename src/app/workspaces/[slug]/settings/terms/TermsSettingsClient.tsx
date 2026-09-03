"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateShopTerm, useUpdateShopTerm, useDeleteShopTerm, useSeedDefaultTerms } from "@/hooks/useTerms";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ConfirmModal } from "@/components/ConfirmModal";

interface ShopTermItem {
  id: string;
  shopId: string;
  title: string;
  content: string;
  isDefaultInvoice: boolean;
  isDefaultCatalog: boolean;
  displayOrder: number;
}

interface TermsSettingsClientProps {
  shopId: string;
  shopSlug: string;
  shopName: string;
  initialTerms: ShopTermItem[];
}

const KENYAN_TERM_PRESETS = [
  {
    title: "100% Upfront Payment",
    content: "Full payment is required prior to order processing and dispatch. Goods will not be released without verified settlement.",
    isDefaultInvoice: false,
    isDefaultCatalog: true,
  },
  {
    title: "Payment on Delivery (COD)",
    content: "Payment is due immediately upon physical delivery of goods and inspection. Driver accepts M-Pesa or verified instant bank transfer.",
    isDefaultInvoice: true,
    isDefaultCatalog: false,
  },
  {
    title: "50% Deposit / 50% on Delivery",
    content: "50% commitment deposit required upon quotation acceptance to initiate procurement/assembly. 50% balance payable upon final delivery.",
    isDefaultInvoice: false,
    isDefaultCatalog: false,
  },
  {
    title: "Net 30 Days Credit (Corporate)",
    content: "Full settlement within 30 days from invoice date subject to approved corporate credit facility. Late payments accrue statutory interest.",
    isDefaultInvoice: false,
    isDefaultCatalog: false,
  },
  {
    title: "14-Day Price Validity",
    content: "Prices quoted remain valid for 14 calendar days from issue date. Subject to currency fluctuation adjustments thereafter.",
    isDefaultInvoice: false,
    isDefaultCatalog: true,
  },
  {
    title: "Return & Warranty Policy",
    content: "Goods once sold are non-refundable unless defective. Any warranty claims must be lodged within 7 days with original receipt.",
    isDefaultInvoice: false,
    isDefaultCatalog: false,
  },
];

export function TermsSettingsClient({
  shopId,
  shopSlug,
  shopName,
  initialTerms,
}: TermsSettingsClientProps) {
  const router = useRouter();

  const [showTermForm, setShowTermForm] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [termTitle, setTermTitle] = useState("");
  const [termContent, setTermContent] = useState("");
  const [termIsDefaultInvoice, setTermIsDefaultInvoice] = useState(false);
  const [termIsDefaultCatalog, setTermIsDefaultCatalog] = useState(false);

  const createTermMutation = useCreateShopTerm(shopId, shopSlug);
  const updateTermMutation = useUpdateShopTerm(shopId, shopSlug);
  const deleteTermMutation = useDeleteShopTerm(shopId, shopSlug);
  const seedTermsMutation = useSeedDefaultTerms(shopId, shopSlug);
  const [termToDelete, setTermToDelete] = useState<ShopTermItem | null>(null);

  function handleSelectPreset(preset: typeof KENYAN_TERM_PRESETS[0]) {
    setEditingTermId(null);
    setTermTitle(preset.title);
    setTermContent(preset.content);
    setTermIsDefaultInvoice(preset.isDefaultInvoice);
    setTermIsDefaultCatalog(preset.isDefaultCatalog);
    setShowTermForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditTerm(term: ShopTermItem) {
    setEditingTermId(term.id);
    setTermTitle(term.title);
    setTermContent(term.content);
    setTermIsDefaultInvoice(term.isDefaultInvoice);
    setTermIsDefaultCatalog(term.isDefaultCatalog);
    setShowTermForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleTermSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termTitle.trim() || !termContent.trim()) {
      toast.error("Please provide both a title and clause text.");
      return;
    }

    if (editingTermId) {
      updateTermMutation.mutate(
        {
          id: editingTermId,
          title: termTitle.trim(),
          content: termContent.trim(),
          isDefaultInvoice: termIsDefaultInvoice,
          isDefaultCatalog: termIsDefaultCatalog,
        },
        {
          onSuccess: () => {
            setShowTermForm(false);
            setEditingTermId(null);
            setTermTitle("");
            setTermContent("");
            router.refresh();
          },
        }
      );
    } else {
      createTermMutation.mutate(
        {
          title: termTitle.trim(),
          content: termContent.trim(),
          isDefaultInvoice: termIsDefaultInvoice,
          isDefaultCatalog: termIsDefaultCatalog,
        },
        {
          onSuccess: () => {
            setShowTermForm(false);
            setTermTitle("");
            setTermContent("");
            router.refresh();
          },
        }
      );
    }
  }

  return (
    <div className="space-y-8 font-mono text-xs max-w-5xl">
      {/* HEADER WITH BREADCRUMB */}
      <div className="space-y-2">
        <Link
          href={`/workspaces/${shopSlug}/settings`}
          className="text-xs font-sans font-bold text-zinc-400 hover:text-black transition-colors block"
        >
          ← Back to Workspace Settings
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Commercial Policy Engine
            </span>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans mt-0.5">
              Terms &amp; Conditions Library
            </h1>
            <p className="font-sans text-xs text-zinc-500 mt-1">
              Configure reusable payment milestones, COD rules, deposit terms, and price validity clauses for {shopName}.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {initialTerms.length === 0 && (
              <button
                type="button"
                onClick={() => seedTermsMutation.mutate(undefined, { onSuccess: () => router.refresh() })}
                disabled={seedTermsMutation.isPending}
                className="btn-secondary-modern px-3 py-2 font-semibold uppercase tracking-wider text-[11px] border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                {seedTermsMutation.isPending ? <Spinner size={12} /> : "⚡"}
                <span>{seedTermsMutation.isPending ? "Loading..." : "Load Kenyan SME Presets"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditingTermId(null);
                setTermTitle("");
                setTermContent("");
                setTermIsDefaultInvoice(false);
                setTermIsDefaultCatalog(false);
                setShowTermForm(!showTermForm);
              }}
              className="btn-primary-modern px-4 py-2 font-semibold uppercase tracking-wider text-xs shadow-sm"
            >
              {showTermForm ? "✕ Close Form" : "+ Create New Term"}
            </button>
          </div>
        </div>
      </div>

      {/* QUICK PRESET CHIPS */}
      <div className="card-modern p-5 bg-white space-y-3">
        <span className="text-[10px] text-zinc-400 uppercase font-semibold block tracking-wider">
          Quick 1-Click Kenyan Business Templates:
        </span>
        <div className="flex flex-wrap gap-2">
          {KENYAN_TERM_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="px-3 py-1.5 text-[11px] uppercase font-semibold border border-zinc-200 bg-zinc-50 hover:border-black hover:bg-black hover:text-white transition-all rounded text-zinc-700 cursor-pointer"
            >
              + {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* ADD / EDIT TERM FORM */}
      {showTermForm && (
        <form onSubmit={handleTermSubmit} className="card-modern p-6 bg-zinc-50/80 border-2 border-black space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="font-semibold uppercase tracking-wider text-xs text-black font-sans flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black" />
              <span>{editingTermId ? "Edit Commercial Term Clause" : "Define New Commercial Term Clause"}</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowTermForm(false)}
              className="text-zinc-400 hover:text-black text-xs font-bold font-mono"
            >
              ✕ CLOSE
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold text-[10px]">
              Clause Heading / Title *
            </label>
            <input
              type="text"
              value={termTitle}
              onChange={(e) => setTermTitle(e.target.value)}
              placeholder="e.g., 100% Upfront Payment / Payment on Delivery (COD) / Net 30 Days"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold text-[10px]">
              Clause Text / Specific Legal &amp; Commercial Conditions *
            </label>
            <textarea
              value={termContent}
              onChange={(e) => setTermContent(e.target.value)}
              placeholder="e.g., Full payment is required prior to dispatch. Inspection upon delivery is allowed before release."
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs h-24 font-sans leading-relaxed"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-zinc-200 bg-white rounded-lg hover:border-black transition-colors">
              <input
                type="checkbox"
                checked={termIsDefaultInvoice}
                onChange={(e) => setTermIsDefaultInvoice(e.target.checked)}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-black uppercase block">Default on Invoices &amp; Quotes</span>
                <span className="text-[10px] text-zinc-500 font-sans block leading-tight">Auto-checked when creating manual billing documents</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 border border-zinc-200 bg-white rounded-lg hover:border-black transition-colors">
              <input
                type="checkbox"
                checked={termIsDefaultCatalog}
                onChange={(e) => setTermIsDefaultCatalog(e.target.checked)}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-black uppercase block">Default for Catalog Leads</span>
                <span className="text-[10px] text-zinc-500 font-sans block leading-tight">Auto-attached to public quote requests from new prospects</span>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
            <button
              type="submit"
              disabled={createTermMutation.isPending || updateTermMutation.isPending}
              className="btn-primary-modern px-6 py-2.5 font-semibold uppercase tracking-wider text-xs disabled:bg-zinc-300"
            >
              {createTermMutation.isPending || updateTermMutation.isPending ? (
                <span className="flex items-center gap-1.5">
                  <Spinner size={12} color="white" />
                  <span>SAVING CLAUSE...</span>
                </span>
              ) : editingTermId ? (
                "UPDATE TERM"
              ) : (
                "+ SAVE TO LIBRARY"
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowTermForm(false)}
              className="btn-secondary-modern px-4 py-2.5 font-semibold uppercase tracking-wider text-xs"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* SAVED TERMS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold uppercase tracking-wider text-sm text-black font-sans">
            Active Shop Terms Library ({initialTerms.length})
          </h2>
        </div>

        {initialTerms.length === 0 ? (
          <div className="card-modern p-12 text-center bg-white space-y-3">
            <div className="text-3xl">📜</div>
            <h3 className="font-bold font-sans text-sm text-black uppercase">No Commercial Terms Created Yet</h3>
            <p className="font-sans text-xs text-zinc-500 max-w-md mx-auto">
              Set standard payment rules so your team and prospective clients have full transparency on payment milestones, deposit requirements, and return policies.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => seedTermsMutation.mutate(undefined, { onSuccess: () => router.refresh() })}
                disabled={seedTermsMutation.isPending}
                className="btn-primary-modern px-5 py-2.5 font-semibold uppercase tracking-wider text-xs"
              >
                ⚡ Load Standard Kenyan SME Presets
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialTerms.map((term) => (
              <div
                key={term.id}
                className="card-modern p-5 bg-white rounded-lg flex flex-col justify-between gap-4 hover:border-zinc-400 transition-all shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold uppercase text-zinc-900 text-xs tracking-tight font-sans">
                      {term.title}
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-zinc-600 leading-relaxed">
                    {term.content}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {term.isDefaultInvoice && (
                      <span className="inline-block px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 rounded border border-emerald-300">
                        ✓ Default: Manual Invoices
                      </span>
                    )}
                    {term.isDefaultCatalog && (
                      <span className="inline-block px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-800 rounded border border-blue-300">
                        ✓ Default: Catalog / New Leads
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-3 flex items-center justify-end gap-3 text-[10px] uppercase font-semibold">
                  <button
                    type="button"
                    onClick={() => handleEditTerm(term)}
                    className="text-zinc-600 hover:text-black font-bold transition-colors"
                  >
                    Edit Clause
                  </button>
                  <span className="text-zinc-300">•</span>
                  <button
                    type="button"
                    onClick={() => setTermToDelete(term)}
                    disabled={deleteTermMutation.isPending}
                    className="text-rose-600 hover:text-rose-800 font-bold transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!termToDelete}
        onClose={() => setTermToDelete(null)}
        onConfirm={() => {
          if (termToDelete) {
            deleteTermMutation.mutate(termToDelete.id, {
              onSuccess: () => {
                setTermToDelete(null);
                router.refresh();
              },
            });
          }
        }}
        title="Delete Commercial Term"
        message={`Are you sure you want to delete "${termToDelete?.title}"? This term clause will no longer be available for document footers.`}
        confirmLabel="Delete Clause"
        variant="danger"
        isLoading={deleteTermMutation.isPending}
      />
    </div>
  );
}
