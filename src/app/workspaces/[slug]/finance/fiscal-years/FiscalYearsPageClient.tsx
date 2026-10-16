"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Check,
  Plus,
  Lock,
  Unlock,
  ArrowRight,
  ShieldCheck,
  Scale,
  FileBarChart,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface FiscalYearRecord {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  isCurrent: boolean;
}

interface FiscalYearsPageClientProps {
  shop: any;
  shopSlug: string;
  activeFiscalYear: any;
  initialFiscalYears: FiscalYearRecord[];
}

export function FiscalYearsPageClient({
  shop,
  shopSlug,
  activeFiscalYear,
  initialFiscalYears,
}: FiscalYearsPageClientProps) {
  const router = useRouter();
  const [fiscalYears, setFiscalYears] = useState<FiscalYearRecord[]>(initialFiscalYears);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New Fiscal Year form state
  const now = new Date();
  const currentYear = now.getFullYear();
  const [newLabel, setNewLabel] = useState(`FY ${currentYear}/${currentYear + 1}`);
  const [newStartDate, setNewStartDate] = useState(`${currentYear}-01-01`);
  const [newEndDate, setNewEndDate] = useState(`${currentYear}-12-31`);

  const activeFyId = activeFiscalYear?.id;

  const handleSwitchPlatformContext = (fy: FiscalYearRecord) => {
    if (activeFyId === fy.id) {
      toast("This fiscal year is already the active platform context.", { icon: "ℹ️" });
      return;
    }

    if (typeof document !== "undefined") {
      document.cookie = `mannabooks_fy_${shop.id}=${fy.id}; path=/; max-age=31536000; SameSite=Lax`;
    }
    toast.success(`Platform context switched to ${fy.label}!`);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const handleDeclareFiscalYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newStartDate || !newEndDate) {
      toast.error("Please provide label, start date, and end date.");
      return;
    }

    startTransition(async () => {
      try {
        const res: any = await axiosClient.post("/accounts/fiscal-years", {
          shop_id: shop.id,
          label: newLabel.trim(),
          start_date: newStartDate,
          end_date: newEndDate,
        });

        if (res?.success !== false) {
          toast.success(`Fiscal Year "${newLabel}" declared successfully!`);
          setShowDeclareModal(false);
          // Set as active context automatically
          const createdFyId = res?.fiscalYear?.id || res?.data?.id;
          if (createdFyId && typeof document !== "undefined") {
            document.cookie = `mannabooks_fy_${shop.id}=${createdFyId}; path=/; max-age=31536000; SameSite=Lax`;
          }
          setTimeout(() => {
            window.location.reload();
          }, 600);
        } else {
          toast.error(res?.error || "Failed to declare fiscal year.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to declare fiscal year.");
      }
    });
  };

  const handleToggleClose = (fy: FiscalYearRecord) => {
    const actionName = fy.isClosed ? "reopen" : "close";
    startTransition(async () => {
      try {
        const res: any = await axiosClient.post(`/accounts/fiscal-years/${fy.id}/${actionName}`, {
          shop_id: shop.id,
        });

        if (res?.success !== false) {
          toast.success(`Fiscal Year ${fy.label} ${fy.isClosed ? "reopened" : "closed and locked"}!`);
          setFiscalYears((prev) =>
            prev.map((item) => (item.id === fy.id ? { ...item, isClosed: !fy.isClosed } : item))
          );
        } else {
          toast.error(res?.error || `Failed to ${actionName} fiscal year.`);
        }
      } catch (err: any) {
        toast.error(err?.message || `Failed to ${actionName} fiscal year.`);
      }
    });
  };

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Accounting &amp; Tax Scope</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
            Fiscal Years Manager &amp; Scope Switcher
          </h1>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Control the active reporting year across the entire Manna platform. Switching years scopes all invoices,
            analytics, and financial statements to that fiscal timeframe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Link
            href={`/workspaces/${shopSlug}/finance/tax/computation`}
            className="btn-secondary-modern px-3.5 py-2 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <FileBarChart className="w-3.5 h-3.5" />
            Tax Computation
          </Link>
          <button
            type="button"
            onClick={() => setShowDeclareModal(true)}
            className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Declare New Fiscal Year
          </button>
        </div>
      </div>

      {/* ACTIVE CONTEXT BANNER */}
      {activeFiscalYear ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 text-white shadow-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                  Active Platform Context
                </span>
                {activeFiscalYear.isClosed ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded">
                    Period Locked
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded">
                    Open for Posting
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold font-sans mt-1">{activeFiscalYear.label}</h2>
              <p className="text-xs text-zinc-400 font-mono">
                {activeFiscalYear.startDate} &rarr; {activeFiscalYear.endDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/workspaces/${shopSlug}/finance/fiscal-years/${activeFiscalYear.id}`}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium font-sans transition-colors inline-flex items-center gap-1.5"
            >
              Inspect Year Ledger &amp; Periods
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">No active fiscal year declared.</span> Declare a fiscal year below to enable
            scoped accounting, period closures, and tax computations.
          </div>
        </div>
      )}

      {/* FISCAL YEARS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide font-sans">
            Declared Fiscal Years ({fiscalYears.length})
          </h3>
          <span className="text-xs text-zinc-400 font-sans">Click &ldquo;Activate&rdquo; to switch platform view</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fiscalYears.map((fy) => {
            const isActive = fy.id === activeFyId;
            return (
              <div
                key={fy.id}
                className={`card-modern p-5 rounded-2xl transition-all border flex flex-col justify-between ${
                  isActive
                    ? "border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-md"
                    : "border-zinc-200 bg-white hover:border-zinc-300 shadow-2xs"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base text-zinc-900">{fy.label}</h4>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        {fy.startDate} &mdash; {fy.endDate}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3" />
                          ACTIVE CONTEXT
                        </span>
                      )}
                      {fy.isClosed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Lock className="w-3 h-3" />
                          CLOSED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          <Unlock className="w-3 h-3" />
                          OPEN
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Database Current:</span>
                      <span className="font-mono font-semibold">{fy.isCurrent ? "Yes" : "Historical"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Status:</span>
                      <span className="font-medium">{fy.isClosed ? "Locked (Read-Only)" : "Active for Posting"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => handleSwitchPlatformContext(fy)}
                        className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold cursor-pointer"
                        title="Switch the entire platform context to this fiscal year"
                      >
                        Set as Active
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 font-sans flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Selected
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleClose(fy)}
                      disabled={isPending}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                      title={fy.isClosed ? "Reopen fiscal year" : "Close and lock fiscal year"}
                    >
                      {fy.isClosed ? "Reopen" : "Lock"}
                    </button>
                  </div>

                  <Link
                    href={`/workspaces/${shopSlug}/finance/fiscal-years/${fy.id}`}
                    className="text-xs font-semibold text-zinc-800 hover:underline inline-flex items-center gap-1"
                  >
                    Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}

          {fiscalYears.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 space-y-3">
              <Calendar className="w-8 h-8 text-zinc-400 mx-auto" />
              <h4 className="text-sm font-semibold text-zinc-800">No Fiscal Years Declared Yet</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Declaring fiscal years allows you to maintain independent accounting periods, lock past years, and track
                accurate statutory tax returns.
              </p>
              <button
                type="button"
                onClick={() => setShowDeclareModal(true)}
                className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase"
              >
                + Declare First Fiscal Year
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QUICK COMPLIANCE & ACCELERATOR SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200">
        <Link
          href={`/workspaces/${shopSlug}/finance/tax/computation`}
          className="card-modern p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all flex items-center gap-3.5"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <FileBarChart className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-semibold text-xs text-zinc-900">Tax Computation</h5>
            <p className="text-[11px] text-zinc-500">Corporate Income Tax &amp; Turnover Tax schedules</p>
          </div>
        </Link>

        <Link
          href={`/workspaces/${shopSlug}/finance/tax/assets`}
          className="card-modern p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all flex items-center gap-3.5"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-semibold text-xs text-zinc-900">Capital Allowances</h5>
            <p className="text-[11px] text-zinc-500">Fixed assets wear &amp; tear schedules</p>
          </div>
        </Link>

        <Link
          href={`/workspaces/${shopSlug}/finance/periods`}
          className="card-modern p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all flex items-center gap-3.5"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-semibold text-xs text-zinc-900">Monthly Accounting Periods</h5>
            <p className="text-[11px] text-zinc-500">Inspect monthly audit breakdowns and locks</p>
          </div>
        </Link>
      </div>

      {/* DECLARE NEW FISCAL YEAR MODAL */}
      {showDeclareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-zinc-900">Declare New Fiscal Year</h3>
                <p className="text-xs text-zinc-500">Specify dates for the accounting &amp; statutory reporting cycle.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeclareModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeclareFiscalYear} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Fiscal Year Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. FY 2026/2027 or 2026"
                  className="input-modern w-full px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="input-modern w-full px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="input-modern w-full px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-600 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Once declared, you can switch the entire platform context to this year to log transactions, inspect
                  monthly accounting periods, and prepare statutory filings.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclareModal(false)}
                  className="btn-secondary-modern px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary-modern px-5 py-2 text-xs font-semibold uppercase tracking-wider"
                >
                  {isPending ? "Declaring..." : "Declare Fiscal Year"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
