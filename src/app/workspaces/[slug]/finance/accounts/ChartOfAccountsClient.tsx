"use client";

import { useState, useTransition } from "react";
import { activateGeneralLedger, createAccount, deleteAccount, disableGlOnboardingMode } from "@/lib/actions/gl";
import { runGlMigration } from "@/lib/actions/gl-migration";

type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

interface Account {
    id: string;
    code: string;
    name: string;
    accountType: AccountType;
    isSystem: boolean;
    parentCode: string | null;
}

interface Props {
    shopId: string;
    shopSlug: string;
    isGlEnabled: boolean;
    glOnboardingMode: boolean;
    accounts: Account[];
}

const TYPE_COLORS: Record<AccountType, string> = {
    ASSET: "bg-blue-50 text-blue-700 border-blue-200",
    LIABILITY: "bg-rose-50 text-rose-700 border-rose-200",
    EQUITY: "bg-purple-50 text-purple-700 border-purple-200",
    REVENUE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    EXPENSE: "bg-amber-50 text-amber-700 border-amber-200",
};

const TYPE_GROUPS: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

export default function ChartOfAccountsClient({ shopId, shopSlug, isGlEnabled, glOnboardingMode, accounts: initialAccounts }: Props) {
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [isPending, startTransition] = useTransition();
    const [showAddForm, setShowAddForm] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [migrationResult, setMigrationResult] = useState<string | null>(null);
    const [newAccount, setNewAccount] = useState({ code: "", name: "", accountType: "ASSET" as AccountType, parentCode: "" });

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    }

    function handleActivate() {
        startTransition(async () => {
            const res = await activateGeneralLedger(shopId, shopSlug);
            if (res.success) {
                showMsg("success", "General Ledger activated! Chart of Accounts seeded. Page will refresh.");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showMsg("error", res.error);
            }
        });
    }

    function handleAddAccount() {
        if (!newAccount.code || !newAccount.name) return;
        startTransition(async () => {
            const res = await createAccount(shopId, shopSlug, {
                code: newAccount.code,
                name: newAccount.name,
                accountType: newAccount.accountType,
                parentCode: newAccount.parentCode || undefined,
            });
            if (res.success && res.account) {
                setAccounts(prev => [...prev, { ...res.account!, accountType: res.account!.accountType as AccountType }].sort((a, b) => a.code.localeCompare(b.code)));
                setNewAccount({ code: "", name: "", accountType: "ASSET", parentCode: "" });
                setShowAddForm(false);
                showMsg("success", `Account ${res.account.code} created.`);
            } else {
                showMsg("error", (res as any).error || "Failed to create account.");
            }
        });
    }

    function handleDelete(accountId: string) {
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
            } else {
                showMsg("error", res.error!);
            }
        });
    }

    function handleDisableOnboarding() {
        startTransition(async () => {
            const res = await disableGlOnboardingMode(shopId, shopSlug);
            if (res.success) {
                showMsg("success", "Onboarding mode disabled. Period rules are now enforced.");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showMsg("error", res.error);
            }
        });
    }

    // GL not activated yet
    if (!isGlEnabled) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center text-3xl">📒</div>
                <div>
                    <h2 className="text-2xl font-bold text-black font-sans">Activate General Ledger</h2>
                    <p className="text-zinc-500 mt-2 max-w-md text-sm">
                        Enable the double-entry GL to unlock formal financial reports, trial balance, and accounting period controls.
                        A standard Chart of Accounts will be seeded automatically.
                    </p>
                </div>
                <button onClick={handleActivate} disabled={isPending}
                    className="bg-black text-white px-8 py-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50">
                    {isPending ? "Activating..." : "Activate General Ledger"}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Notification */}
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Onboarding Mode Banner */}
            {glOnboardingMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <p className="font-mono text-xs font-bold text-amber-700 uppercase">⚠ GL Onboarding Mode Active</p>
                        <p className="text-amber-700 text-sm mt-0.5">Backdating is allowed to all periods. Run the historical data migration below, then disable onboarding mode.</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={handleMigration} disabled={isPending}
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold hover:bg-amber-700 transition-colors disabled:opacity-50">
                            {isPending ? "Running..." : "Run Migration"}
                        </button>
                        <button onClick={handleDisableOnboarding} disabled={isPending}
                            className="bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold hover:bg-amber-50 transition-colors disabled:opacity-50">
                            Disable Onboarding
                        </button>
                    </div>
                </div>
            )}

            {/* Migration Result */}
            {migrationResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="font-mono text-xs font-bold text-emerald-700 uppercase mb-1">Migration Complete</p>
                    <p className="text-emerald-800 text-sm">{migrationResult}</p>
                </div>
            )}

            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-zinc-500">{accounts.length} accounts in your chart</p>
                <button onClick={() => setShowAddForm(v => !v)}
                    className="bg-black text-white px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider font-bold hover:bg-zinc-800 transition-colors">
                    + Add Account
                </button>
            </div>

            {/* Add Account Form */}
            {showAddForm && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-mono text-xs text-zinc-500 uppercase font-semibold">New Account</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input value={newAccount.code} onChange={e => setNewAccount(p => ({ ...p, code: e.target.value }))}
                            placeholder="Code e.g. 6700"
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                        <input value={newAccount.name} onChange={e => setNewAccount(p => ({ ...p, name: e.target.value }))}
                            placeholder="Name e.g. Depreciation"
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white col-span-2" />
                        <select value={newAccount.accountType} onChange={e => setNewAccount(p => ({ ...p, accountType: e.target.value as AccountType }))}
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white">
                            {TYPE_GROUPS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAddAccount} disabled={isPending || !newAccount.code || !newAccount.name}
                            className="bg-black text-white px-5 py-2 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50">
                            {isPending ? "Saving..." : "Save Account"}
                        </button>
                        <button onClick={() => setShowAddForm(false)} className="text-sm text-zinc-500 hover:text-black px-4">Cancel</button>
                    </div>
                </div>
            )}

            {/* Account Groups */}
            {TYPE_GROUPS.map(type => {
                const group = accounts.filter(a => a.accountType === type);
                if (group.length === 0) return null;
                return (
                    <div key={type} className="border border-zinc-200 rounded-xl overflow-hidden">
                        <div className={`px-4 py-2.5 border-b border-zinc-100 flex items-center gap-2 ${TYPE_COLORS[type]}`}>
                            <span className={`font-mono text-xs font-bold uppercase border px-2 py-0.5 rounded-full ${TYPE_COLORS[type]}`}>{type}</span>
                            <span className="text-xs font-medium">{group.length} accounts</span>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {group.map(account => (
                                <div key={account.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <span className="font-mono text-sm font-bold text-zinc-400 w-12 flex-shrink-0">{account.code}</span>
                                        <span className="text-sm font-medium text-black truncate">{account.name}</span>
                                        {account.isSystem && (
                                            <span className="flex-shrink-0 font-mono text-[9px] uppercase border border-zinc-300 text-zinc-400 px-1.5 py-0.5 rounded-full">System</span>
                                        )}
                                    </div>
                                    {!account.isSystem && (
                                        <button onClick={() => handleDelete(account.id)} disabled={isPending}
                                            className="text-xs text-rose-500 hover:text-rose-700 font-mono uppercase flex-shrink-0 disabled:opacity-40">
                                            Delete
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
