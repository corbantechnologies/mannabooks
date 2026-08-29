"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toggleSuperAdminAction, toggleUserLifetimeProAction, updateUserSubscriptionAction } from "@/lib/actions/admin";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";
import { type PlanDefinition } from "@/lib/paywall";
import { formatCurrency } from "@/lib/utils";

interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  isLifetimePro: boolean;
  plan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | Date | null;
  createdAt: string | Date;
  ownedShopsCount: number;
  membershipsCount: number;
  ownedShops: { id: string; name: string; slug: string; plan: string }[];
}

interface AdminUsersClientProps {
  initialUsers: AdminUserSummary[];
  availablePlans?: PlanDefinition[];
}

export function AdminUsersClient({ initialUsers, availablePlans = [] }: AdminUsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>(initialUsers);

  // Upgrade Popover State (Anchored to specific user row)
  const [popoverUserId, setPopoverUserId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("FREE");
  const [isLifetimeSelection, setIsLifetimeSelection] = useState<boolean>(false);
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [isSavingSubscription, setIsSavingSubscription] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Confirmation Modal States
  const [targetUser, setTargetUser] = useState<AdminUserSummary | null>(null);
  const [modalAction, setModalAction] = useState<"ADMIN" | "LIFETIME_PRO" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Close popover on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverUserId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPopoverUserId(null);
      }
    }

    if (popoverUserId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popoverUserId]);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.plan.toLowerCase().includes(q)
    );
  });

  // Default fallback plans if dynamic plans array is empty
  const planTiers: PlanDefinition[] = availablePlans.length > 0
    ? availablePlans
    : [
        {
          id: "FREE",
          name: "Free",
          tagline: "Essential starter suite",
          priceKesMonthly: 0,
          priceKesAnnually: 0,
          annualDiscountPercent: 0,
          maxMembers: 1,
          maxLocations: 1,
          canTransferStock: false,
          hasGeneralLedger: false,
          hasReconciliation: false,
          hasStatutoryPayroll: false,
          hasApiAccess: false,
          features: ["1 Team Member", "1 Stock Location"],
        },
        {
          id: "BASIC",
          name: "Basic",
          tagline: "Growing small business",
          priceKesMonthly: 1200,
          priceKesAnnually: 11500,
          annualDiscountPercent: 20,
          maxMembers: 3,
          maxLocations: 2,
          canTransferStock: true,
          hasGeneralLedger: false,
          hasReconciliation: false,
          hasStatutoryPayroll: false,
          hasApiAccess: false,
          features: ["3 Team Members", "2 Stock Locations", "Stock Transfers"],
        },
        {
          id: "PRO",
          name: "Professional",
          tagline: "Full Financial & Inventory Suite",
          priceKesMonthly: 3500,
          priceKesAnnually: 33600,
          annualDiscountPercent: 20,
          maxMembers: 10,
          maxLocations: 5,
          canTransferStock: true,
          hasGeneralLedger: true,
          hasReconciliation: true,
          hasStatutoryPayroll: true,
          hasApiAccess: false,
          badge: "Most Popular",
          isHighlighted: true,
          features: ["10 Team Members", "5 Stock Locations", "Full General Ledger", "Statutory Payroll"],
        },
        {
          id: "ENTERPRISE",
          name: "Enterprise",
          tagline: "Multi-branch retail & commercial",
          priceKesMonthly: 8500,
          priceKesAnnually: 81600,
          annualDiscountPercent: 20,
          maxMembers: Infinity,
          maxLocations: Infinity,
          canTransferStock: true,
          hasGeneralLedger: true,
          hasReconciliation: true,
          hasStatutoryPayroll: true,
          hasApiAccess: true,
          badge: "Unlimited",
          features: ["Unlimited Members", "Unlimited Locations", "Dedicated Support", "Full API Access"],
        },
      ];

  function toggleUpgradePopover(user: AdminUserSummary) {
    if (popoverUserId === user.id) {
      setPopoverUserId(null);
    } else {
      setPopoverUserId(user.id);
      setSelectedPlanId(user.plan || "FREE");
      setIsLifetimeSelection(user.isLifetimePro || false);
      setSelectedMonths(1);
    }
  }

  async function handleApplyUpgrade(user: AdminUserSummary) {
    setIsSavingSubscription(true);
    const toastId = toast.loading(`Updating subscription for ${user.email}...`);

    let expiryDate: Date | null = null;
    if (!isLifetimeSelection && selectedPlanId !== "FREE") {
      const d = new Date();
      d.setDate(d.getDate() + selectedMonths * 30);
      expiryDate = d;
    }

    const res = await updateUserSubscriptionAction({
      userId: user.id,
      plan: isLifetimeSelection ? "PRO" : selectedPlanId,
      isLifetimePro: isLifetimeSelection,
      subscriptionExpiresAt: expiryDate,
    });

    setIsSavingSubscription(false);

    if (res.success) {
      toast.success(res.message || "User subscription updated!", { id: toastId });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                plan: isLifetimeSelection ? "PRO" : selectedPlanId,
                isLifetimePro: isLifetimeSelection,
                subscriptionExpiresAt: expiryDate,
              }
            : item
        )
      );
      setPopoverUserId(null);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update subscription.", { id: toastId });
    }
  }

  async function handleConfirmModalAction() {
    if (!targetUser || !modalAction) return;

    setIsProcessing(true);
    const toastId = toast.loading("Updating account permissions...");

    if (modalAction === "LIFETIME_PRO") {
      const nextState = !targetUser.isLifetimePro;
      const res = await toggleUserLifetimeProAction({
        userId: targetUser.id,
        isLifetimePro: nextState,
      });

      setIsProcessing(false);
      setTargetUser(null);
      setModalAction(null);

      if (!res.success) {
        toast.error(res.error || "Failed to update Lifetime PRO status.", { id: toastId });
      } else {
        toast.success(res.message || "Lifetime PRO updated!", { id: toastId });
        setUsers((prev) =>
          prev.map((item) =>
            item.id === targetUser.id
              ? { ...item, isLifetimePro: nextState, plan: nextState ? "PRO" : "FREE" }
              : item
          )
        );
        router.refresh();
      }
    } else if (modalAction === "ADMIN") {
      const nextState = !targetUser.isSuperAdmin;
      const res = await toggleSuperAdminAction({
        userId: targetUser.id,
        isSuperAdmin: nextState,
      });

      setIsProcessing(false);
      setTargetUser(null);
      setModalAction(null);

      if (!res.success) {
        toast.error(res.error || "Failed to update admin role.", { id: toastId });
      } else {
        toast.success(res.message || "User role updated!", { id: toastId });
        setUsers((prev) =>
          prev.map((item) =>
            item.id === targetUser.id ? { ...item, isSuperAdmin: nextState } : item
          )
        );
        router.refresh();
      }
    }
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
            <Link href="/admin" className="hover:text-black underline">
              Admin Terminal
            </Link>
            <span>/</span>
            <span>Platform User Directory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-0.5">
            Platform Users ({users.length})
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Grant any subscription plan tier, duration upgrades, or Lifetime PRO access to user accounts. All workspaces created by a user operate under their user tier.
          </p>
        </div>
      </div>

      {/* SEARCH CONTROLS */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user name, email, or plan..."
          className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:border-black placeholder:text-zinc-400"
        />
        <span className="absolute left-3 top-2.5 text-zinc-400 text-xs">🔍</span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-2 text-zinc-400 hover:text-black text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* USERS TABLE */}
      <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">User Account</th>
                <th className="py-3 px-4">Subscription Tier</th>
                <th className="py-3 px-4">Owned Workspaces</th>
                <th className="py-3 px-4">Member Of</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Account Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-mono text-xs">
                    No user accounts match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isLifetime = u.isLifetimePro || u.isSuperAdmin;
                  const isPopoverOpen = popoverUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors relative">
                      
                      {/* NAME & EMAIL */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="space-y-0.5">
                          <div className="font-bold text-black text-sm">{u.name}</div>
                          <div className="font-mono text-[10px] text-zinc-500">{u.email}</div>
                        </div>
                      </td>

                      {/* USER SUBSCRIPTION TIER & BADGES */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {u.isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md shadow-2xs tracking-wider">
                              <span>👑</span>
                              <span>SUPER ADMIN (ROOT)</span>
                            </span>
                          ) : u.isLifetimePro ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-950 border border-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md shadow-2xs tracking-wider">
                              <span>⭐</span>
                              <span>LIFETIME PRO</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase border tracking-wider ${
                                  u.plan === "ENTERPRISE"
                                    ? "bg-purple-50 text-purple-900 border-purple-300"
                                    : u.plan === "PRO"
                                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                                    : u.plan === "BASIC"
                                    ? "bg-blue-50 text-blue-900 border-blue-200"
                                    : "bg-zinc-100 text-zinc-700 border-zinc-200"
                                }`}
                              >
                                {u.plan || "FREE"}
                              </span>
                              {u.subscriptionExpiresAt && (
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  Exp: {new Date(u.subscriptionExpiresAt).toLocaleDateString("en-KE")}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* OWNED WORKSPACES */}
                      <td className="py-3.5 px-4">
                        {u.ownedShops.length === 0 ? (
                          <span className="text-zinc-400 text-[10px]">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {u.ownedShops.map((s) => (
                              <Link
                                key={s.id}
                                href={`/admin/workspaces/${s.id}`}
                                className="bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 border border-zinc-200 text-black px-2 py-0.5 rounded-md text-[10px] font-sans no-underline font-semibold transition-colors"
                              >
                                {s.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* MEMBERSHIP COUNT */}
                      <td className="py-3.5 px-4 font-mono text-zinc-600 text-xs">
                        {u.membershipsCount} workspace{u.membershipsCount !== 1 ? "s" : ""}
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-[10px]">
                        {new Date(u.createdAt).toLocaleDateString("en-KE")}
                      </td>

                      {/* GOVERNANCE ACTIONS (POPOVER TRIGGER & BUTTONS) */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          
                          {/* POPOVER TRIGGER BUTTON */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => toggleUpgradePopover(u)}
                              className={`inline-flex items-center gap-1.5 h-7.5 px-3 rounded-lg font-mono text-[11px] font-bold uppercase transition-all shadow-2xs cursor-pointer ${
                                isPopoverOpen
                                  ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-400/40"
                                  : "bg-zinc-900 hover:bg-black text-white hover:scale-[1.02] active:scale-95"
                              }`}
                            >
                              <span className={isPopoverOpen ? "text-white" : "text-amber-400"}>⚡</span>
                              <span>Upgrade Tier</span>
                              <span className="text-[9px] opacity-70">▾</span>
                            </button>

                            {/* UPGRADE POPOVER FLYOUT */}
                            {isPopoverOpen && (
                              <div
                                ref={popoverRef}
                                className="absolute right-0 top-full mt-2 w-88 sm:w-96 bg-white border border-zinc-300/80 rounded-2xl shadow-2xl p-5 space-y-4 z-50 text-left animate-in fade-in zoom-in-95 font-sans"
                              >
                                {/* POPOVER HEADER */}
                                <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                                  <div>
                                    <span className="font-mono text-[9px] text-zinc-400 uppercase font-bold tracking-widest block">
                                      Grant Plan &amp; Upgrades
                                    </span>
                                    <div className="font-bold text-black text-sm mt-0.5">{u.name}</div>
                                    <div className="font-mono text-[10px] text-zinc-500">{u.email}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPopoverUserId(null)}
                                    className="text-zinc-400 hover:text-black p-1 text-xs font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>

                                {/* PLAN TIER PICKER */}
                                <div className="space-y-2">
                                  <label className="font-mono text-[10px] font-bold text-zinc-700 uppercase tracking-wider block">
                                    1. Choose Plan Tier
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {planTiers.map((p) => {
                                      const isSelected = selectedPlanId === p.id && !isLifetimeSelection;
                                      return (
                                        <button
                                          key={p.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedPlanId(p.id);
                                            setIsLifetimeSelection(false);
                                          }}
                                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                            isSelected
                                              ? "border-black bg-zinc-900 text-white shadow-xs"
                                              : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
                                          }`}
                                        >
                                          <div className="flex justify-between items-center">
                                            <span className="font-mono text-xs font-black uppercase">{p.name}</span>
                                            {p.badge && (
                                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                                isSelected ? "bg-amber-400 text-black" : "bg-zinc-200 text-zinc-700"
                                              }`}>
                                                {p.badge}
                                              </span>
                                            )}
                                          </div>
                                          <div className={`font-mono text-[10px] mt-0.5 ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                                            {p.priceKesMonthly === 0 ? "Free" : `${formatCurrency(p.priceKesMonthly, "KES")}/mo`}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* LIFETIME TOGGLE */}
                                <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isLifetimeSelection}
                                      onChange={(e) => {
                                        setIsLifetimeSelection(e.target.checked);
                                        if (e.target.checked) setSelectedPlanId("PRO");
                                      }}
                                      className="w-4 h-4 accent-amber-600 rounded"
                                    />
                                    <div>
                                      <span className="text-amber-950 font-bold text-xs font-mono block">
                                        ⭐ Grant Lifetime Access (VIP)
                                      </span>
                                      <span className="text-[10px] text-amber-800 font-sans leading-tight block">
                                        Permanent unlimited capacity with zero subscription expiration.
                                      </span>
                                    </div>
                                  </label>
                                </div>

                                {/* DURATION SELECTION (IF NOT LIFETIME OR FREE) */}
                                {!isLifetimeSelection && selectedPlanId !== "FREE" && (
                                  <div className="space-y-2">
                                    <label className="font-mono text-[10px] font-bold text-zinc-700 uppercase tracking-wider block">
                                      2. Grant Duration
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] font-bold">
                                      {[
                                        { months: 1, label: "1 Mo" },
                                        { months: 3, label: "3 Mo" },
                                        { months: 6, label: "6 Mo" },
                                        { months: 12, label: "1 Year" },
                                      ].map((d) => (
                                        <button
                                          key={d.months}
                                          type="button"
                                          onClick={() => setSelectedMonths(d.months)}
                                          className={`py-1.5 rounded-lg border transition-all cursor-pointer text-center ${
                                            selectedMonths === d.months
                                              ? "bg-black text-white border-black font-black"
                                              : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
                                          }`}
                                        >
                                          {d.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* PREVIEW EXPIRATION */}
                                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg font-mono text-[10px] text-zinc-600 flex justify-between items-center">
                                  <span className="text-zinc-500">Effective Expiry:</span>
                                  <span className="font-bold text-black">
                                    {isLifetimeSelection
                                      ? "Never (Lifetime ∞)"
                                      : selectedPlanId === "FREE"
                                      ? "Standard Free Tier"
                                      : `${new Date(Date.now() + selectedMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-KE")} (+${selectedMonths} mo)`}
                                  </span>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
                                  <button
                                    type="button"
                                    onClick={() => setPopoverUserId(null)}
                                    className="px-3.5 py-1.5 border border-zinc-200 hover:bg-zinc-100 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyUpgrade(u)}
                                    disabled={isSavingSubscription}
                                    className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-mono font-bold uppercase shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    {isSavingSubscription && (
                                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    )}
                                    <span>Apply Upgrade</span>
                                  </button>
                                </div>

                              </div>
                            )}
                          </div>

                          {/* QUICK TOGGLE LIFETIME PRO BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUser(u);
                              setModalAction("LIFETIME_PRO");
                            }}
                            className={`inline-flex items-center gap-1.5 h-7.5 px-3 rounded-lg font-mono text-[11px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                              u.isLifetimePro
                                ? "bg-amber-100 text-amber-950 border border-amber-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                                : "bg-white border border-amber-300/80 text-amber-900 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-2xs"
                            }`}
                          >
                            <span>👑</span>
                            <span>{u.isLifetimePro ? "Revoke VIP" : "Lifetime"}</span>
                          </button>

                          {/* TOGGLE SUPER ADMIN BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUser(u);
                              setModalAction("ADMIN");
                            }}
                            className={`inline-flex items-center h-7.5 px-2.5 rounded-lg font-mono text-[11px] font-semibold transition-all border whitespace-nowrap cursor-pointer ${
                              u.isSuperAdmin
                                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600"
                                : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-black hover:bg-zinc-50"
                            }`}
                            title={u.isSuperAdmin ? "Revoke Super Admin Rights" : "Elevate to Super Admin"}
                          >
                            {u.isSuperAdmin ? "Revoke Admin" : "Make Admin"}
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(targetUser && modalAction)}
        onClose={() => {
          setTargetUser(null);
          setModalAction(null);
        }}
        onConfirm={handleConfirmModalAction}
        title={
          modalAction === "LIFETIME_PRO"
            ? targetUser?.isLifetimePro
              ? `Revoke Lifetime PRO from ${targetUser?.email}?`
              : `Grant Lifetime PRO to ${targetUser?.email}?`
            : targetUser?.isSuperAdmin
            ? `Revoke Super Admin Rights from ${targetUser?.email}?`
            : `Elevate ${targetUser?.email} to Super Admin (ROOT)?`
        }
        message={
          modalAction === "LIFETIME_PRO"
            ? targetUser?.isLifetimePro
              ? `This will remove Lifetime PRO inheritance from this user account and revert their workspaces to normal billing limits.`
              : `This will grant permanent Lifetime PRO to ${targetUser?.email}. All current and future workspaces created or owned by this account will automatically inherit unlimited team members, unlimited stock locations, and full General Ledger access with NO expiration dates.`
            : targetUser?.isSuperAdmin
            ? `Are you sure you want to revoke administrative ROOT access for this account?`
            : `This user will receive full ROOT access to the administrative terminal (/admin), including all merchant workspaces, telemetry, and platform configurations.`
        }
        confirmLabel={
          modalAction === "LIFETIME_PRO"
            ? targetUser?.isLifetimePro ? "Revoke Lifetime" : "Grant Lifetime PRO"
            : targetUser?.isSuperAdmin ? "Revoke Admin" : "Elevate to ROOT"
        }
        variant={
          (modalAction === "LIFETIME_PRO" && targetUser?.isLifetimePro) || (modalAction === "ADMIN" && targetUser?.isSuperAdmin)
            ? "danger"
            : "primary"
        }
        isLoading={isProcessing}
      />

    </div>
  );
}
