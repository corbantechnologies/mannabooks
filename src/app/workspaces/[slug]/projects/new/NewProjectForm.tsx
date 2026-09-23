"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/lib/actions/projects";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Client { id: string; name: string; }
interface Deal { id: string; title: string; }
interface Contract { id: string; contractNumber: string; title: string; }

interface NewProjectFormProps {
  shopId: string;
  shopSlug: string;
  clients: Client[];
  deals: Deal[];
  contracts: Contract[];
  currency: string;
  brandColor: string;
  initialDealId?: string;
  initialContractId?: string;
  initialClientId?: string;
}

export function NewProjectForm({
  shopId, shopSlug, clients, deals, contracts, currency, brandColor,
  initialDealId, initialContractId, initialClientId,
}: NewProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [budgetType, setBudgetType] = useState<"FIXED" | "TIME_AND_MATERIALS">("FIXED");

  const [form, setForm] = useState({
    name: "",
    description: "",
    clientId: initialClientId || "",
    dealId: initialDealId || "",
    contractId: initialContractId || "",
    budgetAmount: "",
    budgetHours: "",
    startDate: "",
    endDate: "",
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setError(null);

    startTransition(async () => {
      const res = await createProjectAction({
        shopId,
        shopSlug,
        name: form.name,
        description: form.description || undefined,
        clientId: form.clientId || undefined,
        dealId: form.dealId || undefined,
        contractId: form.contractId || undefined,
        currency,
        budgetType,
        budgetAmount: parseFloat(form.budgetAmount) || 0,
        budgetHours: parseFloat(form.budgetHours) || 0,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });

      if (res.success) {
        router.push(`/workspaces/${shopSlug}/projects/${res.projectId}`);
      } else {
        setError(res.error || "Failed to create project.");
      }
    });
  };

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2";
  const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link href={`/workspaces/${shopSlug}/projects`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
      </Link>

      <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Project Details</h2>
        <div>
          <label className={labelClass}>Project Name *</label>
          <input type="text" value={form.name} onChange={set("name")} placeholder="e.g. ERP Implementation Phase 1" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Project objectives and deliverables…" className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client</label>
            <select value={form.clientId} onChange={set("clientId")} className={inputClass}>
              <option value="">No client linked</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Linked Deal</label>
            <select value={form.dealId} onChange={set("dealId")} className={inputClass}>
              <option value="">No deal linked</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Linked Contract/SLA</label>
            <select value={form.contractId} onChange={set("contractId")} className={inputClass}>
              <option value="">No contract linked</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.contractNumber} — {c.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Budget</h2>

        <div className="flex gap-2">
          {(["FIXED", "TIME_AND_MATERIALS"] as const).map(bt => (
            <button
              key={bt}
              type="button"
              onClick={() => setBudgetType(bt)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${budgetType === bt ? "border-transparent text-white" : "border-gray-200 dark:border-white/10 text-gray-500"}`}
              style={budgetType === bt ? { backgroundColor: brandColor } : {}}
            >
              {bt === "FIXED" ? "Fixed Price" : "Time & Materials"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{budgetType === "FIXED" ? `Fixed Budget (${currency})` : `Budget Cap (${currency})`}</label>
            <input type="number" min="0" step="0.01" value={form.budgetAmount} onChange={set("budgetAmount")} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Estimated Hours</label>
            <input type="number" min="0" step="1" value={form.budgetHours} onChange={set("budgetHours")} placeholder="0" className={inputClass} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Timeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            <input type="date" value={form.startDate} onChange={set("startDate")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Target End Date</label>
            <input type="date" value={form.endDate} onChange={set("endDate")} className={inputClass} />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-500/8 px-4 py-2.5 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
        style={{ backgroundColor: brandColor }}
      >
        {isPending ? "Creating…" : "Create Project"}
      </button>
    </form>
  );
}
