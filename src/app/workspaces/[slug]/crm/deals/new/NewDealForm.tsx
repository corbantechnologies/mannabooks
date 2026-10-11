"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/api/axios";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Client { id: string; name: string; email: string | null; }

interface NewDealFormProps {
  shopId: string;
  shopSlug: string;
  clients: Client[];
  currency: string;
  brandColor: string;
}

export function NewDealForm({ shopId, shopSlug, clients, currency, brandColor }: NewDealFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    clientId: "",
    estimatedValue: "",
    winProbability: "50",
    expectedCloseDate: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.contactName.trim()) {
      setError("Deal title and contact name are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res: any = await axiosClient.post("/crm/deals", {
          shop_id: shopId,
          title: form.title,
          contact_name: form.contactName,
          contact_email: form.contactEmail || undefined,
          contact_phone: form.contactPhone || undefined,
          client_id: form.clientId || undefined,
          estimated_value: parseFloat(form.estimatedValue) || 0,
          win_probability: parseInt(form.winProbability) || 50,
          expected_close_date: form.expectedCloseDate ? form.expectedCloseDate : undefined,
          currency,
          notes: form.notes || undefined,
        });
        const dealId = res?.dealId || res?.deal?.id || res?.id;
        if (dealId) {
          router.push(`/workspaces/${shopSlug}/crm/deals/${dealId}`);
        } else {
          router.push(`/workspaces/${shopSlug}/crm`);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || "Failed to create deal.");
      }
    });
  };

  const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link href={`/workspaces/${shopSlug}/crm`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Pipeline
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Deal Details</h2>

        <div>
          <label className={labelClass}>Deal Title *</label>
          <input type="text" value={form.title} onChange={set("title")} placeholder="e.g. Website Redesign — TechCorp" required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Existing Client <span className="text-gray-400 font-normal">(optional — links deal to client record)</span></label>
          <select value={form.clientId} onChange={set("clientId")} className={inputClass}>
            <option value="">No client linked</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.email ? `— ${c.email}` : ""}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Contact Person</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input type="text" value={form.contactName} onChange={set("contactName")} placeholder="Jane Mwangi" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="jane@company.co.ke" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" value={form.contactPhone} onChange={set("contactPhone")} placeholder="+254 7XX XXX XXX" className={inputClass} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Deal Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Estimated Value ({currency})</label>
            <input type="number" min="0" step="0.01" value={form.estimatedValue} onChange={set("estimatedValue")} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Win Probability ({form.winProbability}%)</label>
            <input type="range" min="0" max="100" step="5" value={form.winProbability} onChange={set("winProbability")} className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div>
            <label className={labelClass}>Expected Close Date</label>
            <input type="date" value={form.expectedCloseDate} onChange={set("expectedCloseDate")} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <label className={labelClass}>Internal Notes</label>
        <textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Context, source of lead, key requirements…" className={`${inputClass} resize-none`} />
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60"
        style={{ backgroundColor: brandColor }}
      >
        {isPending ? "Creating…" : "Create Deal"}
      </button>
    </form>
  );
}
