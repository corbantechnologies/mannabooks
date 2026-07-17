"use client";

import { useState, useTransition } from "react";
import { updateTaxSettings } from "@/lib/actions/tax";

interface Props {
    shopId: string;
    shopSlug: string;
    initialSettings: {
        isCitActive: boolean;
        isTotActive: boolean;
        citRate: number;
        estimatedAnnualProfit: number;
    };
}

export default function TaxSettingsClient({ shopId, shopSlug, initialSettings }: Props) {
    const [isCitActive, setIsCitActive] = useState(initialSettings.isCitActive);
    const [isTotActive, setIsTotActive] = useState(initialSettings.isTotActive);
    const [citRate, setCitRate] = useState(initialSettings.citRate.toString());
    const [estimatedAnnualProfit, setEstimatedAnnualProfit] = useState(initialSettings.estimatedAnnualProfit.toString());
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    }

    function handleSave() {
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

    return (
        <div className="max-w-2xl border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50">
                <h3 className="font-mono text-xs uppercase font-bold text-zinc-700">Tax Settings</h3>
            </div>

            <div className="p-6 space-y-5 font-sans">
                {message && (
                    <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                        {message.text}
                    </div>
                )}

                {/* Tax Obligations Checks */}
                <div className="space-y-4">
                    <label className="font-mono text-xs uppercase text-zinc-400 font-bold block mb-1">Active Tax Obligations</label>
                    <p className="text-xs text-zinc-500 mb-3">Select all tax obligations that apply to this workspace. A business can be registered for both CIT and TOT (e.g. for different business categories or divisions).</p>
                    
                    <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="isCitActive"
                                checked={isCitActive}
                                onChange={e => setIsCitActive(e.target.checked)}
                                className="w-4 h-4 mt-0.5 border border-zinc-300 accent-black rounded-sm cursor-pointer"
                            />
                            <div>
                                <label htmlFor="isCitActive" className="font-semibold uppercase tracking-tight block cursor-pointer select-none text-xs">
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
                                onChange={e => setIsTotActive(e.target.checked)}
                                className="w-4 h-4 mt-0.5 border border-zinc-300 accent-black rounded-sm cursor-pointer"
                            />
                            <div>
                                <label htmlFor="isTotActive" className="font-semibold uppercase tracking-tight block cursor-pointer select-none text-xs">
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
                                onChange={e => setCitRate(e.target.value)}
                                className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono"
                            />
                            <p className="text-[10px] text-zinc-400">Standard rate is 30% for resident companies, 37.5% for non-resident branch offices.</p>
                        </div>

                        {/* Estimated Profit */}
                        <div className="space-y-1.5">
                            <label className="font-mono text-xs uppercase text-zinc-400 font-bold block">Estimated Annual Net Profit (KES)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={estimatedAnnualProfit}
                                onChange={e => setEstimatedAnnualProfit(e.target.value)}
                                className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono"
                            />
                            <p className="text-[10px] text-zinc-400">Used to compute optional or required instalment tax payments for this year.</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full bg-black text-white py-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40"
                >
                    {isPending ? "Saving Settings..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
}
