"use client";

import { useState } from "react";
import { type PlanDefinition } from "@/lib/paywall";
import {
  updatePlatformPlanAction,
  createPlatformPlanAction,
  deletePlatformPlanAction,
  resetDefaultPlatformPlansAction,
} from "@/lib/actions/admin-pricing";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";
import Link from "next/link";

interface AdminPricingClientProps {
  initialPlans: PlanDefinition[];
}

export function AdminPricingClient({ initialPlans }: AdminPricingClientProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanDefinition[]>(initialPlans);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  // Edit Modal State
  const [editingPlan, setEditingPlan] = useState<PlanDefinition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [featureInputs, setFeatureInputs] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState("");

  // Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [createPlanData, setCreatePlanData] = useState({
    id: "",
    name: "",
    tagline: "",
    priceKesMonthly: 2500,
    priceKesAnnually: 24000,
    annualDiscountPercent: 20,
    discountedPriceMonthly: null as number | null,
    discountedPriceAnnually: null as number | null,
    maxMembers: 5,
    maxLocations: 5,
    canTransferStock: true,
    hasGeneralLedger: false,
    hasReconciliation: false,
    hasStatutoryPayroll: true,
    hasApiAccess: false,
    badge: "",
    isHighlighted: false,
  });
  const [createFeatures, setCreateFeatures] = useState<string[]>([
    "Up to 5 Team Members",
    "Up to 5 Stock Locations",
    "Inter-Branch Stock Transfers",
    "Statutory Payroll Suite",
  ]);
  const [newCreateFeatureText, setNewCreateFeatureText] = useState("");

  // Delete State
  const [planToDelete, setPlanToDelete] = useState<PlanDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  function openEditModal(plan: PlanDefinition) {
    setEditingPlan({ ...plan });
    setFeatureInputs([...plan.features]);
    setNewFeatureText("");
  }

  function handleAddFeature() {
    if (!newFeatureText.trim()) return;
    setFeatureInputs((prev) => [...prev, newFeatureText.trim()]);
    setNewFeatureText("");
  }

  function handleRemoveFeature(index: number) {
    setFeatureInputs((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddCreateFeature() {
    if (!newCreateFeatureText.trim()) return;
    setCreateFeatures((prev) => [...prev, newCreateFeatureText.trim()]);
    setNewCreateFeatureText("");
  }

  function handleRemoveCreateFeature(index: number) {
    setCreateFeatures((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlan) return;

    setIsSaving(true);
    const toastId = toast.loading(`Saving ${editingPlan.name} plan...`);

    const res = await updatePlatformPlanAction({
      id: editingPlan.id,
      name: editingPlan.name,
      tagline: editingPlan.tagline,
      priceKesMonthly: editingPlan.priceKesMonthly,
      priceKesAnnually: editingPlan.priceKesAnnually,
      annualDiscountPercent: editingPlan.annualDiscountPercent || 20,
      discountedPriceMonthly: editingPlan.discountedPriceMonthly ?? null,
      discountedPriceAnnually: editingPlan.discountedPriceAnnually ?? null,
      maxMembers: editingPlan.maxMembers === Infinity ? -1 : editingPlan.maxMembers,
      maxLocations: editingPlan.maxLocations === Infinity ? -1 : editingPlan.maxLocations,
      canTransferStock: editingPlan.canTransferStock,
      hasGeneralLedger: editingPlan.hasGeneralLedger,
      hasReconciliation: editingPlan.hasReconciliation,
      hasStatutoryPayroll: editingPlan.hasStatutoryPayroll,
      hasApiAccess: editingPlan.hasApiAccess,
      badge: editingPlan.badge,
      isHighlighted: Boolean(editingPlan.isHighlighted),
      features: featureInputs,
      isActive: true,
    });

    setIsSaving(false);

    if (res.success) {
      toast.success(res.message || "Plan updated!", { id: toastId });
      setEditingPlan(null);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update plan.", { id: toastId });
    }
  }

  async function handleCreatePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!createPlanData.id.trim() || !createPlanData.name.trim()) {
      toast.error("Please fill in the Plan Code ID and Plan Name.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(`Creating new tier ${createPlanData.name}...`);

    const res = await createPlatformPlanAction({
      id: createPlanData.id,
      name: createPlanData.name,
      tagline: createPlanData.tagline,
      priceKesMonthly: createPlanData.priceKesMonthly,
      priceKesAnnually: createPlanData.priceKesAnnually,
      annualDiscountPercent: createPlanData.annualDiscountPercent,
      discountedPriceMonthly: createPlanData.discountedPriceMonthly ?? null,
      discountedPriceAnnually: createPlanData.discountedPriceAnnually ?? null,
      maxMembers: createPlanData.maxMembers,
      maxLocations: createPlanData.maxLocations,
      canTransferStock: createPlanData.canTransferStock,
      hasGeneralLedger: createPlanData.hasGeneralLedger,
      hasReconciliation: createPlanData.hasReconciliation,
      hasStatutoryPayroll: createPlanData.hasStatutoryPayroll,
      hasApiAccess: createPlanData.hasApiAccess,
      badge: createPlanData.badge || null,
      isHighlighted: createPlanData.isHighlighted,
      features: createFeatures,
    });

    setIsSaving(false);

    if (res.success) {
      toast.success(res.message || "New plan created!", { id: toastId });
      setIsCreating(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to create plan.", { id: toastId });
    }
  }

  async function handleConfirmDelete() {
    if (!planToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading(`Deleting ${planToDelete.name} plan...`);
    const res = await deletePlatformPlanAction(planToDelete.id);
    setIsDeleting(false);
    setPlanToDelete(null);

    if (res.success) {
      toast.success(res.message || "Plan deleted.", { id: toastId });
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete plan.", { id: toastId });
    }
  }

  async function handleConfirmReset() {
    setIsResetting(true);
    const toastId = toast.loading("Resetting plans to defaults...");
    const res = await resetDefaultPlatformPlansAction();
    setIsResetting(false);
    setShowResetConfirm(false);

    if (res.success) {
      toast.success("Plans reset to standard defaults.", { id: toastId });
      router.refresh();
    } else {
      toast.error(res.error || "Failed to reset plans.", { id: toastId });
    }
  }

  return (
    <div className="space-y-10 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
            <Link href="/admin" className="hover:text-black underline">
              Admin Terminal
            </Link>
            <span>/</span>
            <span>Platform Pricing &amp; Plans</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
            Dynamic Pricing &amp; Tier Manager
          </h1>
          <p className="text-xs text-zinc-600 font-mono mt-1">
            Configure unlimited plan tiers, custom pricing, quota limits, and feature permissions across the public site and checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 border border-zinc-300 hover:border-zinc-500 bg-white text-zinc-700 font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add New Plan Tier</span>
          </button>
        </div>
      </div>

      {/* BILLING CYCLE PREVIEW TOGGLE */}
      <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200">
        <div>
          <span className="font-bold text-xs uppercase text-black block">Live Display Preview ({plans.length} Active Tiers)</span>
          <span className="text-[11px] text-zinc-500 font-mono">
            Preview pricing cards as seen by merchants on the public website and in workspace settings.
          </span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg border border-zinc-300 font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              billingCycle === "MONTHLY" ? "bg-black text-white shadow-2xs" : "text-zinc-600 hover:text-black"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("ANNUAL")}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === "ANNUAL" ? "bg-black text-white shadow-2xs" : "text-zinc-600 hover:text-black"
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[9px] bg-emerald-400 text-black px-1.5 py-0.5 rounded font-bold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* PLAN PRICING CARDS MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isAnnual = billingCycle === "ANNUAL";
          const originalPrice = isAnnual ? plan.priceKesAnnually : plan.priceKesMonthly;
          const promoPrice = isAnnual ? plan.discountedPriceAnnually : plan.discountedPriceMonthly;
          const hasDiscount = typeof promoPrice === "number" && promoPrice > 0 && promoPrice < originalPrice;
          const displayPrice = hasDiscount ? promoPrice : originalPrice;
          const monthlyEquivalent = isAnnual && displayPrice > 0 ? Math.round(displayPrice / 12) : displayPrice;
          const isCoreDefault = ["FREE", "BASIC", "PRO", "ENTERPRISE"].includes(plan.id);

          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between relative transition-all ${
                plan.isHighlighted
                  ? "border-black ring-2 ring-black"
                  : "border-zinc-200/80 hover:border-zinc-400"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-black uppercase text-black">{plan.name}</h3>
                      <span className="font-mono text-[9px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded uppercase font-bold">
                        {plan.id}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5 leading-tight">{plan.tagline}</p>
                  </div>
                </div>

                {/* PRICE DISPLAY */}
                <div className="border-y border-zinc-100 py-4 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono">
                    {hasDiscount && (
                      <span className="text-sm font-bold text-zinc-400 line-through">
                        {formatCurrency(originalPrice, "KES")}
                      </span>
                    )}
                    <span className="text-2xl sm:text-3xl font-black text-black">
                      {displayPrice === 0 ? "FREE" : formatCurrency(displayPrice, "KES")}
                    </span>
                    {displayPrice > 0 && (
                      <span className="text-xs text-zinc-500">
                        {isAnnual ? "/ yr" : "/ mo"}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-bold uppercase">
                        PROMO
                      </span>
                    )}
                  </div>
                  {isAnnual && displayPrice > 0 && (
                    <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                      Equivalent to {formatCurrency(monthlyEquivalent, "KES")}/month
                    </span>
                  )}
                </div>

                {/* QUOTAS & LIMITS SUMMARY */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 font-mono text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Team Members:</span>
                    <span className="font-bold text-black">{plan.maxMembers === Infinity ? "Unlimited (∞)" : `${plan.maxMembers} Users`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stock Locations:</span>
                    <span className="font-bold text-black">{plan.maxLocations === Infinity ? "Unlimited (∞)" : `${plan.maxLocations} Nodes`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stock Transfers:</span>
                    <span className={`font-bold ${plan.canTransferStock ? "text-emerald-700" : "text-zinc-400"}`}>
                      {plan.canTransferStock ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">General Ledger:</span>
                    <span className={`font-bold ${plan.hasGeneralLedger ? "text-emerald-700" : "text-zinc-400"}`}>
                      {plan.hasGeneralLedger ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* FEATURES CHECKLIST */}
                <div className="space-y-1.5 font-mono text-xs text-zinc-700 pt-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Features ({plan.features.length})
                  </span>
                  {plan.features.slice(0, 5).map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span className="leading-tight text-[11px]">{f}</span>
                    </div>
                  ))}
                  {plan.features.length > 5 && (
                    <span className="text-[10px] text-zinc-400 italic block">
                      +{plan.features.length - 5} more feature points
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(plan)}
                  className="flex-1 bg-black hover:bg-zinc-800 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>⚙️</span>
                  <span>Edit Plan</span>
                </button>

                {plan.id !== "FREE" && (
                  <button
                    type="button"
                    onClick={() => setPlanToDelete(plan)}
                    className="p-2.5 border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer text-xs"
                    title="Delete Plan Tier"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE PLAN MODAL */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 font-sans my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
              <div>
                <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                  Plan Tier Creation Wizard
                </span>
                <h3 className="text-xl font-black text-black uppercase">
                  Add New Plan Tier
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-zinc-400 hover:text-black font-bold p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-6 font-mono text-xs">
              
              {/* BASIC INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">Plan Code ID (Unique)</label>
                  <input
                    type="text"
                    value={createPlanData.id}
                    onChange={(e) => setCreatePlanData({ ...createPlanData, id: e.target.value.toUpperCase() })}
                    placeholder="e.g. GROWTH"
                    required
                    className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">Plan Name</label>
                  <input
                    type="text"
                    value={createPlanData.name}
                    onChange={(e) => setCreatePlanData({ ...createPlanData, name: e.target.value })}
                    placeholder="e.g. Growth"
                    required
                    className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">Badge Label (Optional)</label>
                  <input
                    type="text"
                    value={createPlanData.badge}
                    onChange={(e) => setCreatePlanData({ ...createPlanData, badge: e.target.value })}
                    placeholder="e.g. Best Value"
                    className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">Tagline Description</label>
                  <input
                    type="text"
                    value={createPlanData.tagline}
                    onChange={(e) => setCreatePlanData({ ...createPlanData, tagline: e.target.value })}
                    placeholder="e.g. For expanding retail and wholesale operations"
                    required
                    className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* PRICING CONFIGURATION (MONTHLY & ANNUAL) */}
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-4">
                <span className="font-bold text-black uppercase text-[11px] block">
                  💰 Pricing Configuration (KES)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">Monthly Price (KES)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={createPlanData.priceKesMonthly}
                      onChange={(e) => {
                        const monthly = parseInt(e.target.value) || 0;
                        const discount = createPlanData.annualDiscountPercent || 20;
                        const annual = monthly > 0 ? Math.round(monthly * 12 * (1 - discount / 100)) : 0;
                        setCreatePlanData({ ...createPlanData, priceKesMonthly: monthly, priceKesAnnually: annual });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">Annual Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={createPlanData.annualDiscountPercent}
                      onChange={(e) => {
                        const discount = parseInt(e.target.value) || 0;
                        const annual = createPlanData.priceKesMonthly > 0
                          ? Math.round(createPlanData.priceKesMonthly * 12 * (1 - discount / 100))
                          : 0;
                        setCreatePlanData({ ...createPlanData, annualDiscountPercent: discount, priceKesAnnually: annual });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">Annual Price (KES)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={createPlanData.priceKesAnnually}
                      onChange={(e) => setCreatePlanData({ ...createPlanData, priceKesAnnually: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-emerald-900 focus:outline-none focus:border-black bg-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-700 uppercase text-[10px] block">
                      🏷️ Promotional / Slashed Discount Pricing (Optional)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-sans">Leave blank for no promo discount</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-rose-600 uppercase block">Discounted Monthly Price (KES)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={createPlanData.discountedPriceMonthly ?? ""}
                        onChange={(e) => setCreatePlanData({ ...createPlanData, discountedPriceMonthly: e.target.value === "" ? null : parseInt(e.target.value) || 0 })}
                        placeholder="e.g. 1999 (slashes original)"
                        className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-rose-600 uppercase block">Discounted Annual Price (KES)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={createPlanData.discountedPriceAnnually ?? ""}
                        onChange={(e) => setCreatePlanData({ ...createPlanData, discountedPriceAnnually: e.target.value === "" ? null : parseInt(e.target.value) || 0 })}
                        placeholder="e.g. 18000 (slashes original)"
                        className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QUOTA LIMITS */}
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-4">
                <span className="font-bold text-black uppercase text-[11px] block">
                  👥 Tenant Quota Limits (-1 = Unlimited)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                      Max Team Members ({createPlanData.maxMembers === -1 ? "Unlimited" : createPlanData.maxMembers})
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={createPlanData.maxMembers}
                      onChange={(e) => setCreatePlanData({ ...createPlanData, maxMembers: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                      Max Physical Locations ({createPlanData.maxLocations === -1 ? "Unlimited" : createPlanData.maxLocations})
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={createPlanData.maxLocations}
                      onChange={(e) => setCreatePlanData({ ...createPlanData, maxLocations: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* PERMISSIONS */}
              <div className="space-y-2 border border-zinc-200 p-4 rounded-xl bg-white">
                <span className="font-bold text-black uppercase text-[11px] block mb-2">
                  🔒 Enabled Feature Permissions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createPlanData.canTransferStock}
                      onChange={(e) => setCreatePlanData({ ...createPlanData, canTransferStock: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">Inter-Branch Stock Transfers</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createPlanData.hasGeneralLedger}
                      onChange={(e) => setCreatePlanData({ ...createPlanData, hasGeneralLedger: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">General Ledger &amp; Balance Sheet</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createPlanData.hasReconciliation}
                      onChange={(e) => setCreatePlanData({ ...createPlanData, hasReconciliation: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">Bank &amp; M-Pesa CSV Reconciliation</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createPlanData.hasStatutoryPayroll}
                      onChange={(e) => setCreatePlanData({ ...createPlanData, hasStatutoryPayroll: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">Statutory Payroll Suite</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createPlanData.isHighlighted}
                      onChange={(e) => setCreatePlanData({ ...createPlanData, isHighlighted: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">Highlight as Featured Card</span>
                  </label>
                </div>
              </div>

              {/* FEATURES BULLET POINTS */}
              <div className="space-y-3">
                <span className="font-bold text-black uppercase text-[11px] block">
                  Features Checklist ({createFeatures.length})
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCreateFeatureText}
                    onChange={(e) => setNewCreateFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCreateFeature();
                      }
                    }}
                    placeholder="e.g. Dedicated WhatsApp Account Manager"
                    className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={handleAddCreateFeature}
                    className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-zinc-200 rounded-xl p-3 bg-zinc-50">
                  {createFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-md border border-zinc-200 text-xs">
                      <span className="truncate">{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCreateFeature(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 border border-zinc-300 hover:bg-zinc-100 font-bold uppercase text-[11px] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-black hover:bg-zinc-800 text-white font-bold uppercase text-[11px] px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Create Plan Tier</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 font-sans my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
              <div>
                <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                  Super Admin Plan Editor
                </span>
                <h3 className="text-xl font-black text-black uppercase">
                  Edit {editingPlan.name} Tier ({editingPlan.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-zinc-400 hover:text-black font-bold p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-6 font-mono text-xs">
              
              {/* BASIC INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">Plan Name</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">Badge Label (Optional)</label>
                  <input
                    type="text"
                    value={editingPlan.badge || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value || null })}
                    placeholder="e.g. Most Popular"
                    className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">Tagline Description</label>
                  <input
                    type="text"
                    value={editingPlan.tagline}
                    onChange={(e) => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* PRICING CONFIGURATION (MONTHLY & ANNUAL) */}
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-4">
                <span className="font-bold text-black uppercase text-[11px] block">
                  💰 Pricing Configuration (KES)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">Monthly Price (KES)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={editingPlan.priceKesMonthly}
                      onChange={(e) => {
                        const monthly = parseInt(e.target.value) || 0;
                        const discount = editingPlan.annualDiscountPercent || 20;
                        const annual = monthly > 0 ? Math.round(monthly * 12 * (1 - discount / 100)) : 0;
                        setEditingPlan({ ...editingPlan, priceKesMonthly: monthly, priceKesAnnually: annual });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">Annual Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={editingPlan.annualDiscountPercent || 20}
                      onChange={(e) => {
                        const discount = parseInt(e.target.value) || 0;
                        const annual = editingPlan.priceKesMonthly > 0
                          ? Math.round(editingPlan.priceKesMonthly * 12 * (1 - discount / 100))
                          : 0;
                        setEditingPlan({ ...editingPlan, annualDiscountPercent: discount, priceKesAnnually: annual });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">Annual Price (KES)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editingPlan.priceKesAnnually}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priceKesAnnually: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-emerald-900 focus:outline-none focus:border-black bg-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-700 uppercase text-[10px] block">
                      🏷️ Promotional / Slashed Discount Pricing (Optional)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-sans">Leave blank for no promo discount</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-rose-600 uppercase block">Discounted Monthly Price (KES)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={editingPlan.discountedPriceMonthly ?? ""}
                        onChange={(e) => setEditingPlan({ ...editingPlan, discountedPriceMonthly: e.target.value === "" ? null : parseInt(e.target.value) || 0 })}
                        placeholder="e.g. 1999 (slashes original)"
                        className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-rose-600 uppercase block">Discounted Annual Price (KES)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={editingPlan.discountedPriceAnnually ?? ""}
                        onChange={(e) => setEditingPlan({ ...editingPlan, discountedPriceAnnually: e.target.value === "" ? null : parseInt(e.target.value) || 0 })}
                        placeholder="e.g. 18000 (slashes original)"
                        className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QUOTA LIMITS */}
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-4">
                <span className="font-bold text-black uppercase text-[11px] block">
                  👥 Tenant Quota Limits (-1 = Unlimited)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                      Max Team Members ({editingPlan.maxMembers === Infinity ? "Unlimited" : editingPlan.maxMembers})
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={editingPlan.maxMembers === Infinity ? -1 : editingPlan.maxMembers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setEditingPlan({ ...editingPlan, maxMembers: val === -1 ? Infinity : val });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                      Max Physical Locations ({editingPlan.maxLocations === Infinity ? "Unlimited" : editingPlan.maxLocations})
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={editingPlan.maxLocations === Infinity ? -1 : editingPlan.maxLocations}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setEditingPlan({ ...editingPlan, maxLocations: val === -1 ? Infinity : val });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* PERMISSION CHECKBOXES */}
              <div className="space-y-2 border border-zinc-200 p-4 rounded-xl bg-white">
                <span className="font-bold text-black uppercase text-[11px] block mb-2">
                  🔒 Enabled Feature Permissions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingPlan.canTransferStock}
                      onChange={(e) => setEditingPlan({ ...editingPlan, canTransferStock: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">Inter-Branch Stock Transfers</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingPlan.hasGeneralLedger}
                      onChange={(e) => setEditingPlan({ ...editingPlan, hasGeneralLedger: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">General Ledger &amp; Balance Sheet</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingPlan.hasReconciliation}
                      onChange={(e) => setEditingPlan({ ...editingPlan, hasReconciliation: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">Bank &amp; M-Pesa CSV Reconciliation</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingPlan.hasStatutoryPayroll}
                      onChange={(e) => setEditingPlan({ ...editingPlan, hasStatutoryPayroll: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">Statutory Payroll Suite</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(editingPlan.isHighlighted)}
                      onChange={(e) => setEditingPlan({ ...editingPlan, isHighlighted: e.target.checked })}
                      className="w-4 h-4 accent-black rounded"
                    />
                    <span className="text-zinc-800 font-bold">Highlight as Featured Card</span>
                  </label>
                </div>
              </div>

              {/* FEATURES BULLET POINTS LIST */}
              <div className="space-y-3">
                <span className="font-bold text-black uppercase text-[11px] block">
                  Features Checklist ({featureInputs.length})
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="e.g. 58mm/80mm Thermal Slip Printing"
                    className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-zinc-200 rounded-xl p-3 bg-zinc-50">
                  {featureInputs.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-md border border-zinc-200 text-xs">
                      <span className="truncate">{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-5 py-2.5 border border-zinc-300 hover:bg-zinc-100 font-bold uppercase text-[11px] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-black hover:bg-zinc-800 text-white font-bold uppercase text-[11px] px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Save Plan Changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${planToDelete?.name}" Plan Tier?`}
        message={`Are you sure you want to delete the "${planToDelete?.name}" (${planToDelete?.id}) plan tier? This tier will no longer appear on public pricing or in merchant checkout.`}
        confirmLabel="Delete Plan"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* RESET CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Reset All Plans to Standard Defaults"
        message="Are you sure you want to reset all plan prices, quotas, and feature descriptions to the standard default baseline? Custom modifications and added tiers will be reset."
        confirmLabel="Reset Plans"
        variant="danger"
        isLoading={isResetting}
      />

    </div>
  );
}
