"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { activateGeneralLedger, createAccount, deleteAccount, disableGlOnboardingMode } from "@/lib/actions/gl";
import { runGlMigration } from "@/lib/actions/gl-migration";
import { 
    Scale, 
    ArrowUpRight, 
    Search, 
    Plus, 
    CheckCircle2, 
    AlertTriangle, 
    Layers, 
    BookMarked, 
    Trash2,
    TrendingUp,
    TrendingDown,
    Building2,
    DollarSign,
    RefreshCw
} from "lucide-react";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface DetailedAccount {
    id: string;
    code: string;
    name: string;
    accountType: AccountType;
    isSystem: boolean;
    parentCode: string | null;
    debits: number;
    credits: number;
    netBalance: number;
    entriesCount: number;
}

export interface Summary {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
}

interface Props {
    shopId: string;
    shopSlug: string;
    currency?: string;
    isGlEnabled: boolean;
    glOnboardingMode: boolean;
    summary: Summary;
    accounts: DetailedAccount[];
}

const TYPE_CONFIG: Record<AccountType, { 
    label: string; 
    color: string; 
    border: string; 
    badge: string; 
    normalBalance: "Debit" | "Credit";
    icon: React.ElementType;
    description: string;
}> = {
    ASSET: {
        label: "Assets",
        color: "text-blue-700 bg-blue-50",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-800 border-blue-200",
        normalBalance: "Debit",
        icon: Building2,
        description: "Cash, bank, accounts receivable, equipment, inventory",
    },
    LIABILITY: {
        label: "Liabilities",
        color: "text-rose-700 bg-rose-50",
        border: "border-rose-200",
        badge: "bg-rose-100 text-rose-800 border-rose-200",
        normalBalance: "Credit",
        icon: AlertTriangle,
        description: "Accounts payable, vendor bills, tax & payroll obligations",
    },
    EQUITY: {
        label: "Equity",
        color: "text-purple-700 bg-purple-50",
        border: "border-purple-200",
        badge: "bg-purple-100 text-purple-800 border-purple-200",
        normalBalance: "Credit",
        icon: Scale,
        description: "Owner's capital, retained earnings, opening balances",
    },
    REVENUE: {
        label: "Revenue",
        color: "text-emerald-700 bg-emerald-50",
        border: "border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        normalBalance: "Credit",
        icon: TrendingUp,
        description: "Sales revenue, invoice settlements, other operating income",
    },
    EXPENSE: {
        label: "Expenses & COGS",
        color: "text-amber-700 bg-amber-50",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        normalBalance: "Debit",
        icon: TrendingDown,
        description: "Direct cost of goods/services, rent, salaries, utilities",
    },
};

const TYPE_GROUPS: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

