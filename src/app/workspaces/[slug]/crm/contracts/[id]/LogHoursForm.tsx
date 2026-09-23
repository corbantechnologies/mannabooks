"use client";

import { useState, useTransition } from "react";
import { logContractHoursAction } from "@/lib/actions/contracts";
import { Clock } from "lucide-react";

interface LogHoursFormProps {
  contractId: string;
  shopId: string;
  shopSlug: string;
  brandColor: string;
}

export function LogHoursForm({ contractId, shopId, shopSlug, brandColor }: LogHoursFormProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    hours: "",
    description: "",
    logDate: today,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(form.hours);
    if (!hours || hours <= 0) { setError("Enter a valid number of hours."); return; }
    if (!form.description.trim()) { setError("Task description is required."); return; }
    setError(null);
    startTransition(async () => {
      const res = await logContractHoursAction({
        contractId,
        shopId,
        shopSlug,
        hoursUsed: hours,
        description: form.description.trim(),
        logDate: form.logDate,
      });
      if (res.success) {
        setSuccess(true);
        setForm({ hours: "", description: "", logDate: today });
        setIsOpen(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || "Failed to log hours.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
          <Clock className="w-3.5 h-3.5" style={{ color: brandColor }} />
        </div>
        <span className="text-sm font-semibold text-gray-800">Log Hours Against This Retainer</span>
        {success && <span className="ml-auto text-xs text-emerald-600 font-semibold">✓ Logged</span>}
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <label className="block text-xs text-gray-700 mb-1.5 font-semibold">Hours *</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={form.hours}
                onChange={set("hours")}
                placeholder="e.g. 2.5"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1.5 font-semibold">Date</label>
              <input
                type="date"
                value={form.logDate}
                onChange={set("logDate")}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1.5 font-semibold">Task Description *</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              placeholder="What work was done? e.g. Monthly server maintenance and security patching"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60 transition-all shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              {isPending ? "Logging…" : "Log Hours"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
