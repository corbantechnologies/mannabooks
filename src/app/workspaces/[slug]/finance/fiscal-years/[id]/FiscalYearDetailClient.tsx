"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
    Calendar,
    Lock,
    Unlock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Scale,
    Layers,
    Search,
    ChevronDown,
    ChevronUp,
    ArrowUpRight,
    PieChart,
    ExternalLink,
    ShieldCheck,
    FileText,
    Building2,
    RefreshCw,
    X,
    Filter,
} from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { closePeriod, reopenPeriod, getPeriodDetails } from "@/lib/actions/gl";
import { closeFiscalYear, reopenFiscalYear, deleteFiscalYear } from "@/lib/actions/fiscal-years";

interface Props {
    shopId: string;
    shopSlug: string;
    currency: string;
    isGlEnabled: boolean;
    glOnboardingMode: boolean;
    initialData: any;
}

function fmt(n: number) {
    return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FiscalYearDetailClient({
    shopId,
    shopSlug,
    currency,
    isGlEnabled,
    glOnboardingMode,
    initialData,
}: Props) {
    const router = useRouter();
    const [data, setData] = useState<any>(initialData);
    const [isPending, startTransition] = useTransition();

    // Month filter & search state
    const [monthSearch, setMonthSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

    // Entry inspector drawer state
    const [inspectPeriodId, setInspectPeriodId] = useState<string | null>(null);
    const [periodDetails, setPeriodDetails] = useState<any | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [entrySearch, setEntrySearch] = useState("");

    // Modal dialogs
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [confirmClosePeriodId, setConfirmClosePeriodId] = useState<string | null>(null);

    const { fiscalYear, kpis, quarters, topRevenueAccounts, topExpenseAccounts, periods, closingChecklist } = data;

    // Toggle month expanded details
    function toggleExpandMonth(periodId: string) {
        setExpandedMonths(prev => ({
            ...prev,
            [periodId]: !prev[periodId],
        }));
    }

    // Inspect period journal entries
    async function handleInspectPeriod(periodId: string) {
        setInspectPeriodId(periodId);
        setLoadingDetails(true);
        setPeriodDetails(null);
        try {
            const res = await getPeriodDetails(shopId, periodId);
            if (res.success) {
                setPeriodDetails(res.data);
            } else {
                toast.error(res.error || "Failed to load period journal entries.");
                setInspectPeriodId(null);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to load period journal entries.");
            setInspectPeriodId(null);
        } finally {
            setLoadingDetails(false);
        }
    }

    // Lock/Close single accounting period
    function handleClosePeriod(periodId: string) {
        startTransition(async () => {
            const toastId = toast.loading("Closing period & recording balance snapshot...");
            const res = await closePeriod(shopId, shopSlug, periodId);
            if (res.success) {
                toast.success("Period closed successfully. Entries are now locked.", { id: toastId });
                setConfirmClosePeriodId(null);
                // Optimistically update
                setData((prev: any) => ({
                    ...prev,
                    periods: prev.periods.map((p: any) =>
                        p.id === periodId
                            ? { ...p, status: "CLOSED", closedAt: new Date().toISOString() }
                            : p
                    ),
                    kpis: {
                        ...prev.kpis,
                        closedPeriodsCount: prev.kpis.closedPeriodsCount + 1,
                        lockProgressPercent: Math.round(((prev.kpis.closedPeriodsCount + 1) / prev.kpis.totalPeriodsCount) * 100),
                    },
                }));
                router.refresh();
            } else {
                toast.error(res.error || "Failed to close period.", { id: toastId });
            }
        });
    }

    // Reopen single accounting period
    function handleReopenPeriod(periodId: string) {
        startTransition(async () => {
            const toastId = toast.loading("Reopening period...");
            const res = await reopenPeriod(shopId, shopSlug, periodId);
            if (res.success) {
                toast.success("Period reopened. Entries can now be posted.", { id: toastId });
                setData((prev: any) => ({
                    ...prev,
                    periods: prev.periods.map((p: any) =>
                        p.id === periodId
                            ? { ...p, status: "OPEN", closedAt: null, closedByName: null }
                            : p
                    ),
                    kpis: {
                        ...prev.kpis,
                        closedPeriodsCount: Math.max(0, prev.kpis.closedPeriodsCount - 1),
                        lockProgressPercent: Math.round(((prev.kpis.closedPeriodsCount - 1) / prev.kpis.totalPeriodsCount) * 100),
                    },
                }));
                router.refresh();
            } else {
                toast.error(res.error || "Failed to reopen period.", { id: toastId });
            }
        });
    }

    // Close entire fiscal year
    function handleCloseFiscalYear() {
        startTransition(async () => {
            const toastId = toast.loading("Executing year-end closure & Retained Earnings rollover...");
            const res = await closeFiscalYear(shopId, shopSlug, fiscalYear.id);
            if (res.success) {
                toast.success("Fiscal Year closed and audited! Closing entries posted.", { id: toastId });
                setShowCloseModal(false);
                setData((prev: any) => ({
                    ...prev,
                    fiscalYear: { ...prev.fiscalYear, isClosed: true },
                    closingChecklist: { ...prev.closingChecklist, canCloseYear: false },
                }));
                router.refresh();
            } else {
                toast.error(res.error || "Failed to close fiscal year.", { id: toastId });
            }
        });
    }

    // Reopen closed fiscal year
    function handleReopenFiscalYear() {
        startTransition(async () => {
            const toastId = toast.loading("Reversing year-end closing entries and reopening year...");
            const res = await reopenFiscalYear(shopId, shopSlug, fiscalYear.id);
            if (res.success) {
                toast.success("Fiscal Year reopened! Prior closing entries removed.", { id: toastId });
                setShowReopenModal(false);
                setData((prev: any) => ({
                    ...prev,
                    fiscalYear: { ...prev.fiscalYear, isClosed: false },
                }));
                router.refresh();
            } else {
                toast.error(res.error || "Failed to reopen fiscal year.", { id: toastId });
            }
        });
    }

    // Filter & sort the 12 periods
    const filteredPeriods = periods
        .filter((p: any) => {
            if (statusFilter === "OPEN" && p.status !== "OPEN") return false;
            if (statusFilter === "CLOSED" && p.status !== "CLOSED") return false;
            if (monthSearch.trim()) {
                const q = monthSearch.toLowerCase();
                return p.periodName.toLowerCase().includes(q) || p.startDate.includes(q) || p.endDate.includes(q);
            }
            return true;
        })
        .sort((a: any, b: any) => {
            if (sortOrder === "ASC") return a.monthIndex - b.monthIndex;
            return b.monthIndex - a.monthIndex;
        });

    // Entries in inspector drawer
    const filteredDrawerEntries = periodDetails?.entries?.filter((e: any) => {
        if (!entrySearch.trim()) return true;
        const q = entrySearch.toLowerCase();
        return (
            e.description.toLowerCase().includes(q) ||
            e.debitAccountName.toLowerCase().includes(q) ||
            e.creditAccountName.toLowerCase().includes(q) ||
            e.debitAccountCode.includes(q) ||
            e.creditAccountCode.includes(q)
        );
    }) || [];

    const formattedStart = new Date(fiscalYear.startDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
    const formattedEnd = new Date(fiscalYear.endDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <div className="space-y-6">
            {/* Onboarding Mode Banner */}
            {glOnboardingMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span><strong>GL Onboarding Mode Active:</strong> Accounting period lock rules are currently relaxed for backdating opening transactions.</span>
                    </div>
                    <Link
                        href={`/workspaces/${shopSlug}/finance/accounts`}
                        className="text-xs font-mono font-bold text-amber-900 underline hover:text-amber-700"
                    >
                        Chart of Accounts ➔
                    </Link>
                </div>
            )}

            {/* Breadcrumb & Master Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                        <Link href={`/workspaces/${shopSlug}/finance`} className="hover:text-black transition-colors">
                            Finance
                        </Link>
                        <span>/</span>
                        <Link href={`/workspaces/${shopSlug}/finance/tax/settings`} className="hover:text-black transition-colors">
                            Fiscal Years
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-600 font-semibold">{fiscalYear.label}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                            {fiscalYear.label}
                        </h1>
                        <span
                            className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase px-2.5 py-1 rounded-full font-bold border ${
                                fiscalYear.isClosed
                                    ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${fiscalYear.isClosed ? "bg-zinc-400" : "bg-emerald-500 animate-pulse"}`} />
                            {fiscalYear.isClosed ? "Closed & Audited" : "Active / In Progress"}
                        </span>
                    </div>

                    <p className="text-sm text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {formattedStart} — {formattedEnd}
                        </span>
                        <span>•</span>
                        <span>{fiscalYear.daysTotal} Calendar Days</span>
                        <span>•</span>
                        <span className="text-zinc-700 font-medium">
                            {fiscalYear.daysElapsed} of {fiscalYear.daysTotal} Days Elapsed ({fiscalYear.progressPercent}%)
                        </span>
                    </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        href={`/workspaces/${shopSlug}/finance/periods`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 font-mono text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                        <Layers className="w-3.5 h-3.5 text-zinc-500" />
                        Periods View
                    </Link>

                    <Link
                        href={`/workspaces/${shopSlug}/finance/reports/pl`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 font-mono text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                        <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                        Annual P&L
                    </Link>

                    <Link
                        href={`/workspaces/${shopSlug}/finance/reports/trial-balance`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 font-mono text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                        <Scale className="w-3.5 h-3.5 text-zinc-500" />
                        Trial Balance
                    </Link>

                    {!fiscalYear.isClosed ? (
                        <button
                            onClick={() => setShowCloseModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                        >
                            <Lock className="w-3.5 h-3.5" />
                            Year-End Close & Rollover
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowReopenModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 font-mono text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <Unlock className="w-3.5 h-3.5 text-zinc-600" />
                            Reopen Fiscal Year
                        </button>
                    )}
                </div>
            </div>

            {/* Annual KPI Cards Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Gross Revenue */}
                <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Gross Turnover</span>
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900 truncate">
                        {currency} {fmt(kpis.totalRevenue)}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                        Credits to Class 4xxx accounts
                    </div>
                </div>

                {/* Operating Expenses */}
                <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Operating Expenses</span>
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 truncate">
                        {currency} {fmt(kpis.totalExpenses)}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                        Debits to Class 5xxx accounts
                    </div>
                </div>

                {/* Net Operating Profit / Margin */}
                <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Net Profit / (Loss)</span>
                        <PieChart className="w-4 h-4 text-zinc-600" />
                    </div>
                    <div className={`text-lg sm:text-xl font-bold font-mono truncate ${kpis.netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {currency} {fmt(kpis.netProfit)}
                    </div>
                    <div className="text-[11px] font-mono font-medium flex items-center gap-1.5">
                        <span className={kpis.netMargin >= 0 ? "text-emerald-600" : "text-rose-500"}>
                            {kpis.netMargin.toFixed(1)}% Net Margin
                        </span>
                    </div>
                </div>

                {/* Ledger Balance Health */}
                <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Ledger Health</span>
                        <ShieldCheck className={`w-4 h-4 ${kpis.isBalanced ? "text-emerald-600" : "text-amber-500"}`} />
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-zinc-900 mt-1 flex items-center gap-1">
                        {kpis.isBalanced ? (
                            <span className="text-emerald-700">✓ Balanced</span>
                        ) : (
                            <span className="text-amber-600">⚠ Imbalance Detected</span>
                        )}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono truncate">
                        {kpis.totalEntries} journal entries posted
                    </div>
                </div>

                {/* Period Lock Progress */}
                <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-1 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Audit Progress</span>
                        <Lock className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-zinc-900">
                        {kpis.closedPeriodsCount} / {kpis.totalPeriodsCount} <span className="text-xs text-zinc-400 font-normal">Months</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${kpis.lockProgressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Quarterly Performance Strip */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-mono text-xs uppercase font-bold text-zinc-500 tracking-wider">
                        Quarterly Performance Summary
                    </h2>
                    <span className="text-xs text-zinc-400 font-mono">
                        Q1 – Q4 Financial Highlights
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {quarters.map((q: any) => (
                        <div
                            key={q.quarter}
                            className="border border-zinc-200 rounded-xl p-4 bg-white hover:border-zinc-300 transition-all space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-zinc-900">{q.quarter}</span>
                                <span
                                    className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                                        q.status === "ALL_CLOSED"
                                            ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                                            : q.status === "PARTIAL"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}
                                >
                                    {q.status === "ALL_CLOSED" ? "3/3 Locked" : q.status === "PARTIAL" ? "Partially Open" : "Open"}
                                </span>
                            </div>

                            <div>
                                <div className="text-xs text-zinc-400 font-mono">Net Operating Income</div>
                                <div className={`text-base font-bold font-mono mt-0.5 ${q.netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                    {currency} {fmt(q.netProfit)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-[11px] font-mono">
                                <div>
                                    <span className="text-zinc-400 block text-[9px] uppercase">Revenue</span>
                                    <span className="font-semibold text-zinc-800">{fmt(q.revenue)}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-400 block text-[9px] uppercase">Expenses</span>
                                    <span className="font-semibold text-rose-600">{fmt(q.expenses)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Financial Drivers (Revenue & Expenses) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Revenue Contributors */}
                <div className="border border-zinc-200 rounded-xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-mono text-xs uppercase font-bold text-zinc-800">
                                Primary Revenue Streams
                            </h3>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-400">Class 4xxx Accounts</span>
                    </div>

                    {topRevenueAccounts.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-4 text-center">No revenue recorded in this fiscal year yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {topRevenueAccounts.map((acc: any) => (
                                <div key={acc.code} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[11px] font-bold text-zinc-500">{acc.code}</span>
                                            <span className="font-medium text-zinc-800">{acc.name}</span>
                                        </div>
                                        <div className="font-mono font-semibold text-zinc-900">
                                            {currency} {fmt(acc.amount)}
                                            <span className="text-zinc-400 font-normal ml-1.5 text-[10px]">
                                                ({acc.percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full"
                                            style={{ width: `${Math.min(100, acc.percentage)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Expense Drivers */}
                <div className="border border-zinc-200 rounded-xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                            <h3 className="font-mono text-xs uppercase font-bold text-zinc-800">
                                Major Expense Drivers
                            </h3>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-400">Class 5xxx Accounts</span>
                    </div>

                    {topExpenseAccounts.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-4 text-center">No expenses recorded in this fiscal year yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {topExpenseAccounts.map((acc: any) => (
                                <div key={acc.code} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[11px] font-bold text-zinc-500">{acc.code}</span>
                                            <span className="font-medium text-zinc-800">{acc.name}</span>
                                        </div>
                                        <div className="font-mono font-semibold text-rose-600">
                                            {currency} {fmt(acc.amount)}
                                            <span className="text-zinc-400 font-normal ml-1.5 text-[10px]">
                                                ({acc.percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-rose-400 h-full rounded-full"
                                            style={{ width: `${Math.min(100, acc.percentage)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* The 12 Accounting Months Ledger Section */}
            <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">
                            The 12 Accounting Months Ledger
                        </h2>
                        <p className="text-xs text-zinc-500">
                            Comprehensive month-by-month financial ledger with lock controls, revenue/expense breakdowns, and transaction inspection.
                        </p>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Pills */}
                        <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs font-mono">
                            <button
                                onClick={() => setStatusFilter("ALL")}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    statusFilter === "ALL" ? "bg-white text-black shadow-xs" : "text-zinc-500 hover:text-black"
                                }`}
                            >
                                All ({periods.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter("OPEN")}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    statusFilter === "OPEN" ? "bg-white text-emerald-700 shadow-xs" : "text-zinc-500 hover:text-black"
                                }`}
                            >
                                Open ({periods.filter((p: any) => p.status === "OPEN").length})
                            </button>
                            <button
                                onClick={() => setStatusFilter("CLOSED")}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    statusFilter === "CLOSED" ? "bg-white text-zinc-800 shadow-xs" : "text-zinc-500 hover:text-black"
                                }`}
                            >
                                Locked ({periods.filter((p: any) => p.status === "CLOSED").length})
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search month..."
                                value={monthSearch}
                                onChange={(e) => setMonthSearch(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black w-36 sm:w-44"
                            />
                        </div>

                        {/* Sort Order Toggle */}
                        <button
                            onClick={() => setSortOrder(prev => (prev === "ASC" ? "DESC" : "ASC"))}
                            className="px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 font-mono text-[11px] text-zinc-600 font-semibold"
                            title="Toggle Sort Order"
                        >
                            {sortOrder === "ASC" ? "M01 ➔ M12" : "M12 ➔ M01"}
                        </button>
                    </div>
                </div>

                {/* Monthly Cards List */}
                <div className="space-y-3">
                    {filteredPeriods.length === 0 ? (
                        <div className="border border-zinc-200 rounded-xl p-12 text-center bg-white space-y-2">
                            <p className="font-mono text-sm text-zinc-400">No matching accounting months found.</p>
                            <button
                                onClick={() => { setMonthSearch(""); setStatusFilter("ALL"); }}
                                className="text-xs text-black font-mono font-bold underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        filteredPeriods.map((period: any) => {
                            const isExpanded = !!expandedMonths[period.id];
                            const pStart = new Date(period.startDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short" });
                            const pEnd = new Date(period.endDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });

                            return (
                                <div
                                    key={period.id}
                                    className={`border rounded-xl transition-all bg-white shadow-xs ${
                                        period.status === "CLOSED" ? "border-zinc-200" : "border-zinc-300"
                                    }`}
                                >
                                    {/* Main Row Content */}
                                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        {/* Left Identity */}
                                        <div className="flex items-start gap-3.5 min-w-[240px]">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex flex-col items-center justify-center flex-shrink-0 font-mono border border-zinc-200">
                                                <span className="text-[10px] text-zinc-400 uppercase font-bold leading-none">M</span>
                                                <span className="text-xs font-bold text-zinc-800 leading-none mt-0.5">
                                                    {period.monthIndex.toString().padStart(2, "0")}
                                                </span>
                                            </div>

                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-base text-zinc-900">
                                                        {period.periodName}
                                                    </h3>
                                                    <span
                                                        className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                                                            period.status === "OPEN"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                                        }`}
                                                    >
                                                        {period.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-mono text-zinc-500">
                                                    {pStart} — {pEnd}
                                                </p>
                                                {period.closedAt && (
                                                    <p className="text-[11px] text-zinc-400 font-sans">
                                                        Locked by <span className="text-zinc-600 font-medium">{period.closedByName || "Admin"}</span> on{" "}
                                                        {new Date(period.closedAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Financial Metric Columns */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6 flex-1 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                                            {/* Revenue */}
                                            <div>
                                                <span className="font-mono text-[9px] uppercase text-zinc-400 font-bold block">
                                                    Revenue
                                                </span>
                                                <span className="font-mono text-sm font-semibold text-zinc-900 block mt-0.5">
                                                    {currency} {fmt(period.revenue)}
                                                </span>
                                            </div>

                                            {/* Operating Expenses */}
                                            <div>
                                                <span className="font-mono text-[9px] uppercase text-zinc-400 font-bold block">
                                                    Expenses
                                                </span>
                                                <span className="font-mono text-sm font-semibold text-rose-600 block mt-0.5">
                                                    {currency} {fmt(period.expenses)}
                                                </span>
                                            </div>

                                            {/* Net Income */}
                                            <div>
                                                <span className="font-mono text-[9px] uppercase text-zinc-400 font-bold block">
                                                    Net Income
                                                </span>
                                                <span className={`font-mono text-sm font-bold block mt-0.5 ${period.netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                                    {currency} {fmt(period.netProfit)}
                                                </span>
                                                <span className="font-mono text-[9px] text-zinc-400">
                                                    {period.netMargin.toFixed(1)}% margin
                                                </span>
                                            </div>

                                            {/* Ledger Volume & Health */}
                                            <div>
                                                <span className="font-mono text-[9px] uppercase text-zinc-400 font-bold block">
                                                    Transactions
                                                </span>
                                                <span className="font-mono text-xs font-semibold text-zinc-800 block mt-0.5">
                                                    {period.entryCount} entries
                                                </span>
                                                <span className={`font-mono text-[9px] font-bold ${period.isBalanced ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {period.isBalanced ? "✓ Balanced" : "⚠ Imbalance"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Row Actions */}
                                        <div className="flex items-center gap-2 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100 flex-shrink-0">
                                            <button
                                                onClick={() => handleInspectPeriod(period.id)}
                                                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase font-bold px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition-colors"
                                            >
                                                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                                                Inspect
                                            </button>

                                            {period.status === "OPEN" ? (
                                                <button
                                                    onClick={() => setConfirmClosePeriodId(period.id)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1 font-mono text-[11px] uppercase font-bold px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-zinc-200 hover:border-rose-200 transition-all disabled:opacity-50"
                                                >
                                                    <Lock className="w-3 h-3" />
                                                    Lock Month
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleReopenPeriod(period.id)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1 font-mono text-[11px] uppercase font-bold px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700 border border-zinc-200 hover:border-emerald-200 transition-all disabled:opacity-50"
                                                >
                                                    <Unlock className="w-3 h-3" />
                                                    Reopen
                                                </button>
                                            )}

                                            <button
                                                onClick={() => toggleExpandMonth(period.id)}
                                                className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors"
                                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expandable Deep Dive Insights Panel */}
                                    {isExpanded && (
                                        <div className="bg-zinc-50/80 border-t border-zinc-100 p-4 sm:p-5 rounded-b-xl space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Top Revenue in Month */}
                                                <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-2">
                                                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">
                                                        Top Revenue Contributors
                                                    </span>
                                                    {period.topRevenue.length === 0 ? (
                                                        <p className="text-xs text-zinc-400 italic">No revenue accounts posted this month.</p>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            {period.topRevenue.map((r: any) => (
                                                                <div key={r.code} className="flex justify-between items-center text-xs">
                                                                    <span className="text-zinc-700 truncate mr-2">{r.code} · {r.name}</span>
                                                                    <span className="font-mono font-semibold text-emerald-700 flex-shrink-0">
                                                                        {fmt(r.amount)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Top Expenses in Month */}
                                                <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-2">
                                                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">
                                                        Major Expense Items
                                                    </span>
                                                    {period.topExpenses.length === 0 ? (
                                                        <p className="text-xs text-zinc-400 italic">No expenses posted this month.</p>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            {period.topExpenses.map((e: any) => (
                                                                <div key={e.code} className="flex justify-between items-center text-xs">
                                                                    <span className="text-zinc-700 truncate mr-2">{e.code} · {e.name}</span>
                                                                    <span className="font-mono font-semibold text-rose-600 flex-shrink-0">
                                                                        {fmt(e.amount)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Transaction Source Breakdown */}
                                                <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-2">
                                                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">
                                                        Source Activity Distribution
                                                    </span>
                                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">
                                                            <span className="text-[10px] text-zinc-400 block uppercase">Billing/Sales</span>
                                                            <span className="font-bold text-zinc-800">{period.sourceCounts.document} docs</span>
                                                        </div>
                                                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">
                                                            <span className="text-[10px] text-zinc-400 block uppercase">Expenses</span>
                                                            <span className="font-bold text-zinc-800">{period.sourceCounts.expense} entries</span>
                                                        </div>
                                                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">
                                                            <span className="text-[10px] text-zinc-400 block uppercase">Payroll</span>
                                                            <span className="font-bold text-zinc-800">{period.sourceCounts.payroll} runs</span>
                                                        </div>
                                                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">
                                                            <span className="text-[10px] text-zinc-400 block uppercase">Manual Journals</span>
                                                            <span className="font-bold text-zinc-800">{period.sourceCounts.manual} entries</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Shortcut Actions */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                                                <div className="text-zinc-500 font-mono">
                                                    Debits: <strong className="text-zinc-800">{fmt(period.totalDebits)}</strong> • Credits: <strong className="text-zinc-800">{fmt(period.totalCredits)}</strong>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/workspaces/${shopSlug}/finance/reports/pl`}
                                                        className="font-mono font-semibold text-zinc-700 hover:text-black underline flex items-center gap-1"
                                                    >
                                                        Financial Reports ➔
                                                    </Link>
                                                    <button
                                                        onClick={() => handleInspectPeriod(period.id)}
                                                        className="font-mono font-bold text-black underline flex items-center gap-1"
                                                    >
                                                        Open Full {period.periodName} Ledger ➔
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Confirmation Dialog: Lock Single Period */}
            {confirmClosePeriodId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <div className="flex items-center gap-3 text-rose-600">
                            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900">Lock Accounting Month</h3>
                        </div>

                        <p className="text-sm text-zinc-600 leading-relaxed">
                            Locking this period will prevent accidental backdating or edits to transactions dated in this month. An immutable month-end audit snapshot will be recorded.
                        </p>

                        <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs text-zinc-600 space-y-1">
                            <p>✓ Financial totals are verified and balanced.</p>
                            <p>✓ Only Workspace Admins can reopen a locked period.</p>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setConfirmClosePeriodId(null)}
                                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-mono text-xs uppercase font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleClosePeriod(confirmClosePeriodId)}
                                disabled={isPending}
                                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-mono text-xs uppercase font-bold disabled:opacity-50"
                            >
                                {isPending ? "Locking..." : "Confirm & Lock"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Year-End Close & Rollover Engine */}
            {showCloseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
                        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-zinc-700" />
                                    Close Fiscal Year: {fiscalYear.label}
                                </h3>
                                <p className="text-xs text-zinc-500 font-mono">
                                    Pre-Close Compliance & Audit Verification
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="text-zinc-400 hover:text-black p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Audit Checklist */}
                        <div className="space-y-3">
                            <h4 className="font-mono text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                                Required Closing Conditions
                            </h4>

                            <div className="space-y-2">
                                {/* Condition 1: All Periods Closed */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                                    closingChecklist.allPeriodsClosed
                                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                        : "bg-rose-50/60 border-rose-200 text-rose-900"
                                }`}>
                                    {closingChecklist.allPeriodsClosed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                        <span className="font-semibold block">All 12 Accounting Periods Closed</span>
                                        <span className="text-[11px] opacity-80 block mt-0.5">
                                            {closingChecklist.allPeriodsClosed
                                                ? "All monthly periods have been audited and locked."
                                                : `${closingChecklist.unclosedCount} period(s) remain open: ${closingChecklist.unclosedPeriodNames.slice(0, 3).join(", ")}${closingChecklist.unclosedPeriodNames.length > 3 ? "..." : ""}. Please lock all periods before closing the year.`}
                                        </span>
                                    </div>
                                </div>

                                {/* Condition 2: General Ledger Balance */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                                    closingChecklist.isBalanced
                                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                        : "bg-rose-50/60 border-rose-200 text-rose-900"
                                }`}>
                                    {closingChecklist.isBalanced ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                        <span className="font-semibold block">Double-Entry Ledger Integrity</span>
                                        <span className="text-[11px] opacity-80 block mt-0.5">
                                            {closingChecklist.isBalanced
                                                ? "Total debits match total credits with zero variance."
                                                : "A ledger imbalance was detected across periods."}
                                        </span>
                                    </div>
                                </div>

                                {/* Condition 3: Retained Earnings Account */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                                    closingChecklist.retainedEarningsAccount
                                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                        : "bg-rose-50/60 border-rose-200 text-rose-900"
                                }`}>
                                    {closingChecklist.retainedEarningsAccount ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                        <span className="font-semibold block">Retained Earnings Account Configured</span>
                                        <span className="text-[11px] opacity-80 block mt-0.5">
                                            {closingChecklist.retainedEarningsAccount
                                                ? `Account ${closingChecklist.retainedEarningsAccount.code} (${closingChecklist.retainedEarningsAccount.name}) is ready for net income rollover.`
                                                : "Account 3300 (Retained Earnings) or 3100 (Owner's Equity) not found."}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-600 space-y-1">
                            <span className="font-bold text-zinc-800 block">Automated Accounting Rollover:</span>
                            <p>
                                Upon confirmation, MannaBooks will automatically generate formal year-end closing entries that zero out all Revenue (4xxx) and Expense (5xxx) balances into <strong>Retained Earnings ({closingChecklist.retainedEarningsAccount?.code || "3300"})</strong>.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-mono text-xs uppercase font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCloseFiscalYear}
                                disabled={isPending || !closingChecklist.canCloseYear}
                                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-zinc-800 font-mono text-xs uppercase font-bold disabled:opacity-40 transition-all shadow-sm"
                            >
                                {isPending ? "Executing Closure..." : "Execute Year-End Close"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Reopen Fiscal Year */}
            {showReopenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <div className="flex items-center gap-3 text-amber-600">
                            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                                <Unlock className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900">Reopen Fiscal Year</h3>
                        </div>

                        <p className="text-sm text-zinc-600 leading-relaxed">
                            Reopening <strong>{fiscalYear.label}</strong> will reverse the automated year-end closing entries and restore all revenue and expense accounts to their pre-closing states.
                        </p>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                            <p>⚠ Only one fiscal year can be active at a time.</p>
                            <p>✓ Monthly periods can then be reopened individually for adjustments.</p>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setShowReopenModal(false)}
                                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-mono text-xs uppercase font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReopenFiscalYear}
                                disabled={isPending}
                                className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 font-mono text-xs uppercase font-bold disabled:opacity-50"
                            >
                                {isPending ? "Reopening..." : "Confirm & Reopen Year"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Slide-Out Journal Entry Inspection Modal */}
            {inspectPeriodId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white border border-zinc-200 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[92vh]">
                        {loadingDetails ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <Spinner className="w-6 h-6 text-black" />
                                <p className="font-mono text-xs text-zinc-500 uppercase font-bold">
                                    Loading Journal Ledger...
                                </p>
                            </div>
                        ) : periodDetails ? (
                            <>
                                <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold text-zinc-900">
                                                {periodDetails.period.periodName}
                                            </h2>
                                            <span
                                                className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                                                    periodDetails.period.status === "OPEN"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                                }`}
                                            >
                                                {periodDetails.period.status}
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono text-zinc-400">
                                            {periodDetails.period.startDate} ➔ {periodDetails.period.endDate} • {periodDetails.kpis.entryCount} entries
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setInspectPeriodId(null)}
                                        className="text-zinc-400 hover:text-black p-1 font-mono text-xs font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Month Financial KPIs Summary */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-bold block">Monthly Revenue</span>
                                        <span className="font-mono text-sm font-bold text-zinc-900 mt-1 block">
                                            {currency} {fmt(periodDetails.kpis.totalRevenue)}
                                        </span>
                                    </div>
                                    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-bold block">Operating Expenses</span>
                                        <span className="font-mono text-sm font-bold text-rose-600 mt-1 block">
                                            {currency} {fmt(periodDetails.kpis.totalExpenses)}
                                        </span>
                                    </div>
                                    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-bold block">Net Contribution</span>
                                        <span className={`font-mono text-sm font-bold mt-1 block ${periodDetails.kpis.netIncome >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                            {currency} {fmt(periodDetails.kpis.netIncome)}
                                        </span>
                                    </div>
                                    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-bold block">Ledger Integrity</span>
                                        <span className="font-mono text-xs font-bold text-emerald-800 mt-1 block">
                                            {periodDetails.kpis.isBalanced ? "✓ Balanced (0.00 Diff)" : "⚠ Imbalanced"}
                                        </span>
                                        <span className="font-mono text-[9px] text-zinc-400">
                                            Debits = Credits = {currency} {fmt(periodDetails.kpis.totalDebits)}
                                        </span>
                                    </div>
                                </div>

                                {/* Journal Entries Table Stream */}
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <h3 className="font-mono text-xs uppercase font-bold text-zinc-700">
                                            Journal Entries Stream ({filteredDrawerEntries.length})
                                        </h3>
                                        <div className="relative w-full sm:w-64">
                                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                type="text"
                                                placeholder="Filter description, account..."
                                                value={entrySearch}
                                                onChange={(e) => setEntrySearch(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
                                            />
                                        </div>
                                    </div>

                                    {filteredDrawerEntries.length === 0 ? (
                                        <div className="border border-zinc-200 rounded-xl p-8 text-center text-zinc-400 text-xs font-mono">
                                            No journal entries found matching criteria.
                                        </div>
                                    ) : (
                                        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                                            <div className="overflow-x-auto max-h-[380px]">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-zinc-50 border-b border-zinc-100 font-mono text-[10px] uppercase text-zinc-400 sticky top-0">
                                                        <tr>
                                                            <th className="px-3 py-2.5 font-bold">Date</th>
                                                            <th className="px-3 py-2.5 font-bold">Description</th>
                                                            <th className="px-3 py-2.5 font-bold">Debit Account</th>
                                                            <th className="px-3 py-2.5 font-bold">Credit Account</th>
                                                            <th className="px-3 py-2.5 font-bold text-right">Amount ({currency})</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100 font-sans">
                                                        {filteredDrawerEntries.map((e: any) => (
                                                            <tr key={e.id} className="hover:bg-zinc-50/70 transition-colors">
                                                                <td className="px-3 py-2.5 font-mono text-zinc-500 whitespace-nowrap text-[11px]">
                                                                    {e.entryDate}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-zinc-900 font-medium max-w-[200px] truncate" title={e.description}>
                                                                    {e.description}
                                                                </td>
                                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                                    <span className="font-mono text-zinc-500 text-[10px] mr-1">
                                                                        {e.debitAccountCode}
                                                                    </span>
                                                                    <span className="text-zinc-800">{e.debitAccountName}</span>
                                                                </td>
                                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                                    <span className="font-mono text-zinc-500 text-[10px] mr-1">
                                                                        {e.creditAccountCode}
                                                                    </span>
                                                                    <span className="text-zinc-800">{e.creditAccountName}</span>
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-zinc-900 whitespace-nowrap">
                                                                    {fmt(e.amount)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2 border-t border-zinc-100">
                                    <button
                                        onClick={() => setInspectPeriodId(null)}
                                        className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono text-xs uppercase font-bold"
                                    >
                                        Close Drawer
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
