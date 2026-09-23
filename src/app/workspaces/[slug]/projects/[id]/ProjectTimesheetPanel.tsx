"use client";

import { useState, useTransition } from "react";
import { logTimesheetAction, submitTimesheetAction, reviewTimesheetAction, generateInvoiceFromTimesheetsAction } from "@/lib/actions/projects";
import { formatCurrency } from "@/lib/utils";
import { Clock, Plus, Check, X, FileText, ChevronDown } from "lucide-react";

interface Timesheet {
  id: string;
  workDate: string;
  hoursLogged: string;
  taskDescription: string;
  isBillable: boolean;
  billableRate: string;
  billableAmount: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  user?: { name: string } | null;
  reviewNotes?: string | null;
  invoicedDocumentId?: string | null;
}

interface ProjectTimesheetPanelProps {
  timesheets: Timesheet[];
  projectId: string;
  shopId: string;
  shopSlug: string;
  currency: string;
  brandColor: string;
  budgetType: string;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400",
  SUBMITTED: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  APPROVED: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

export function ProjectTimesheetPanel({
  timesheets: initialTimesheets,
  projectId,
  shopId,
  shopSlug,
  currency,
  brandColor,
  budgetType,
}: ProjectTimesheetPanelProps) {
  const [timesheets, setTimesheets] = useState<Timesheet[]>(initialTimesheets);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    workDate: today,
    hours: "",
    description: "",
    isBillable: true,
  });

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleLog = () => {
    if (!parseFloat(form.hours) || !form.description.trim()) {
      setError("Hours and task description are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await logTimesheetAction({
        projectId,
        shopId,
        shopSlug,
        workDate: form.workDate,
        hoursLogged: parseFloat(form.hours),
        taskDescription: form.description.trim(),
        isBillable: form.isBillable,
      });
      if (res.success) {
        const entry: Timesheet = {
          id: res.timesheetId!,
          workDate: form.workDate,
          hoursLogged: form.hours,
          taskDescription: form.description.trim(),
          isBillable: form.isBillable,
          billableRate: "0",
          billableAmount: "0",
          status: "DRAFT",
        };
        setTimesheets(prev => [entry, ...prev]);
        setForm({ workDate: today, hours: "", description: "", isBillable: true });
        setShowForm(false);
      } else {
        setError(res.error || "Failed to log timesheet.");
      }
    });
  };

  const handleSubmit = (tsId: string) => {
    startTransition(async () => {
      await submitTimesheetAction(tsId, shopId, shopSlug, projectId);
      setTimesheets(prev => prev.map(t => t.id === tsId ? { ...t, status: "SUBMITTED" } : t));
    });
  };

  const handleReview = (tsId: string, action: "APPROVED" | "REJECTED") => {
    startTransition(async () => {
      await reviewTimesheetAction({ timesheetId: tsId, shopId, shopSlug, projectId, action });
      setTimesheets(prev => prev.map(t => t.id === tsId ? { ...t, status: action } : t));
    });
  };

  const handleGenerateInvoice = () => {
    const selectedIds = Array.from(selected);
    if (selectedIds.length === 0) {
      setMessage("Select at least one approved entry to invoice.");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await generateInvoiceFromTimesheetsAction({
        projectId,
        shopId,
        shopSlug,
        timesheetIds: selectedIds,
      });
      if (res.success) {
        setMessage("✓ Invoice created.");
        setSelected(new Set());
        window.open(`/workspaces/${shopSlug}/documents/${res.documentId}`, "_blank");
      } else {
        setMessage(res.error || "Failed to generate invoice.");
      }
    });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const approvedUnbilled = timesheets.filter(t => t.status === "APPROVED" && t.isBillable && !t.invoicedDocumentId);
  const totalApprovedBillable = timesheets
    .filter(t => t.status === "APPROVED" && t.isBillable)
    .reduce((s, t) => s + parseFloat(String(t.billableAmount)), 0);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Timesheets</h3>
          {totalApprovedBillable > 0 && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {formatCurrency(totalApprovedBillable, currency)} billable (approved)
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {approvedUnbilled.length > 0 && budgetType === "TIME_AND_MATERIALS" && (
            <button
              onClick={handleGenerateInvoice}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-60"
              style={{ backgroundColor: brandColor }}
            >
              <FileText className="w-3 h-3" /> Invoice Selected
            </button>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <Plus className="w-3 h-3" /> Log Time
          </button>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Date</label>
              <input type="date" value={form.workDate} onChange={setF("workDate")}
                className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Hours *</label>
              <input type="number" min="0.25" step="0.25" value={form.hours} onChange={setF("hours")} placeholder="e.g. 3"
                className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Task Description *</label>
            <textarea value={form.description} onChange={setF("description")} rows={2} placeholder="What did you work on?"
              className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="billable"
              type="checkbox"
              checked={form.isBillable}
              onChange={e => setForm(p => ({ ...p, isBillable: e.target.checked }))}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <label htmlFor="billable" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">Billable to client</label>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
            <button onClick={handleLog} disabled={isPending}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60"
              style={{ backgroundColor: brandColor }}>
              {isPending ? "Logging…" : "Log Time"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`px-4 py-2 text-xs ${message.startsWith("✓") ? "bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/8 text-red-600 dark:text-red-400"}`}>
          {message}
        </div>
      )}

      {/* Timesheet rows */}
      <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-80 overflow-y-auto">
        {timesheets.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <Clock className="w-6 h-6 text-gray-300" />
            No time logged yet. Start tracking work for this project.
          </div>
        ) : (
          timesheets.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3.5">
              {/* Checkbox for T&M invoicing */}
              {t.status === "APPROVED" && t.isBillable && !t.invoicedDocumentId && budgetType === "TIME_AND_MATERIALS" && (
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleSelect(t.id)}
                  className="w-3.5 h-3.5 rounded accent-emerald-500 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[t.status]}`}>
                    {t.status}
                  </span>
                  {!t.isBillable && <span className="text-[10px] text-gray-400">Non-billable</span>}
                  <span className="text-[10px] text-gray-400">{t.workDate}</span>
                </div>
                <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{t.taskDescription}</p>
                {t.user && <p className="text-[10px] text-gray-400 mt-0.5">{t.user.name}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{parseFloat(t.hoursLogged).toFixed(1)}h</p>
                {t.isBillable && parseFloat(t.billableAmount) > 0 && (
                  <p className="text-[11px] text-gray-400">{formatCurrency(parseFloat(t.billableAmount), currency)}</p>
                )}
              </div>
              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                {t.status === "DRAFT" && (
                  <button onClick={() => handleSubmit(t.id)} disabled={isPending} title="Submit for approval"
                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/15 disabled:opacity-40">
                    <Check className="w-3 h-3" />
                  </button>
                )}
                {t.status === "SUBMITTED" && (
                  <>
                    <button onClick={() => handleReview(t.id, "APPROVED")} disabled={isPending}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 hover:bg-emerald-100 disabled:opacity-40">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleReview(t.id, "REJECTED")} disabled={isPending}
                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-100 disabled:opacity-40">
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
