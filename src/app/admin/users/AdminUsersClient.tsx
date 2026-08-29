"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleSuperAdminAction, toggleUserLifetimeProAction, updateUserSubscriptionAction } from "@/lib/actions/admin";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";

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
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>(initialUsers);

  // Change Plan Modal State
  const [planEditingUser, setPlanEditingUser] = useState<AdminUserSummary | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("FREE");
  const [isPlanLifetime, setIsPlanLifetime] = useState<boolean>(false);
  const [expiryMonths, setExpiryMonths] = useState<number>(1);
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);

  // Confirmation Modal States
  const [targetUser, setTargetUser] = useState<AdminUserSummary | null>(null);
  const [modalAction, setModalAction] = useState<"ADMIN" | "LIFETIME_PRO" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.plan.toLowerCase().includes(q)
    );
  });

  function openPlanModal(user: AdminUserSummary) {
    setPlanEditingUser(user);
    setSelectedPlan(user.plan || "FREE");
    setIsPlanLifetime(user.isLifetimePro || false);
    setExpiryMonths(1);
  }

  async function handleSaveUserPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!planEditingUser) return;

    setIsSavingPlan(true);
    const toastId = toast.loading(`Updating subscription for ${planEditingUser.email}...`);

    let expiryDate: Date | null = null;
    if (!isPlanLifetime && selectedPlan !== "FREE") {
      const d = new Date();
      d.setDate(d.getDate() + expiryMonths * 30);
      expiryDate = d;
    }

    const res = await updateUserSubscriptionAction({
      userId: planEditingUser.id,
      plan: isPlanLifetime ? "PRO" : selectedPlan,
      isLifetimePro: isPlanLifetime,
      subscriptionExpiresAt: expiryDate,
    });

    setIsSavingPlan(false);

    if (res.success) {
      toast.success(res.message || "User subscription updated!", { id: toastId });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === planEditingUser.id
            ? {
                ...item,
                plan: isPlanLifetime ? "PRO" : selectedPlan,
                isLifetimePro: isPlanLifetime,
                subscriptionExpiresAt: expiryDate,
              }
            : item
        )
      );
      setPlanEditingUser(null);
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
            Manage user subscriptions, plan tiers, and Lifetime PRO privileges. All workspaces created by a user operate under their user subscription tier.
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
      <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
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
                  const displayPlan = isLifetime ? "LIFETIME PRO" : u.plan.toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                      
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
                          {u.isSuperAdmin && (
                            <span className="inline-flex items-center gap-1 bg-black text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs">
                              <span>👑</span>
                              <span>SUPER ADMIN (ROOT)</span>
                            </span>
                          )}

                          {u.isLifetimePro && !u.isSuperAdmin && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs">
                              <span>⭐</span>
                              <span>LIFETIME PRO USER</span>
                            </span>
                          )}

                          {!isLifetime && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                  u.plan === "ENTERPRISE"
                                    ? "bg-purple-100 text-purple-900 border border-purple-300"
                                    : u.plan === "PRO"
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : u.plan === "BASIC"
                                    ? "bg-blue-100 text-blue-900 border border-blue-300"
                                    : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                                }`}
                              >
                                {u.plan || "FREE"}
                              </span>
                              {u.subscriptionExpiresAt && (
                                <span className="text-[9px] text-zinc-400 font-mono">
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
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {u.ownedShops.map((s) => (
                              <Link
                                key={s.id}
                                href={`/admin/workspaces/${s.id}`}
                                className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-black px-1.5 py-0.5 rounded text-[10px] font-sans no-underline font-semibold"
                              >
                                {s.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* MEMBERSHIP COUNT */}
                      <td className="py-3.5 px-4 font-mono text-zinc-600">
                        {u.membershipsCount} workspace{u.membershipsCount !== 1 ? "s" : ""}
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-[10px]">
                        {new Date(u.createdAt).toLocaleDateString("en-KE")}
                      </td>

                      {/* GOVERNANCE ACTIONS */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* UPGRADE / CHANGE PLAN BUTTON */}
                          <button
                            type="button"
                            onClick={() => openPlanModal(u)}
                            className="bg-black hover:bg-zinc-800 text-white font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 rounded transition-colors shadow-2xs cursor-pointer"
                          >
                            ⚡ Upgrade Plan
                          </button>

                          {/* TOGGLE LIFETIME PRO BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUser(u);
                              setModalAction("LIFETIME_PRO");
                            }}
                            className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                              u.isLifetimePro
                                ? "bg-amber-100 text-amber-900 border border-amber-400 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                                : "bg-amber-500 hover:bg-amber-600 text-white shadow-2xs"
                            }`}
                          >
                            {u.isLifetimePro ? "Revoke Lifetime" : "👑 Lifetime"}
                          </button>

                          {/* TOGGLE SUPER ADMIN BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUser(u);
                              setModalAction("ADMIN");
                            }}
                            className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                              u.isSuperAdmin
                                ? "bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-600 hover:text-white"
                                : "border border-zinc-300 hover:border-black text-zinc-700 hover:text-black"
                            }`}
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

      {/* PLAN UPGRADE MODAL */}
      {planEditingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 font-sans">
            <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
              <div>
                <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                  User Subscription Governance
                </span>
                <h3 className="text-lg font-black text-black uppercase">
                  Upgrade {planEditingUser.name}
                </h3>
                <span className="text-xs text-zinc-500 font-mono">{planEditingUser.email}</span>
              </div>
              <button
                type="button"
                onClick={() => setPlanEditingUser(null)}
                className="text-zinc-400 hover:text-black font-bold p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserPlan} className="space-y-4 font-mono text-xs">
              
              {/* SELECT PLAN TIER */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-700 uppercase block">Select Plan Tier</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  disabled={isPlanLifetime}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black bg-white"
                >
                  <option value="FREE">FREE - Base Quota (1 User, 1 Branch)</option>
                  <option value="BASIC">BASIC - Growing Small Business</option>
                  <option value="PRO">PRO - Full General Ledger &amp; Transfers</option>
                  <option value="ENTERPRISE">ENTERPRISE - Unlimited Capacity</option>
                </select>
              </div>

              {/* LIFETIME PRO TOGGLE */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPlanLifetime}
                    onChange={(e) => setIsPlanLifetime(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span className="text-amber-950 font-bold text-xs">⭐ Grant Lifetime PRO (No Expiry)</span>
                </label>
                <p className="text-[10px] text-amber-700 font-sans leading-tight pl-6">
                  Permanently exempts this user and all their current &amp; future workspaces from billing.
                </p>
              </div>

              {/* DURATION (IF NOT LIFETIME OR FREE) */}
              {!isPlanLifetime && selectedPlan !== "FREE" && (
                <div className="space-y-1.5 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">Subscription Duration</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExpiryMonths(1)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold ${
                        expiryMonths === 1 ? "bg-black text-white border-black" : "bg-white text-zinc-700 border-zinc-300"
                      }`}
                    >
                      1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiryMonths(3)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold ${
                        expiryMonths === 3 ? "bg-black text-white border-black" : "bg-white text-zinc-700 border-zinc-300"
                      }`}
                    >
                      3 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiryMonths(12)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold ${
                        expiryMonths === 12 ? "bg-black text-white border-black" : "bg-white text-zinc-700 border-zinc-300"
                      }`}
                    >
                      1 Year (Annual)
                    </button>
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTONS */}
              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPlanEditingUser(null)}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-100 font-bold uppercase text-[11px] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="bg-black hover:bg-zinc-800 text-white font-bold uppercase text-[11px] px-5 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingPlan && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Apply Subscription</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
