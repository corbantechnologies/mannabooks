"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { updateWorkspacePlanAction, toggleWorkspaceSuspensionAction } from "@/lib/actions/admin";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface WorkspaceSummary {
  id: string;
  name: string;
  shortName?: string | null;
  slug: string;
  taxPin?: string | null;
  currency: string;
  phone?: string | null;
  email?: string | null;
  isVatRegistered: boolean;
  plan: string;
  subscriptionStatus: string;
  isLifetimePro: boolean;
  isSuspended: boolean;
  suspendedReason?: string | null;
  createdAt: string | Date;
  owner: {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
  } | null;
  memberCount: number;
  documentCount: number;
  turnover: number;
}

interface AdminWorkspacesClientProps {
  initialWorkspaces: WorkspaceSummary[];
  totalCount: number;
}

export function AdminWorkspacesClient({ initialWorkspaces, totalCount }: AdminWorkspacesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(initialWorkspaces);

  // Plan Edit Modal State
  const [editingShop, setEditingShop] = useState<WorkspaceSummary | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("PRO");
  const [isLifetimePro, setIsLifetimePro] = useState<boolean>(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<boolean>(false);

  // Suspension Modal State
  const [suspendingShop, setSuspendingShop] = useState<WorkspaceSummary | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>("");
  const [isTogglingSuspend, setIsTogglingSuspend] = useState<boolean>(false);

  // Filter workspaces in-memory for instant feedback
  const filtered = workspaces.filter((w) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        w.name.toLowerCase().includes(q) ||
        w.slug.toLowerCase().includes(q) ||
        (w.taxPin && w.taxPin.toLowerCase().includes(q)) ||
        (w.owner && w.owner.email.toLowerCase().includes(q)) ||
        (w.owner && w.owner.name.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (planFilter === "LIFETIME_PRO") return w.isLifetimePro;
    if (planFilter === "SUSPENDED") return w.isSuspended;
    if (planFilter !== "ALL") return w.plan.toUpperCase() === planFilter.toUpperCase();

    return true;
  });

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editingShop) return;

    setIsUpdatingPlan(true);
    const toastId = toast.loading("Updating tenant plan tier...");

    const res = await updateWorkspacePlanAction({
      shopId: editingShop.id,
      plan: selectedPlan,
      isLifetimePro,
      subscriptionStatus: isLifetimePro ? "LIFETIME_FREE" : "ACTIVE",
    });

    setIsUpdatingPlan(false);
    if (!res.success) {
      toast.error(res.error || "Failed to update plan.", { id: toastId });
    } else {
      toast.success(res.message || "Plan updated successfully!", { id: toastId });
      setWorkspaces((prev) =>
        prev.map((item) =>
          item.id === editingShop.id
            ? {
                ...item,
                plan: selectedPlan,
                isLifetimePro,
                subscriptionStatus: isLifetimePro ? "LIFETIME_FREE" : "ACTIVE",
              }
            : item
        )
      );
      setEditingShop(null);
      router.refresh();
    }
  }

  async function handleToggleSuspension(e: React.FormEvent) {
    e.preventDefault();
    if (!suspendingShop) return;

    const newSuspendedState = !suspendingShop.isSuspended;
    setIsTogglingSuspend(true);
    const toastId = toast.loading(newSuspendedState ? "Suspending workspace..." : "Restoring workspace...");

    const res = await toggleWorkspaceSuspensionAction({
      shopId: suspendingShop.id,
      isSuspended: newSuspendedState,
      reason: newSuspendedState ? suspendReason : undefined,
    });

    setIsTogglingSuspend(false);
    if (!res.success) {
      toast.error(res.error || "Failed to update status.", { id: toastId });
    } else {
      toast.success(res.message || "Workspace status updated!", { id: toastId });
      setWorkspaces((prev) =>
        prev.map((item) =>
          item.id === suspendingShop.id
            ? {
                ...item,
                isSuspended: newSuspendedState,
                suspendedReason: newSuspendedState ? suspendReason : null,
              }
            : item
        )
      );
      setSuspendingShop(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
            TENANT GOVERNANCE // MULTI-TENANT DIRECTORY
          </span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-0.5">
            Tenant Workspaces ({totalCount})
          </h2>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop name, slug, PIN, owner email..."
            className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:border-black placeholder:text-zinc-400"
          />
          <span className="absolute left-3 top-2.5 text-zinc-400 text-xs">🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2 text-zinc-400 hover:text-black text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* PLAN FILTER TABS */}
        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-[11px] font-mono font-semibold">
          {[
            { key: "ALL", label: "All" },
            { key: "LIFETIME_PRO", label: "👑 Lifetime PRO" },
            { key: "PRO", label: "Pro" },
            { key: "STARTER", label: "Starter" },
            { key: "FREE", label: "Free" },
            { key: "SUSPENDED", label: "🔒 Suspended" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPlanFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                planFilter === tab.key
                  ? "bg-black text-white shadow-xs font-bold"
                  : "text-zinc-600 hover:text-black hover:bg-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TENANT WORKSPACES TABLE */}
      <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Business Tenant</th>
                <th className="py-3 px-4">Owner &amp; Team</th>
                <th className="py-3 px-4">Tax PIN &amp; eTIMS</th>
                <th className="py-3 px-4 text-center">Docs</th>
                <th className="py-3 px-4 text-right">Turnover</th>
                <th className="py-3 px-4 text-center">Plan Tier</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-mono text-xs">
                    No tenant workspaces match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((shop) => (
                  <tr key={shop.id} className="hover:bg-zinc-50/80 transition-colors">
                    
                    {/* SHOP NAME & SLUG */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-black text-sm">{shop.name}</span>
                          {shop.isSuspended && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                              Suspended
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 flex items-center gap-2">
                          <span>/{shop.slug}</span>
                          <span>•</span>
                          <span>Est. {new Date(shop.createdAt).toLocaleDateString("en-KE")}</span>
                        </div>
                      </div>
                    </td>

                    {/* OWNER & TEAM */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-black truncate max-w-[180px]">
                          {shop.owner?.name || "System Owner"}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[180px]">
                          {shop.owner?.email || "—"}
                        </div>
                        <div className="text-[9px] text-zinc-400">
                          {shop.memberCount} team member{shop.memberCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </td>

                    {/* TAX PIN & VAT */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="space-y-0.5">
                        <div className="font-bold text-zinc-800">
                          {shop.taxPin || "NO PIN"}
                        </div>
                        <div className="text-[9px] text-zinc-400 uppercase">
                          {shop.isVatRegistered ? "16% VAT Registered" : "Non-VAT"}
                        </div>
                      </div>
                    </td>

                    {/* DOCUMENT COUNT */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-700">
                      {shop.documentCount}
                    </td>

                    {/* TURNOVER */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-900">
                      {formatCurrency(shop.turnover, shop.currency)}
                    </td>

                    {/* PLAN TIER BADGE */}
                    <td className="py-3.5 px-4 text-center">
                      {shop.isLifetimePro ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-mono font-black text-[10px] px-2 py-0.5 rounded shadow-2xs">
                          <span>👑</span>
                          <span>LIFETIME PRO</span>
                        </span>
                      ) : (
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase border ${
                            shop.plan === "PRO" || shop.plan === "ENTERPRISE"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : shop.plan === "STARTER"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {shop.plan}
                        </span>
                      )}
                    </td>

                    {/* ADMIN ACTIONS */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end items-center gap-1.5 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingShop(shop);
                            setSelectedPlan(shop.plan || "FREE");
                            setIsLifetimePro(shop.isLifetimePro || false);
                          }}
                          className="bg-zinc-100 hover:bg-black hover:text-white border border-zinc-300 px-2.5 py-1 rounded transition-colors font-bold uppercase"
                          title="Manage Plan & Lifetime PRO"
                        >
                          Plan
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSuspendingShop(shop);
                            setSuspendReason(shop.suspendedReason || "");
                          }}
                          className={`border px-2 py-1 rounded transition-colors font-bold uppercase ${
                            shop.isSuspended
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-600 hover:text-white"
                              : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-600 hover:text-white"
                          }`}
                          title={shop.isSuspended ? "Activate Shop" : "Suspend Shop"}
                        >
                          {shop.isSuspended ? "Activate" : "Lock"}
                        </button>

                        <Link
                          href={`/admin/workspaces/${shop.id}`}
                          className="bg-white hover:bg-zinc-100 border border-zinc-300 px-2.5 py-1 rounded transition-colors font-bold uppercase no-underline text-black"
                          title="Deep Inspection"
                        >
                          Inspect
                        </Link>

                        <Link
                          href={`/workspaces/${shop.slug}`}
                          target="_blank"
                          className="bg-zinc-900 hover:bg-black text-white px-2.5 py-1 rounded transition-colors font-bold uppercase no-underline flex items-center gap-1"
                          title="Open workspace in new tab as support"
                        >
                          <span>🚀</span>
                          <span>Access</span>
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PLAN & LIFETIME PRO MODAL */}
      {editingShop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 font-sans text-xs">
            
            <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
              <div>
                <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold">Plan Management</span>
                <h3 className="text-base font-bold text-black uppercase">{editingShop.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingShop(null)}
                className="text-zinc-400 hover:text-black font-bold p-1 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 font-mono text-xs">
              
              {/* LIFETIME PRO TOGGLE */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLifetimePro}
                    onChange={(e) => {
                      setIsLifetimePro(e.target.checked);
                      if (e.target.checked) setSelectedPlan("PRO");
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-amber-900 block font-sans">
                      👑 Grant Full Lifetime PRO (Whitelist Exemption)
                    </span>
                    <p className="text-[10px] text-amber-800 leading-tight font-mono mt-0.5">
                      Permanently activates all PRO features for this shop. Exempt from subscription billing cycles (ideal for Corban Technologies / internal owner entities).
                    </p>
                  </div>
                </label>
              </div>

              {/* PLAN SELECTION */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-700 uppercase block">
                  Subscription Tier
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  disabled={isLifetimePro}
                  className="w-full px-3 py-2 border border-zinc-300 rounded bg-white text-xs font-mono font-bold uppercase focus:outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  <option value="FREE">FREE TIER (Basic Invoicing Only)</option>
                  <option value="STARTER">STARTER TIER (Core Accounting &amp; POS)</option>
                  <option value="PRO">PRO TIER (Complete Accounting, GL, Multi-Location Stock)</option>
                  <option value="ENTERPRISE">ENTERPRISE TIER (Unlimited Team &amp; High Volume)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="px-3.5 py-2 border border-zinc-300 hover:bg-zinc-100 font-bold uppercase text-[11px] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPlan}
                  className="bg-black hover:bg-zinc-800 text-white font-bold uppercase text-[11px] px-4 py-2 rounded shadow-sm disabled:opacity-50"
                >
                  {isUpdatingPlan ? "Saving..." : "Save Plan Tier"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* SUSPENSION MODAL */}
      {suspendingShop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 font-sans text-xs">
            
            <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
              <div>
                <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                  {suspendingShop.isSuspended ? "Re-activate Workspace" : "Administrative Lockout"}
                </span>
                <h3 className="text-base font-bold text-black uppercase">{suspendingShop.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSuspendingShop(null)}
                className="text-zinc-400 hover:text-black font-bold p-1 text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleToggleSuspension} className="space-y-4 font-mono text-xs">
              
              {!suspendingShop.isSuspended ? (
                <div className="space-y-2">
                  <p className="text-zinc-600 font-sans text-xs leading-relaxed">
                    Suspending this workspace will immediately block all members from accessing the dashboard, POS terminal, and creating documents.
                  </p>
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block pt-1">
                    Lockout Reason
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="e.g. Delinquent billing, suspicious transaction activity, owner request..."
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-300 rounded bg-white text-xs font-mono focus:outline-none focus:border-black"
                    required
                  />
                </div>
              ) : (
                <p className="text-zinc-600 font-sans text-xs leading-relaxed">
                  Are you sure you want to lift the administrative suspension for <strong>{suspendingShop.name}</strong>? Members will regain immediate access.
                </p>
              )}

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendingShop(null)}
                  className="px-3.5 py-2 border border-zinc-300 hover:bg-zinc-100 font-bold uppercase text-[11px] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTogglingSuspend}
                  className={`font-bold uppercase text-[11px] px-4 py-2 rounded shadow-sm text-white disabled:opacity-50 ${
                    suspendingShop.isSuspended ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isTogglingSuspend
                    ? "Updating..."
                    : suspendingShop.isSuspended
                    ? "✅ Re-activate Tenant"
                    : "🔒 Confirm Suspension"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
