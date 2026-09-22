"use client";

import { useState } from "react";
import {
    updateLoyaltyProgram,
    createMembershipTier,
    updateMembershipTier,
    deleteMembershipTier,
} from "@/lib/actions/loyalty";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface TierItem {
    id: string;
    name: string;
    minSpendKes: string;
    discountPercent: string;
    pointsMultiplier: string;
    badgeColor: string;
    displayOrder: number;
}

interface ProgramData {
    id: string;
    isEnabled: boolean;
    engineMode: "OFF" | "POINTS_ONLY" | "TIERS_ONLY" | "HYBRID";
    programName: string;
    earnRateKes: string;
    pointValueKes: string;
    minRedeemPoints: number;
    pointsExpiryDays?: number | null;
}

interface Props {
    shopId: string;
    shopSlug: string;
    currency: string;
    initialProgram: ProgramData | null;
    initialTiers: TierItem[];
}

export default function LoyaltySettingsClient({
    shopId,
    shopSlug,
    currency,
    initialProgram,
    initialTiers,
}: Props) {
    const router = useRouter();

    // Program State
    const [isEnabled, setIsEnabled] = useState(initialProgram?.isEnabled ?? false);
    const [engineMode, setEngineMode] = useState<"OFF" | "POINTS_ONLY" | "TIERS_ONLY" | "HYBRID">(
        initialProgram?.engineMode || "HYBRID"
    );
    const [programName, setProgramName] = useState(initialProgram?.programName || "Rewards Club");
    const [earnRateKes, setEarnRateKes] = useState(initialProgram?.earnRateKes || "100.00");
    const [pointValueKes, setPointValueKes] = useState(initialProgram?.pointValueKes || "1.00");
    const [minRedeemPoints, setMinRedeemPoints] = useState(initialProgram?.minRedeemPoints || 50);
    const [pointsExpiryDays, setPointsExpiryDays] = useState<number | string>(
        initialProgram?.pointsExpiryDays || ""
    );
    const [isSavingProgram, setIsSavingProgram] = useState(false);

    // Tiers State
    const [tiers, setTiers] = useState<TierItem[]>(initialTiers);
    const [isTierModalOpen, setIsTierModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<TierItem | null>(null);
    const [tierName, setTierName] = useState("");
    const [tierMinSpend, setTierMinSpend] = useState("0");
    const [tierDiscount, setTierDiscount] = useState("0");
    const [tierMultiplier, setTierMultiplier] = useState("1.0");
    const [tierColor, setTierColor] = useState("#000000");
    const [tierOrder, setTierOrder] = useState(0);
    const [isSavingTier, setIsSavingTier] = useState(false);

    async function handleSaveProgram(e: React.FormEvent) {
        e.preventDefault();
        setIsSavingProgram(true);
        const toastId = toast.loading("Saving loyalty configuration...");

        try {
            const res = await updateLoyaltyProgram(shopId, shopSlug, {
                isEnabled,
                engineMode,
                programName: programName.trim(),
                earnRateKes,
                pointValueKes,
                minRedeemPoints: Number(minRedeemPoints),
                pointsExpiryDays: pointsExpiryDays ? Number(pointsExpiryDays) : null,
            });

            if (res.success) {
                toast.success("Loyalty program updated!", { id: toastId });
                router.refresh();
            } else {
                toast.error(res.error || "Failed to update.", { id: toastId });
            }
        } catch (err: any) {
            toast.error("Network error saving program.", { id: toastId });
        } finally {
            setIsSavingProgram(false);
        }
    }

    function openNewTierModal() {
        setEditingTier(null);
        setTierName("");
        setTierMinSpend("0");
        setTierDiscount("0");
        setTierMultiplier("1.0");
        setTierColor("#000000");
        setTierOrder(tiers.length + 1);
        setIsTierModalOpen(true);
    }

    function openEditTierModal(tier: TierItem) {
        setEditingTier(tier);
        setTierName(tier.name);
        setTierMinSpend(tier.minSpendKes);
        setTierDiscount(tier.discountPercent);
        setTierMultiplier(tier.pointsMultiplier);
        setTierColor(tier.badgeColor);
        setTierOrder(tier.displayOrder);
        setIsTierModalOpen(true);
    }

    async function handleSaveTier(e: React.FormEvent) {
        e.preventDefault();
        if (!tierName.trim()) {
            toast.error("Tier name is required.");
            return;
        }

        setIsSavingTier(true);
        try {
            if (editingTier) {
                const res = await updateMembershipTier(editingTier.id, shopSlug, {
                    name: tierName.trim(),
                    minSpendKes: tierMinSpend,
                    discountPercent: tierDiscount,
                    pointsMultiplier: tierMultiplier,
                    badgeColor: tierColor,
                    displayOrder: Number(tierOrder),
                });
                if (res.success) {
                    toast.success("Membership tier updated!");
                    setIsTierModalOpen(false);
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to update tier.");
                }
            } else {
                const res = await createMembershipTier(shopId, shopSlug, {
                    name: tierName.trim(),
                    minSpendKes: tierMinSpend,
                    discountPercent: tierDiscount,
                    pointsMultiplier: tierMultiplier,
                    badgeColor: tierColor,
                    displayOrder: Number(tierOrder),
                });
                if (res.success && res.data) {
                    toast.success("Membership tier created!");
                    setTiers([...tiers, res.data as any]);
                    setIsTierModalOpen(false);
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to create tier.");
                }
            }
        } catch (err) {
            toast.error("Failed to save tier.");
        } finally {
            setIsSavingTier(false);
        }
    }

    async function handleDeleteTier(tierId: string) {
        if (!confirm("Are you sure you want to delete this membership tier?")) return;
        const res = await deleteMembershipTier(tierId, shopSlug);
        if (res.success) {
            toast.success("Tier deleted.");
            setTiers(tiers.filter((t) => t.id !== tierId));
            router.refresh();
        } else {
            toast.error(res.error || "Failed to delete tier.");
        }
    }

    return (
        <div className="space-y-8">
            {/* ── PROGRAM CONFIGURATION FORM ── */}
            <form onSubmit={handleSaveProgram} className="card-modern bg-white p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
                    <div>
                        <h2 className="font-semibold uppercase tracking-wider text-sm text-black">
                            General Engine Rules
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Enable points cashback and select which retention mechanics apply.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-zinc-700 cursor-pointer">
                            Program Status:
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsEnabled(!isEnabled)}
                            className={`px-3 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase transition-colors ${
                                isEnabled
                                    ? "bg-emerald-600 text-white"
                                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                            }`}
                        >
                            {isEnabled ? "● Active" : "○ Disabled"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                            Program / Club Name
                        </label>
                        <input
                            type="text"
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                            placeholder="e.g. Manna Rewards, VIP Club"
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-black"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                            Engine Operational Mode
                        </label>
                        <select
                            value={engineMode}
                            onChange={(e) => setEngineMode(e.target.value as any)}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-black bg-white"
                        >
                            <option value="POINTS_ONLY">Points Only (B2C Retail &amp; POS Cashback)</option>
                            <option value="TIERS_ONLY">Tiers Only (Corporate &amp; Wholesale Volume Discounts)</option>
                            <option value="HYBRID">Hybrid (Both Points Accrual &amp; VIP Tier Discounts)</option>
                            <option value="OFF">Disabled</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                            Earn Rate ({currency} Spent per 1 Point)
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-400">KES</span>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                value={earnRateKes}
                                onChange={(e) => setEarnRateKes(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black"
                                required
                            />
                        </div>
                        <span className="text-[10px] text-zinc-400 font-sans block">
                            e.g. 100 means customer earns 1 point for every KES 100 spent.
                        </span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                            Redemption Value (Discount Value of 1 Point)
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-400">KES</span>
                            <input
                                type="number"
                                step="0.05"
                                min="0.01"
                                value={pointValueKes}
                                onChange={(e) => setPointValueKes(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black"
                                required
                            />
                        </div>
                        <span className="text-[10px] text-zinc-400 font-sans block">
                            e.g. 1.00 means 100 points = KES 100 instant invoice discount.
                        </span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                            Minimum Points Threshold to Redeem
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={minRedeemPoints}
                            onChange={(e) => setMinRedeemPoints(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black"
                            required
                        />
                        <span className="text-[10px] text-zinc-400 font-sans block">
                            Prevents micro-redemptions (e.g. minimum 50 points required).
                        </span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                            Points Expiry Days (Optional)
                        </label>
                        <input
                            type="number"
                            min="0"
                            placeholder="Leave blank for points that never expire"
                            value={pointsExpiryDays}
                            onChange={(e) => setPointsExpiryDays(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                        />
                    </div>
                </div>

                <div className="border-t border-zinc-100 pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSavingProgram}
                        className="btn-primary-modern px-5 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        {isSavingProgram ? "Saving Settings..." : "Save Program Rules"}
                    </button>
                </div>
            </form>

            {/* ── MEMBERSHIP TIERS MANAGEMENT ── */}
            <div className="card-modern bg-white p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
                    <div>
                        <h2 className="font-semibold uppercase tracking-wider text-sm text-black">
                            Membership &amp; Corporate Wholesale Tiers
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Reward high-volume and corporate clients with automatic invoice discount percentages and points multipliers.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openNewTierModal}
                        className="btn-primary-modern px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <span>+</span>
                        <span>Add Tier</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-200 text-[10px] font-mono uppercase text-zinc-400">
                                <th className="py-2.5 px-3">Tier Name</th>
                                <th className="py-2.5 px-3">Qualifying Spend</th>
                                <th className="py-2.5 px-3 text-right">Auto Discount</th>
                                <th className="py-2.5 px-3 text-right">Points Multiplier</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {tiers.map((tier) => (
                                <tr key={tier.id} className="hover:bg-zinc-50/60 transition-colors">
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full inline-block"
                                                style={{ backgroundColor: tier.badgeColor }}
                                            />
                                            <span className="font-bold text-black">{tier.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-zinc-600">
                                        KES {parseFloat(tier.minSpendKes).toLocaleString("en-KE")}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                                        {parseFloat(tier.discountPercent) > 0 ? `${tier.discountPercent}% OFF` : "—"}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono font-semibold text-black">
                                        {tier.pointsMultiplier}x
                                    </td>
                                    <td className="py-3 px-3 text-right space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditTierModal(tier)}
                                            className="text-zinc-600 hover:text-black font-semibold text-xs hover:underline cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTier(tier.id)}
                                            className="text-rose-600 hover:text-rose-800 font-semibold text-xs hover:underline cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── TIER ADD/EDIT MODAL ── */}
            {isTierModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
                    <div className="bg-white border border-zinc-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <h3 className="font-bold font-mono text-sm uppercase text-black">
                                {editingTier ? "Edit Membership Tier" : "New Membership Tier"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsTierModalOpen(false)}
                                className="text-zinc-400 hover:text-black font-mono font-bold text-base cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveTier} className="space-y-4 text-xs font-sans">
                            <div className="space-y-1">
                                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">
                                    Tier Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Wholesale Gold, Corporate VIP"
                                    value={tierName}
                                    onChange={(e) => setTierName(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-black"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">
                                    Qualifying Cumulative Spend (KES)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={tierMinSpend}
                                    onChange={(e) => setTierMinSpend(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-black"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">
                                        Automatic Invoice Discount %
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={tierDiscount}
                                        onChange={(e) => setTierDiscount(e.target.value)}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-black"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">
                                        Points Multiplier
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="0.1"
                                        value={tierMultiplier}
                                        onChange={(e) => setTierMultiplier(e.target.value)}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">
                                    Badge Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={tierColor}
                                        onChange={(e) => setTierColor(e.target.value)}
                                        className="w-8 h-8 rounded border border-zinc-300 cursor-pointer"
                                    />
                                    <span className="font-mono text-xs text-zinc-600">{tierColor}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTierModalOpen(false)}
                                    className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingTier}
                                    className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-bold uppercase font-mono hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    {isSavingTier ? "Saving..." : "Save Tier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
