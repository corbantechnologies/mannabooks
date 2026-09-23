"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProposalAction } from "@/lib/actions/proposals";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Client { id: string; name: string; email: string | null; }
interface Deal { id: string; title: string; contactName: string; }

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  packageLabel: string;
  notes: string;
}

interface NewProposalFormProps {
  shopId: string;
  shopSlug: string;
  clients: Client[];
  deals: Deal[];
  currency: string;
  brandColor: string;
  initialDealId?: string;
  initialClientId?: string;
}

const emptyItem = (): LineItem => ({
  description: "", quantity: "1", unitPrice: "", packageLabel: "", notes: "",
});

export function NewProposalForm({
  shopId, shopSlug, clients, deals, currency, brandColor, initialDealId, initialClientId,
}: NewProposalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isMultiTier, setIsMultiTier] = useState(false);

  const [form, setForm] = useState({
    title: "",
    dealId: initialDealId || "",
    clientId: initialClientId || "",
    executiveSummary: "",
    scopeOfWork: "",
    currency,
    validityDays: "30",
    termsAndConditions: "",
  });

  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  const setF = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const updateItem = (i: number, k: keyof LineItem, v: string) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const getLineTotal = (it: LineItem) => {
    const q = parseFloat(it.quantity) || 0;
    const p = parseFloat(it.unitPrice) || 0;
    return q * p;
  };

  const subtotal = items.reduce((s, it) => s + getLineTotal(it), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Proposal title is required."); return; }
    const validItems = items.filter(it => it.description.trim() && parseFloat(it.unitPrice) > 0);
    if (validItems.length === 0) { setError("Add at least one line item with a description and price."); return; }
    setError(null);

    startTransition(async () => {
      const res = await createProposalAction({
        shopId,
        shopSlug,
        title: form.title,
        dealId: form.dealId || undefined,
        clientId: form.clientId || undefined,
        executiveSummary: form.executiveSummary || undefined,
        scopeOfWork: form.scopeOfWork || undefined,
        currency: form.currency || currency,
        validityDays: parseInt(form.validityDays) || 30,
        termsAndConditions: form.termsAndConditions || undefined,
        items: validItems.map((it, idx) => ({
          description: it.description,
          quantity: parseFloat(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
          packageLabel: it.packageLabel || undefined,
          notes: it.notes || undefined,
          displayOrder: idx,
        })),
      });

      if (res.success) {
        router.push(`/workspaces/${shopSlug}/crm/proposals/${res.proposalId}`);
      } else {
        setError(res.error || "Failed to create proposal.");
      }
    });
  };

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2";
  const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link href={`/workspaces/${shopSlug}/crm/proposals`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Proposals
      </Link>

      {/* Basics */}
      <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Proposal Details</h2>
        <div>
          <label className={labelClass}>Title *</label>
          <input type="text" value={form.title} onChange={setF("title")} placeholder="e.g. Digital Transformation Proposal — TechCorp" required className={inputClass} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Linked Client</label>
            <select value={form.clientId} onChange={setF("clientId")} className={inputClass}>
              <option value="">No client linked</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Linked Deal</label>
            <select value={form.dealId} onChange={setF("dealId")} className={inputClass}>
              <option value="">No deal linked</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select value={form.currency} onChange={setF("currency")} className={inputClass}>
              {["KES", "USD", "GBP", "EUR", "UGX", "TZS"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Valid for (days)</label>
            <input type="number" min="1" max="365" value={form.validityDays} onChange={setF("validityDays")} placeholder="30" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Narrative sections */}
      <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Narrative</h2>
        <div>
          <label className={labelClass}>Executive Summary</label>
          <textarea value={form.executiveSummary} onChange={setF("executiveSummary")} rows={3} placeholder="High-level overview of what you're proposing and the value to the client…" className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className={labelClass}>Scope of Work</label>
          <textarea value={form.scopeOfWork} onChange={setF("scopeOfWork")} rows={4} placeholder="Detailed description of deliverables, approach, and exclusions…" className={`${inputClass} resize-none`} />
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Pricing</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Multi-tier packages?</span>
            <button
              type="button"
              onClick={() => setIsMultiTier(v => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${isMultiTier ? "bg-emerald-500" : "bg-gray-200 dark:bg-white/15"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isMultiTier ? "translate-x-4" : ""}`} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 p-3 rounded-lg border border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_120px] gap-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Description *</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(i, "description", e.target.value)}
                    placeholder="Service or deliverable"
                    className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={item.quantity}
                    onChange={e => updateItem(i, "quantity", e.target.value)}
                    className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => updateItem(i, "unitPrice", e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {isMultiTier && (
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Package / Tier Name</label>
                  <input
                    type="text"
                    value={item.packageLabel}
                    onChange={e => updateItem(i, "packageLabel", e.target.value)}
                    placeholder="e.g. Basic, Professional, Enterprise"
                    className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Total: <strong className="text-gray-700 dark:text-gray-300">{form.currency} {getLineTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </p>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Line Item
        </button>

        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-white/5">
          <div className="text-right">
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {form.currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-6">
        <label className={labelClass}>Terms & Conditions</label>
        <textarea value={form.termsAndConditions} onChange={setF("termsAndConditions")} rows={4} placeholder="Payment terms, revision limits, warranty periods…" className={`${inputClass} resize-none`} />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-500/8 px-4 py-2.5 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-all"
        style={{ backgroundColor: brandColor }}
      >
        {isPending ? "Creating…" : "Create Proposal"}
      </button>
    </form>
  );
}
