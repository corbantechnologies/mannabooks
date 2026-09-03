"use client";

import { useState, useTransition } from "react";
import { updateTaxSettings } from "@/lib/actions/tax";
import { declareFiscalYear, closeFiscalYear, deleteFiscalYear } from "@/lib/actions/fiscal-years";
import { toast } from "react-hot-toast";

interface FiscalYear {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
}

interface Props {
    shopId: string;
    shopSlug: string;
    isGlEnabled: boolean;
    initialFiscalYears: FiscalYear[];
    initialSettings: {
        isCitActive: boolean;
        isTotActive: boolean;
        citRate: number;
        estimatedAnnualProfit: number;
    };
}

export default function TaxSettingsClient({ shopId, shopSlug, isGlEnabled, initialFiscalYears, initialSettings }: Props) {
    const [activeTab, setActiveTab] = useState<"tax" | "fiscal">("tax");
    
    // Tax obligations state
    const [isCitActive, setIsCitActive] = useState(initialSettings.isCitActive);
    const [isTotActive, setIsTotActive] = useState(initialSettings.isTotActive);
    const [citRate, setCitRate] = useState(initialSettings.citRate.toString());
    const [estimatedAnnualProfit, setEstimatedAnnualProfit] = useState(initialSettings.estimatedAnnualProfit.toString());
    
    // Fiscal years state
    const [fiscalYearsList, setFiscalYearsList] = useState<FiscalYear[]>(initialFiscalYears);
    const [newFyLabel, setNewFyLabel] = useState("");
    const [newFyStartDate, setNewFyStartDate] = useState("");
    const [newFyEndDate, setNewFyEndDate] = useState("");

    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setMessage(null), 5000);
    }

    function handleSaveTaxSettings() {
        startTransition(async () => {
            const res = await updateTaxSettings(shopId, shopSlug, {
                isCitActive,
                isTotActive,
                citRate: parseFloat(citRate) || 0,
                estimatedAnnualProfit: parseFloat(estimatedAnnualProfit) || 0,
            });
            if (res.success) {
                showMsg("success", "Tax settings updated successfully.");
            } else {
                showMsg("error", res.error || "Failed to update tax settings.");
            }
        });
    }

    function handleDeclareFiscalYear() {
        if (!newFyLabel.trim() || !newFyStartDate || !newFyEndDate) {
            showMsg("error", "Please fill in all fields to declare a Fiscal Year.");
            return;
        }

        const start = new Date(newFyStartDate);
        const end = new Date(newFyEndDate);
        if (end <= start) {
            showMsg("error", "End Date must be after Start Date.");
            return;
        }

        startTransition(async () => {
            const res = await declareFiscalYear(shopId, shopSlug, {
                label: newFyLabel.trim(),
                startDate: newFyStartDate,
                endDate: newFyEndDate,
            });

            if (res.success) {
                showMsg("success", `Fiscal Year "${newFyLabel}" declared successfully. 12 calendar monthly periods pre-generated.`);
                setNewFyLabel("");
                setNewFyStartDate("");
                setNewFyEndDate("");
                // Reload window to fetch updated data or refresh
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showMsg("error", res.error || "Failed to declare fiscal year.");
            }
        });
    }

    function handleCloseFiscalYear(fyId: string, label: string) {
        toast((t) => (
            <div className="flex flex-col gap-3 font-mono text-xs max-w-sm">
                <span className="font-semibold uppercase tracking-tight text-black">Close Fiscal Year?</span>
                <p className="text-zinc-500 normal-case leading-relaxed text-[11px]">
                    Are you sure you want to CLOSE "{label}"? This will reset all Revenue and Expense accounts to Retained Earnings (3300) and lock all entries permanently.
                </p>
                <div className="flex gap-2">
                    <button 
                        className="bg-black text-white px-3 py-1.5 rounded font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const toastId = toast.loading(`Closing "${label}"...`);
                            const res = await closeFiscalYear(shopId, shopSlug, fyId);
                            if (!res.success) {
                                toast.error(res.error || "Failed to close fiscal year.", { id: toastId });
                            } else {
                                toast.success(`✓ Fiscal Year "${label}" closed successfully.`, { id: toastId });
                                setFiscalYearsList(prev => prev.map(fy => fy.id === fyId ? { ...fy, isClosed: true } : fy));
                                setTimeout(() => window.location.reload(), 1500);
                            }
                        }}
                    >
                        Confirm
                    </button>
                    <button 
                        className="bg-zinc-200 text-zinc-800 px-3 py-1.5 rounded font-bold uppercase tracking-wider hover:bg-zinc-300 transition-colors"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 10000, position: 'top-center' });
    }

    function handleDeleteFiscalYear(fyId: string, label: string) {
        toast((t) => (
            <div className="flex flex-col gap-3 font-mono text-xs max-w-sm">
                <span className="font-semibold uppercase tracking-tight text-black">Delete Fiscal Year?</span>
                <p className="text-zinc-500 normal-case leading-relaxed text-[11px]">
                    Are you sure you want to DELETE "${label}"? This will permanently delete this Fiscal Year and all its monthly periods. This action can only succeed if no journal entries are recorded in these periods.
                </p>
                <div className="flex gap-2">
                    <button 
                        className="bg-rose-600 text-white px-3 py-1.5 rounded font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const toastId = toast.loading(`Deleting "${label}"...`);
                            const res = await deleteFiscalYear(shopId, shopSlug, fyId);
                            if (!res.success) {
                                toast.error(res.error || "Failed to delete fiscal year.", { id: toastId });
                            } else {
                                toast.success(`✓ Fiscal Year "${label}" deleted successfully.`, { id: toastId });
                                setFiscalYearsList(prev => prev.filter(fy => fy.id !== fyId));
                                setTimeout(() => window.location.reload(), 1500);
                            }
                        }}
                    >
                        Confirm Delete
                    </button>
                    <button 
                        className="bg-zinc-200 text-zinc-800 px-3 py-1.5 rounded font-bold uppercase tracking-wider hover:bg-zinc-300 transition-colors"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 10000, position: 'top-center' });
    }

    return (
        <div className="max-w-4xl border border-zinc-200 rounded-xl overflow-hidden bg-white">
            {/* Header Tabs */}
            <div className="flex border-b border-zinc-100 bg-zinc-50">
                <button
                    onClick={() => setActiveTab("tax")}
                    className={`px-6 py-4 font-mono text-xs uppercase font-bold tracking-wider border-b-2 transition-all ${
                        activeTab === "tax"
                            ? "border-black text-black bg-white"
                            : "border-transparent text-zinc-400 hover:text-black"
                    }`}
                >
                    Tax Obligations
                </button>
                <button
                    onClick={() => setActiveTab("fiscal")}
                    className={`px-6 py-4 font-mono text-xs uppercase font-bold tracking-wider border-b-2 transition-all ${
                        activeTab === "fiscal"
                            ? "border-black text-black bg-white"
                            : "border-transparent text-zinc-400 hover:text-black"
                    }`}
                >
                    Fiscal Years
                </button>
            </div>

            <div className="p-6 space-y-5 font-sans">
                {message && (
                    <div
                        className={`px-4 py-3 rounded-lg text-sm font-medium border ${
                            message.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {activeTab === "tax" && (
                    <div className="space-y-6">
                        {/* Tax Obligations Checks */}
                        <div className="space-y-4">
                            <label className="font-mono text-xs uppercase text-zinc-400 font-bold block mb-1">
                                Active Tax Obligations
                            </label>
                            <p className="text-xs text-zinc-500 mb-3">
                                Select all tax obligations that apply to this workspace. A business can be registered for both CIT and TOT (e.g. for different business categories or divisions).
                            </p>

                            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="isCitActive"
                                        checked={isCitActive}
                                        onChange={(e) => setIsCitActive(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 border border-zinc-300 accent-black rounded-sm cursor-pointer"
                                    />
                                    <div>
                                        <label
                                            htmlFor="isCitActive"
                                            className="font-semibold uppercase tracking-tight block cursor-pointer select-none text-xs"
                                        >
                                            Corporate Income Tax (CIT) — 30%
                                        </label>
                                        <span className="text-[10px] text-zinc-500 font-sans leading-tight block mt-0.5">
                                            Tax assessed on the net profits of the company. Compulsory quarterly instalments apply if estimated annual tax is KES 30k+.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="isTotActive"
                                        checked={isTotActive}
                                        onChange={(e) => setIsTotActive(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 border border-zinc-300 accent-black rounded-sm cursor-pointer"
                                    />
                                    <div>
                                        <label
                                            htmlFor="isTotActive"
                                            className="font-semibold uppercase tracking-tight block cursor-pointer select-none text-xs"
                                        >
                                            Turnover Tax (TOT) — 1.5%
                                        </label>
                                        <span className="text-[10px] text-zinc-500 font-sans leading-tight block mt-0.5">
                                            Tax assessed on gross monthly sales. For workspaces with turnover below KES 25M.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isCitActive && (
                            <div className="border border-zinc-200 rounded-lg p-4 space-y-4 bg-zinc-50/50">
                                <span className="font-semibold uppercase text-black text-xs block">CIT Configurations</span>

                                {/* CIT Rate */}
                                <div className="space-y-1.5">
                                    <label className="font-mono text-xs uppercase text-zinc-400 font-bold block">CIT Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={citRate}
                                        onChange={(e) => setCitRate(e.target.value)}
                                        className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono"
                                    />
                                    <p className="text-[10px] text-zinc-400">
                                        Standard rate is 30% for resident companies, 37.5% for non-resident branch offices.
                                    </p>
                                </div>

                                {/* Estimated Profit */}
                                <div className="space-y-1.5">
                                    <label className="font-mono text-xs uppercase text-zinc-400 font-bold block">
                                        Estimated Annual Net Profit (KES)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={estimatedAnnualProfit}
                                        onChange={(e) => setEstimatedAnnualProfit(e.target.value)}
                                        className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono"
                                    />
                                    <p className="text-[10px] text-zinc-400">
                                        Used to compute optional or required instalment tax payments for this year.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSaveTaxSettings}
                            disabled={isPending}
                            className="w-full bg-black text-white py-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40"
                        >
                            {isPending ? "Saving Settings..." : "Save Settings"}
                        </button>
                    </div>
                )}

                {activeTab === "fiscal" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Declared Fiscal Years List */}
                        <div className="space-y-4">
                            <label className="font-mono text-xs uppercase text-zinc-400 font-bold block">
                                Declared Fiscal Years
                            </label>
                            
                            {fiscalYearsList.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl text-zinc-400">
                                    <p className="font-mono text-xs uppercase">No Fiscal Years Declared</p>
                                    <p className="text-[11px] mt-1">Declare your active fiscal year on the right to start bookkeeping.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {fiscalYearsList.map((fy) => (
                                        <div key={fy.id} className="border border-zinc-200 rounded-xl p-4 space-y-3 hover:bg-zinc-50/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-sm text-black">{fy.label}</h4>
                                                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                                        {new Date(fy.startDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                                                        {" – "}
                                                        {new Date(fy.endDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </p>
                                                </div>
                                                <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded border font-bold ${
                                                    fy.isClosed 
                                                        ? "bg-zinc-100 text-zinc-500 border-zinc-200" 
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                }`}>
                                                    {fy.isClosed ? "Closed" : "Active / Open"}
                                                </span>
                                            </div>

                                            {!fy.isClosed && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCloseFiscalYear(fy.id, fy.label)}
                                                        disabled={isPending}
                                                        className="flex-1 bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 py-1.5 rounded text-xs font-mono uppercase font-bold transition-all disabled:opacity-40"
                                                    >
                                                        Close Fiscal Year
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFiscalYear(fy.id, fy.label)}
                                                        disabled={isPending}
                                                        className="bg-zinc-100 border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 px-3 py-1.5 rounded text-xs font-mono uppercase font-bold transition-all disabled:opacity-40"
                                                        title="Delete Fiscal Year"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Declare New Year Form */}
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4">
                            <span className="font-mono text-xs text-zinc-500 uppercase font-semibold block">
                                Declare New Fiscal Year
                            </span>
                            
                            <div className="space-y-1">
                                <label className="font-mono text-[10px] uppercase text-zinc-400 font-bold block">
                                    Descriptive Label
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Fiscal Year 2025/2026"
                                    value={newFyLabel}
                                    onChange={(e) => setNewFyLabel(e.target.value)}
                                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-mono text-[10px] uppercase text-zinc-400 font-bold block">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={newFyStartDate}
                                    onChange={(e) => setNewFyStartDate(e.target.value)}
                                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-mono text-[10px] uppercase text-zinc-400 font-bold block">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={newFyEndDate}
                                    onChange={(e) => setNewFyEndDate(e.target.value)}
                                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono"
                                />
                            </div>

                            <button
                                onClick={handleDeclareFiscalYear}
                                disabled={isPending || !newFyLabel.trim() || !newFyStartDate || !newFyEndDate}
                                className="w-full bg-black text-white py-2.5 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40"
                            >
                                {isPending ? "Declaring..." : "Declare Year & Auto-Generate"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
