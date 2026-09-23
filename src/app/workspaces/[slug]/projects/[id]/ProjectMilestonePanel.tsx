"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  createMilestoneAction,
  updateMilestoneStatusAction,
  convertMilestoneToInvoiceAction,
} from "@/lib/actions/projects";
import { formatCurrency } from "@/lib/utils";
import { Plus, CheckCircle2, FileText, Target, Trash2, ChevronDown } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  amount: string;
  currency: string;
  percentageOfTotal: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "INVOICED";
  dueDate?: string | null;
  invoicedDocument?: { id: string; docNumber: string } | null;
}

interface ProjectMilestonePanelProps {
  milestones: Milestone[];
  projectId: string;
  shopId: string;
  shopSlug: string;
  clientId?: string;
  currency: string;
  brandColor: string;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400",
  IN_PROGRESS: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  COMPLETED: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  INVOICED: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
};

export function ProjectMilestonePanel({
  milestones: initialMilestones,
  projectId,
  shopId,
  shopSlug,
  clientId,
  currency,
  brandColor,
}: ProjectMilestonePanelProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    dueDate: "",
    percentageOfTotal: "",
  });

  const setF = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleAdd = () => {
    if (!form.title.trim() || !form.amount) { setError("Title and amount are required."); return; }
    setError(null);
    startTransition(async () => {
      const res = await createMilestoneAction({
        projectId,
        shopId,
        shopSlug,
        title: form.title.trim(),
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        currency,
        percentageOfTotal: parseFloat(form.percentageOfTotal) || 0,
        dueDate: form.dueDate || undefined,
        displayOrder: milestones.length,
      });
      if (res.success) {
        setMilestones(prev => [
          ...prev,
          {
            id: res.milestoneId!,
            title: form.title.trim(),
            description: form.description || null,
            amount: form.amount,
            currency,
            percentageOfTotal: form.percentageOfTotal || "0",
            status: "PENDING",
            dueDate: form.dueDate || null,
            invoicedDocument: null,
          },
        ]);
        setForm({ title: "", description: "", amount: "", dueDate: "", percentageOfTotal: "" });
        setShowForm(false);
      } else {
        setError(res.error || "Failed to add milestone.");
      }
    });
  };

  const handleStatusChange = (milestoneId: string, newStatus: Milestone["status"]) => {
    startTransition(async () => {
      await updateMilestoneStatusAction(milestoneId, projectId, shopId, shopSlug, newStatus);
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, status: newStatus } : m));
    });
  };

  const handleConvert = (milestoneId: string) => {
    setConvertingId(milestoneId);
    startTransition(async () => {
      const res = await convertMilestoneToInvoiceAction({ milestoneId, projectId, shopId, shopSlug, clientId });
      if (res.success) {
        setMilestones(prev => prev.map(m =>
          m.id === milestoneId ? { ...m, status: "INVOICED", invoicedDocument: { id: res.documentId!, docNumber: "" } } : m
        ));
        window.open(`/workspaces/${shopSlug}/documents/${res.documentId}`, "_blank");
      } else {
        setError(res.error || "Failed to convert to invoice.");
      }
      setConvertingId(null);
    });
  };

  const totalValue = milestones.reduce((s, m) => s + parseFloat(String(m.amount)), 0);
  const invoicedValue = milestones.filter(m => m.status === "INVOICED").reduce((s, m) => s + parseFloat(String(m.amount)), 0);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Milestones</h3>
          {totalValue > 0 && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {formatCurrency(invoicedValue, currency)} of {formatCurrency(totalValue, currency)} invoiced
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <Plus className="w-3 h-3" /> Add Milestone
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={setF("title")}
                placeholder="e.g. Discovery & Requirements"
                className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={setF("amount")}
                placeholder="0.00"
                className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={setF("dueDate")}
                className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={setF("description")}
              rows={2}
              placeholder="Deliverables for this milestone…"
              className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60"
              style={{ backgroundColor: brandColor }}
            >
              {isPending ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Milestones list */}
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {milestones.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <Target className="w-6 h-6 text-gray-300" />
            No milestones yet. Break the project into billable phases.
          </div>
        ) : (
          milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[m.status]}`}>
                    {m.status.replace("_", " ")}
                  </span>
                  {m.dueDate && (
                    <span className="text-[10px] text-gray-400">Due {new Date(m.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{m.title}</p>
                {m.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.description}</p>}
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(parseFloat(String(m.amount)), m.currency)}
                </p>
              </div>

              <div className="flex gap-1.5 shrink-0">
                {m.status !== "INVOICED" && m.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleStatusChange(m.id, "COMPLETED")}
                    disabled={isPending}
                    title="Mark Completed"
                    className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {m.status === "COMPLETED" && (
                  <button
                    onClick={() => handleConvert(m.id)}
                    disabled={isPending && convertingId === m.id}
                    title="Convert to Invoice"
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/15 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {convertingId === m.id ? "…" : "Invoice"}
                  </button>
                )}
                {m.status === "INVOICED" && m.invoicedDocument && (
                  <Link
                    href={`/workspaces/${shopSlug}/documents/${m.invoicedDocument.id}`}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                  >
                    <FileText className="w-3 h-3" /> View
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
