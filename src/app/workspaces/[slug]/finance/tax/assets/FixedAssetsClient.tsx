"use client";

import { useState, useTransition } from "react";
import { createFixedAsset, disposeFixedAsset, computeCapitalAllowances } from "@/lib/actions/tax";

type AssetClass = "CLASS_1" | "CLASS_2" | "CLASS_3" | "CLASS_4" | "BUILDING";

interface Asset {
    id: string;
    name: string;
    assetClass: AssetClass;
    purchaseDate: string;
    purchaseCost: string;
    taxWdv: string;
    scrapValue: string;
    isDisposed: boolean;
    disposalDate: string | null;
    disposalProceeds: string | null;
}

interface Props {
    shopId: string;
    shopSlug: string;
    initialAssets: Asset[];
    currency: string;
}

const CLASS_LABELS: Record<AssetClass, string> = {
    CLASS_1: "Class 1 (37.5% - Computers, Software)",
    CLASS_2: "Class 2 (25.0% - Motor Vehicles)",
    CLASS_3: "Class 3 (12.5% - Machinery, Plant)",
    CLASS_4: "Class 4 (10.0% - Furniture, Fittings)",
    BUILDING: "Building (10.0% SL - Industrial Buildings)",
};

export default function FixedAssetsClient({ shopId, shopSlug, initialAssets, currency }: Props) {
    const [assets, setAssets] = useState<Asset[]>(initialAssets);
    const [isPending, startTransition] = useTransition();
    const [showAddForm, setShowAddForm] = useState(false);
    const [disposingId, setDisposingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form states
    const [newAsset, setNewAsset] = useState({
        name: "",
        assetClass: "CLASS_4" as AssetClass,
        purchaseDate: new Date().toISOString().split("T")[0],
        purchaseCost: "",
        scrapValue: "0",
    });

    const [disposal, setDisposal] = useState({
        disposalDate: new Date().toISOString().split("T")[0],
        disposalProceeds: "",
    });

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    }

    function handleAdd() {
        if (!newAsset.name || !newAsset.purchaseCost) return;
        startTransition(async () => {
            const res = await createFixedAsset(shopId, shopSlug, {
                name: newAsset.name,
                assetClass: newAsset.assetClass,
                purchaseDate: new Date(newAsset.purchaseDate + "T00:00:00"),
                purchaseCost: parseFloat(newAsset.purchaseCost),
                scrapValue: parseFloat(newAsset.scrapValue) || 0,
            });
            if (res.success && res.asset) {
                setAssets(prev => [{
                    ...res.asset!,
                    assetClass: res.asset!.assetClass as AssetClass,
                    disposalDate: null,
                    disposalProceeds: null,
                }, ...prev]);
                setShowAddForm(false);
                setNewAsset({ name: "", assetClass: "CLASS_4", purchaseDate: new Date().toISOString().split("T")[0], purchaseCost: "", scrapValue: "0" });
                showMsg("success", `Asset ${res.asset.name} registered and DR 1400 / CR 1200 journal entry posted.`);
            } else {
                showMsg("error", (res as any).error || "Failed to add asset.");
            }
        });
    }

    function handleDispose(assetId: string) {
        if (!disposal.disposalProceeds) return;
        startTransition(async () => {
            const res = await disposeFixedAsset(shopId, shopSlug, assetId, {
                disposalDate: new Date(disposal.disposalDate + "T00:00:00"),
                disposalProceeds: parseFloat(disposal.disposalProceeds),
            });
            if (res.success) {
                setAssets(prev => prev.map(a => a.id === assetId
                    ? { ...a, isDisposed: true, disposalDate: disposal.disposalDate, disposalProceeds: disposal.disposalProceeds }
                    : a
                ));
                setDisposingId(null);
                setDisposal({ disposalDate: new Date().toISOString().split("T")[0], disposalProceeds: "" });
                showMsg("success", "Asset disposed and DR 1200 / CR 1400 journal entry posted.");
            } else {
                showMsg("error", res.error || "Failed to dispose asset.");
            }
        });
    }

    function handleRunCapitalAllowances() {
        startTransition(async () => {
            const year = new Date().getFullYear();
            const res = await computeCapitalAllowances(shopId, shopSlug, year);
            if (res.success) {
                showMsg("success", `✓ Capital allowances calculated. Depreciation expense of KES ${res.amount?.toLocaleString("en-KE")} posted.`);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showMsg("error", res.error!);
            }
        });
    }

    const activeAssets = assets.filter(a => !a.isDisposed);
    const totalWdv = activeAssets.reduce((s, a) => s + parseFloat(a.taxWdv), 0);

    return (
        <div className="space-y-6">
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Header Actions */}
            <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-5 rounded-xl">
                <div>
                    <p className="font-mono text-[10px] uppercase text-zinc-400">Total Net Written Down Value (WDV)</p>
                    <p className="text-xl font-bold text-black mt-1 font-mono">{currency} {totalWdv.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRunCapitalAllowances} disabled={isPending || activeAssets.length === 0}
                        className="bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
                        Compute Wear & Tear
                    </button>
                    <button onClick={() => setShowAddForm(v => !v)}
                        className="bg-black text-white px-4 py-2.5 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors">
                        + Register Asset
                    </button>
                </div>
            </div>

            {/* Add Asset Form */}
            {showAddForm && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-mono text-xs text-zinc-500 uppercase font-semibold">New Fixed Asset Registration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input value={newAsset.name} onChange={e => setNewAsset(p => ({ ...p, name: e.target.value }))}
                            placeholder="Asset Description (e.g. Dell Latitude 7420)"
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                        
                        <select value={newAsset.assetClass} onChange={e => setNewAsset(p => ({ ...p, assetClass: e.target.value as AssetClass }))}
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white">
                            {Object.entries(CLASS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>

                        <input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset(p => ({ ...p, purchaseDate: e.target.value }))}
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono" />
                        
                        <input type="number" value={newAsset.purchaseCost} onChange={e => setNewAsset(p => ({ ...p, purchaseCost: e.target.value }))}
                            placeholder="Purchase Cost (KES)"
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono" />
                        
                        <input type="number" value={newAsset.scrapValue} onChange={e => setNewAsset(p => ({ ...p, scrapValue: e.target.value }))}
                            placeholder="Residual/Scrap Value (Default: 0)"
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} disabled={isPending || !newAsset.name || !newAsset.purchaseCost}
                            className="bg-black text-white px-5 py-2 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50">
                            {isPending ? "Registering..." : "Save Asset"}
                        </button>
                        <button onClick={() => setShowAddForm(false)} className="text-sm text-zinc-500 hover:text-black px-4">Cancel</button>
                    </div>
                </div>
            )}

            {/* Asset Table */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_1.2fr_1fr] gap-4 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Asset</span>
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Class</span>
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Acquired</span>
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-right">Cost</span>
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-right">Current WDV</span>
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-center">Status</span>
                        </div>

                        {assets.length === 0 ? (
                            <div className="text-center py-16 text-zinc-400">
                                <p className="font-mono text-sm">No assets registered yet.</p>
                                <p className="text-sm mt-1">Register new equipment or computers above to begin tracking depreciation.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {assets.map(asset => (
                                    <div key={asset.id} className="space-y-3 p-4 hover:bg-zinc-50/50 transition-colors">
                                        <div className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_1.2fr_1fr] gap-4 items-center">
                                            <span className="text-sm font-semibold text-black truncate">{asset.name}</span>
                                            <span className="text-xs text-zinc-600 truncate">{CLASS_LABELS[asset.assetClass].split(" ")[0]} ({CLASS_LABELS[asset.assetClass].split("(")[1].split("-")[0].trim()})</span>
                                            <span className="text-xs text-zinc-500 font-mono">{asset.purchaseDate}</span>
                                            <span className="text-xs font-mono text-right text-black">{currency} {parseFloat(asset.purchaseCost).toLocaleString("en-KE")}</span>
                                            <span className="text-xs font-mono text-right text-black font-bold">{currency} {parseFloat(asset.taxWdv).toLocaleString("en-KE")}</span>
                                            <div className="flex justify-center items-center gap-2">
                                                <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded border font-bold ${asset.isDisposed ? "bg-zinc-100 text-zinc-500 border-zinc-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                                    {asset.isDisposed ? "Disposed" : "Active"}
                                                </span>
                                                {!asset.isDisposed && (
                                                    <button onClick={() => setDisposingId(asset.id)}
                                                        className="text-[10px] text-zinc-400 hover:text-rose-600 font-mono uppercase font-bold">
                                                        Dispose
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Disposal Dialog Box inline */}
                                        {disposingId === asset.id && (
                                            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-3">
                                                <p className="font-mono text-[10px] font-bold text-rose-700 uppercase">Dispose Fixed Asset</p>
                                                <div className="grid grid-cols-2 gap-3 max-w-md">
                                                    <input type="date" value={disposal.disposalDate} onChange={e => setDisposal(p => ({ ...p, disposalDate: e.target.value }))}
                                                        className="border border-rose-200 rounded px-2 py-1 text-xs focus:ring-rose-500 bg-white font-mono" />
                                                    <input type="number" value={disposal.disposalProceeds} onChange={e => setDisposal(p => ({ ...p, disposalProceeds: e.target.value }))}
                                                        placeholder="Disposal proceeds (KES)"
                                                        className="border border-rose-200 rounded px-2 py-1 text-xs focus:ring-rose-500 bg-white font-mono" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleDispose(asset.id)} disabled={isPending || !disposal.disposalProceeds}
                                                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono uppercase font-bold px-3 py-1.5 rounded disabled:opacity-40">
                                                        Confirm Disposal
                                                    </button>
                                                    <button onClick={() => setDisposingId(null)} className="text-xs text-zinc-500 hover:text-black">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
