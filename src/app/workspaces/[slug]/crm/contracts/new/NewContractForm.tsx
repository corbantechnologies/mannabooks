"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createContractAction } from "@/lib/actions/contracts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Client { id: string; name: string; }
interface Deal { id: string; title: string; stage: string; }

interface NewContractFormProps {
  shopId: string;
  shopSlug: string;
  clients: Client[];
  deals: Deal[];
  currency: string;
  brandColor: string;
  initialDealId?: string;
}

export function NewContractForm({ shopId, shopSlug, clients, deals, currency, brandColor, initialDealId }: NewContractFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isHoursBased, setIsHoursBased] = useState(false);
  const [autoInvoice, setAutoInvoice] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    clientId: "",
    dealId: initialDealId || "",
    monthlyFee: "",
    monthlyHoursAllocated: "",
    hourlyRate: "",
    billingDayOfMonth: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    termsAndConditions: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Contract title is required."); return; }
    if (!form.startDate) { setError("Start date is required."); return; }
    setError(null);
    startTransition(async () => {
      const res = await createContractAction({
        shopId,
        shopSlug,
        title: form.title,
        description: form.description || undefined,
        clientId: form.clientId || undefined,
        dealId: form.dealId || undefined,
        currency,
        monthlyFee: parseFloat(form.monthlyFee) || 0,
        isRetainerHours: isHoursBased,
        monthlyHoursAllocated: parseFloat(form.monthlyHoursAllocated) || 0,
        hourlyRate: parseFloat(form.hourlyRate) || 0,
        autoInvoiceEnabled: autoInvoice,
        billingDayOfMonth: parseInt(form.billingDayOfMonth) || 1,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        termsAndConditions: form.termsAndConditions || undefined,
      });
      if (res.success) {
        router.push(`/workspaces/${shopSlug}/crm/contracts/${res.contractId}`);
      } else {
        setError(res.error || "Failed to create contract.");
      }
    });
  };

  const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link href={`/workspaces/${shopSlug}/crm/contracts`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Contracts
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Contract Details</h2>
        <div>
          <label className={labelClass}>Title *</label>
          <input type="text" value={form.title} onChange={set("title")} placeholder="e.g. IT Support Retainer — TechCorp" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Brief scope of this retainer…" className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Linked Client</label>
            <select value={form.clientId} onChange={set("clientId")} className={inputClass}>
              <option value="">No client linked</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Linked Deal</label>
            <select value={form.dealId} onChange={set("dealId")} className={inputClass}>
              <option value="">No deal linked</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.title} ({d.stage})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Billing</h2>

        {/* Retainer type toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsHoursBased(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${!isHoursBased ? "border-transparent text-white shadow-sm" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
            style={!isHoursBased ? { backgroundColor: brandColor } : {}}
          >
            Fixed Monthly Fee
          </button>
          <button
            type="button"
            onClick={() => setIsHoursBased(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${isHoursBased ? "border-transparent text-white shadow-sm" : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"}`}
            style={isHoursBased ? { backgroundColor: brandColor } : {}}
          >
            Hours-Based Retainer
          </button>
        </div>

        {!isHoursBased ? (
          <div>
            <label className={labelClass}>Monthly Fee ({currency})</label>
            <input type="number" min="0" step="0.01" value={form.monthlyFee} onChange={set("monthlyFee")} placeholder="0.00" className={inputClass} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Hours / Month</label>
              <input type="number" min="0" step="0.5" value={form.monthlyHoursAllocated} onChange={set("monthlyHoursAllocated")} placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rate / Hour ({currency})</label>
              <input type="number" min="0" step="0.01" value={form.hourlyRate} onChange={set("hourlyRate")} placeholder="0.00" className={inputClass} />
              {form.monthlyHoursAllocated && form.hourlyRate && (
                <p className="text-[11px] text-gray-500 mt-1">
                  = {(parseFloat(form.monthlyHoursAllocated) * parseFloat(form.hourlyRate)).toLocaleString()} {currency}/mo
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <input
            id="auto-invoice"
            type="checkbox"
            checked={autoInvoice}
            onChange={e => setAutoInvoice(e.target.checked)}
            className="w-4 h-4 rounded accent-emerald-500"
          />
          <label htmlFor="auto-invoice" className="text-sm text-gray-800 font-medium cursor-pointer">
            Auto-generate monthly invoice on billing date
          </label>
        </div>

        {autoInvoice && (
          <div>
            <label className={labelClass}>Billing Day of Month</label>
            <input type="number" min="1" max="28" value={form.billingDayOfMonth} onChange={set("billingDayOfMonth")} className={`${inputClass} w-32`} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Term</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date *</label>
            <input type="date" value={form.startDate} onChange={set("startDate")} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>End Date <span className="text-gray-400 font-normal">(leave blank for open-ended)</span></label>
            <input type="date" value={form.endDate} onChange={set("endDate")} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <label className={labelClass}>Terms & Conditions</label>
        <textarea value={form.termsAndConditions} onChange={set("termsAndConditions")} rows={4} placeholder="Scope limitations, SLA response times, cancellation clauses…" className={`${inputClass} resize-none`} />
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">{error}</p>}

      <button type="submit" disabled={isPending} className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 shadow-sm" style={{ backgroundColor: brandColor }}>
        {isPending ? "Creating…" : "Create Contract"}
      </button>
    </form>
  );
}