export default function ChartOfAccountsClient({
    shopId,
    shopSlug,
    currency = "KES",
    isGlEnabled,
    glOnboardingMode,
    summary,
    accounts: initialAccounts,
}: Props) {
    const [accounts, setAccounts] = useState<DetailedAccount[]>(initialAccounts);
    const [isPending, startTransition] = useTransition();
    const [showAddForm, setShowAddForm] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [migrationResult, setMigrationResult] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<AccountType | "ALL">("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [onlyWithActivity, setOnlyWithActivity] = useState(false);

    const [newAccount, setNewAccount] = useState({
        code: "",
        name: "",
        accountType: "ASSET" as AccountType,
        parentCode: "",
    });

    function fmt(val: number) {
        return `${currency} ${val.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    }

    function handleActivate() {
        startTransition(async () => {
            const res = await activateGeneralLedger(shopId, shopSlug);
            if (res.success) {
                showMsg("success", "General Ledger activated! Chart of Accounts seeded. Refreshing...");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showMsg("error", res.error);
            }
        });
    }

    function handleAddAccount() {
        if (!newAccount.code.trim() || !newAccount.name.trim()) return;
        startTransition(async () => {
            const res = await createAccount(shopId, shopSlug, {
                code: newAccount.code.trim(),
                name: newAccount.name.trim(),
                accountType: newAccount.accountType,
                parentCode: newAccount.parentCode.trim() || undefined,
            });
            if (res.success && res.account) {
                const added: DetailedAccount = {
                    id: res.account.id,
                    code: res.account.code,
                    name: res.account.name,
                    accountType: res.account.accountType as AccountType,
                    isSystem: res.account.isSystem,
                    parentCode: res.account.parentCode,
                    debits: 0,
                    credits: 0,
                    netBalance: 0,
                    entriesCount: 0,
                };
                setAccounts(prev => [...prev, added].sort((a, b) => a.code.localeCompare(b.code)));
                setNewAccount({ code: "", name: "", accountType: "ASSET", parentCode: "" });
                setShowAddForm(false);
                showMsg("success", `Account ${res.account.code} — ${res.account.name} created successfully.`);
            } else {
                showMsg("error", (res as any).error || "Failed to create account.");
            }
        });
    }

    function handleDelete(accountId: string) {
        const acc = accounts.find(a => a.id === accountId);
        if (!confirm(`Are you sure you want to delete account "${acc?.code} — ${acc?.name}"?`)) return;

        startTransition(async () => {
            const res = await deleteAccount(shopId, shopSlug, accountId);
            if (res.success) {
                setAccounts(prev => prev.filter(a => a.id !== accountId));
                showMsg("success", "Account deleted.");
            } else {
                showMsg("error", res.error);
            }
        });
    }

    function handleMigration() {
        startTransition(async () => {
            setMigrationResult(null);
            const res = await runGlMigration(shopId, shopSlug);
            if (res.success) {
                setMigrationResult(res.summary!);
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showMsg("error", res.error!);
            }
        });
    }

    function handleDisableOnboarding() {
        startTransition(async () => {
            const res = await disableGlOnboardingMode(shopId, shopSlug);
            if (res.success) {
                showMsg("success", "Onboarding mode disabled. Accounting period lock rules are now enforced.");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showMsg("error", res.error);
            }
        });
    }

    // Filtered accounts
    const filteredAccounts = useMemo(() => {
        return accounts.filter(acc => {
            if (selectedType !== "ALL" && acc.accountType !== selectedType) return false;
            if (onlyWithActivity && acc.entriesCount === 0) return false;
            if (searchTerm.trim()) {
                const q = searchTerm.trim().toLowerCase();
                return (
                    acc.code.toLowerCase().includes(q) ||
                    acc.name.toLowerCase().includes(q) ||
                    (acc.parentCode && acc.parentCode.toLowerCase().includes(q))
                );
            }
            return true;
        });
    }, [accounts, selectedType, onlyWithActivity, searchTerm]);

    const activeAccountsCount = useMemo(() => {
        return accounts.filter(a => a.entriesCount > 0).length;
    }, [accounts]);

    // GL not activated yet
    if (!isGlEnabled) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-xl mx-auto space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg">
                    <Layers className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Activate General Ledger</h2>
                    <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
                        Enable double-entry bookkeeping to seed a standard 5-class Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses),
                        unlock real-time trial balances, and automated ledger postings.
                    </p>
                </div>
                <button
                    onClick={handleActivate}
                    disabled={isPending}
                    className="bg-black text-white px-8 py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-bold hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                    {isPending ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Activating Ledger...</span>
                        </>
                    ) : (
                        <span>Activate General Ledger</span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Notification */}
            {message && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium border shadow-xs ${
                    message.type === "success" 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                        : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                    {message.text}
                </div>
            )}

            {/* Onboarding Mode Banner */}
            {glOnboardingMode && (
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-mono text-xs font-bold text-amber-900 uppercase tracking-wider">
                                GL Onboarding Mode Active
                            </p>
                            <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                                Backdating is relaxed for setting up historical balances. You can import past transactions into the double-entry ledger, then lock periods when finished.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        <button
                            onClick={handleMigration}
                            disabled={isPending}
                            className="flex-1 sm:flex-initial bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg font-mono text-xs uppercase font-bold transition-all shadow-xs disabled:opacity-50"
                        >
                            {isPending ? "Migrating..." : "Run Migration"}
                        </button>
                        <button
                            onClick={handleDisableOnboarding}
                            disabled={isPending}
                            className="flex-1 sm:flex-initial bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 px-3.5 py-2 rounded-lg font-mono text-xs uppercase font-bold transition-all disabled:opacity-50"
                        >
                            Lock & Enforce
                        </button>
                    </div>
                </div>
            )}

            {/* Migration Result Banner */}
            {migrationResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="font-mono text-xs font-bold text-emerald-800 uppercase mb-1">Historical Migration Complete</p>
                    <p className="text-emerald-900 text-xs leading-relaxed">{migrationResult}</p>
                </div>
            )}

            {/* TOP 5 KPI SUMMARY CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. ASSETS */}
                <div className="p-4 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 to-white shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-700">Assets</span>
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="font-mono text-base sm:text-lg font-bold text-zinc-900 truncate">
                        {fmt(summary.totalAssets)}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-sans truncate">Dr Normal · Cash & Receivables</p>
                </div>

                {/* 2. LIABILITIES */}
                <div className="p-4 rounded-xl border border-rose-200/80 bg-gradient-to-br from-rose-50/50 to-white shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-700">Liabilities</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <p className="font-mono text-base sm:text-lg font-bold text-zinc-900 truncate">
                        {fmt(summary.totalLiabilities)}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-sans truncate">Cr Normal · Payables & Taxes</p>
                </div>

                {/* 3. EQUITY */}
                <div className="p-4 rounded-xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 to-white shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-700">Equity</span>
                        <Scale className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <p className="font-mono text-base sm:text-lg font-bold text-zinc-900 truncate">
                        {fmt(summary.totalEquity)}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-sans truncate">Cr Normal · Capital & Earnings</p>
                </div>

                {/* 4. REVENUE */}
                <div className="p-4 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">Revenue</span>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="font-mono text-base sm:text-lg font-bold text-zinc-900 truncate">
                        {fmt(summary.totalRevenue)}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-sans truncate">Cr Normal · Sales & Income</p>
                </div>

                {/* 5. EXPENSES */}
                <div className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white shadow-2xs space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">Expenses & COGS</span>
                        <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <p className="font-mono text-base sm:text-lg font-bold text-zinc-900 truncate">
                        {fmt(summary.totalExpenses)}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-sans truncate">Dr Normal · Direct Costs & Ops</p>
                </div>
            </div>

            {/* LEDGER HEALTH STATUS BAR */}
            <div className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                    {summary.isBalanced ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-zinc-700 font-medium">
                                Ledger Equation Balanced: Total Debits <strong className="font-mono text-zinc-900">{fmt(summary.totalDebits)}</strong> = Total Credits <strong className="font-mono text-zinc-900">{fmt(summary.totalCredits)}</strong>
                            </span>
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span className="text-rose-700 font-medium font-mono">
                                Ledger Imbalance Detected: Debits {fmt(summary.totalDebits)} vs Credits {fmt(summary.totalCredits)}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3 text-zinc-500 font-mono text-[11px]">
                    <span>{accounts.length} total accounts</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-bold">{activeAccountsCount} active with entries</span>
                </div>
            </div>

            {/* CONTROLS: TYPE FILTER TABS, SEARCH, AND ACTIONS */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                {/* Category filter tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                    <button
                        type="button"
                        onClick={() => setSelectedType("ALL")}
                        className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                            selectedType === "ALL"
                                ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200"
                                : "text-zinc-600 hover:text-zinc-900"
                        }`}
                    >
                        All ({accounts.length})
                    </button>
                    {TYPE_GROUPS.map(type => {
                        const count = accounts.filter(a => a.accountType === type).length;
                        const isSelected = selectedType === type;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setSelectedType(type)}
                                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    isSelected
                                        ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200"
                                        : "text-zinc-600 hover:text-zinc-900"
                                }`}
                            >
                                <span>{TYPE_CONFIG[type].label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-zinc-100 text-zinc-800" : "text-zinc-400"}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Filter by code or name..."
                            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setOnlyWithActivity(v => !v)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase font-bold border transition-colors ${
                            onlyWithActivity ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                        }`}
                        title="Show only accounts that have journal entries"
                    >
                        Active Only
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowAddForm(v => !v)}
                        className="bg-black text-white hover:bg-zinc-800 px-3.5 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Account</span>
                    </button>
                </div>
            </div>

            {/* ADD ACCOUNT FORM */}
            {showAddForm && (
                <div className="bg-zinc-50 border border-zinc-300 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                        <div>
                            <h3 className="font-mono text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                Create New Account in Chart
                            </h3>
                            <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                                Add a specialized sub-account or overhead category into your double-entry ledger.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="text-zinc-400 hover:text-zinc-700 text-xs"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                                Account Code *
                            </label>
                            <input
                                value={newAccount.code}
                                onChange={e => setNewAccount(p => ({ ...p, code: e.target.value }))}
                                placeholder="e.g. 6750"
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono"
                            />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                                Account Type *
                            </label>
                            <select
                                value={newAccount.accountType}
                                onChange={e => setNewAccount(p => ({ ...p, accountType: e.target.value as AccountType }))}
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white"
                            >
                                {TYPE_GROUPS.map(t => (
                                    <option key={t} value={t}>{t} ({TYPE_CONFIG[t].label})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                                Account Name *
                            </label>
                            <input
                                value={newAccount.name}
                                onChange={e => setNewAccount(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Internet & SaaS Subscriptions"
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white"
                            />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                                Parent Code (Optional)
                            </label>
                            <input
                                value={newAccount.parentCode}
                                onChange={e => setNewAccount(p => ({ ...p, parentCode: e.target.value }))}
                                placeholder="e.g. 6200"
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="text-xs text-zinc-500 hover:text-black px-4 py-2 font-mono"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAddAccount}
                            disabled={isPending || !newAccount.code.trim() || !newAccount.name.trim()}
                            className="bg-black text-white px-5 py-2 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            {isPending ? "Creating..." : "Save Account"}
                        </button>
                    </div>
                </div>
            )}

            {/* DETAILED ACCOUNT GROUPS LISTING */}
            {TYPE_GROUPS.map(type => {
                const config = TYPE_CONFIG[type];
                const groupAccounts = filteredAccounts.filter(a => a.accountType === type);
                if (groupAccounts.length === 0) return null;

                const groupNetTotal = groupAccounts.reduce((sum, a) => sum + a.netBalance, 0);
                const groupDebits = groupAccounts.reduce((sum, a) => sum + a.debits, 0);
                const groupCredits = groupAccounts.reduce((sum, a) => sum + a.credits, 0);

                return (
                    <div key={type} className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        {/* Group Header Card */}
                        <div className={`px-4 sm:px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${config.color} ${config.border}`}>
                            <div className="flex items-center gap-2.5">
                                <span className={`font-mono text-xs font-bold uppercase border px-2.5 py-0.5 rounded-full ${config.badge}`}>
                                    {type}
                                </span>
                                <span className="font-semibold text-sm text-zinc-900">{config.label}</span>
                                <span className="text-xs text-zinc-500 font-mono">({groupAccounts.length} accounts)</span>
                                <span className="hidden md:inline text-[11px] text-zinc-500 font-sans">
                                    · Normal: <strong>{config.normalBalance}</strong> ({config.description})
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="text-zinc-500 hidden sm:inline">
                                    Dr: {fmt(groupDebits)} · Cr: {fmt(groupCredits)}
                                </span>
                                <div className="bg-white/80 border border-zinc-200/80 px-3 py-1 rounded-lg">
                                    <span className="text-zinc-400 text-[10px] uppercase mr-1.5">Net {config.label}:</span>
                                    <strong className="text-zinc-900 font-bold">{fmt(groupNetTotal)}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Accounts Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-zinc-50/75 border-b border-zinc-200 font-mono text-[10px] uppercase text-zinc-500 font-semibold">
                                    <tr>
                                        <th className="py-2.5 px-4 w-28">Code</th>
                                        <th className="py-2.5 px-4 min-w-[220px]">Account Name</th>
                                        <th className="py-2.5 px-4 w-24 text-center">Activity</th>
                                        <th className="py-2.5 px-4 w-32 text-right">Debits</th>
                                        <th className="py-2.5 px-4 w-32 text-right">Credits</th>
                                        <th className="py-2.5 px-4 w-36 text-right font-bold text-zinc-700">Net Balance</th>
                                        <th className="py-2.5 px-4 w-36 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-sans">
                                    {groupAccounts.map(account => {
                                        const hasActivity = account.entriesCount > 0;
                                        return (
                                            <tr key={account.id} className="hover:bg-zinc-50/60 transition-colors">
                                                {/* Code */}
                                                <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{account.code}</span>
                                                        {account.parentCode && (
                                                            <span className="text-[9px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded">
                                                                ↳ {account.parentCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Name + System Badge */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-zinc-900">{account.name}</span>
                                                        {account.isSystem && (
                                                            <span className="font-mono text-[9px] uppercase border border-zinc-200 text-zinc-400 bg-zinc-50 px-1.5 py-0.2 rounded-full font-bold">
                                                                System
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Activity */}
                                                <td className="py-3 px-4 text-center">
                                                    {hasActivity ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {account.entriesCount} {account.entriesCount === 1 ? "entry" : "entries"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-300 font-mono text-[10px]">0</span>
                                                    )}
                                                </td>

                                                {/* Total Debits */}
                                                <td className="py-3 px-4 text-right font-mono text-zinc-600">
                                                    {account.debits > 0 ? fmt(account.debits) : "—"}
                                                </td>

                                                {/* Total Credits */}
                                                <td className="py-3 px-4 text-right font-mono text-zinc-600">
                                                    {account.credits > 0 ? fmt(account.credits) : "—"}
                                                </td>

                                                {/* Net Balance */}
                                                <td className="py-3 px-4 text-right font-mono font-bold">
                                                    <span className={account.netBalance !== 0 ? "text-zinc-900" : "text-zinc-300"}>
                                                        {fmt(account.netBalance)}
                                                    </span>
                                                </td>

                                                {/* Drilldown / Actions */}
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/workspaces/${shopSlug}/finance/ledger?search=${account.code}`}
                                                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2 py-1 rounded-md transition-colors"
                                                            title={`View Journal Entries for account ${account.code}`}
                                                        >
                                                            <span>Ledger</span>
                                                            <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                                                        </Link>

                                                        {!account.isSystem && account.entriesCount === 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(account.id)}
                                                                disabled={isPending}
                                                                className="text-zinc-400 hover:text-rose-600 p-1 transition-colors disabled:opacity-40"
                                                                title="Delete custom account"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            {filteredAccounts.length === 0 && (
                <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 space-y-2">
                    <p className="text-sm font-semibold text-zinc-700">No accounts match your current filter</p>
                    <p className="text-xs text-zinc-400">Try changing your search term or category filter tab.</p>
                </div>
            )}
        </div>
    );
}
