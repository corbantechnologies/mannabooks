"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { updateWorkspacePlanAction, toggleWorkspaceSuspensionAction } from "@/lib/actions/admin";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AdminWorkspaceDetailClientProps {
  shop: any;
  docStats: any[];
  recentDocs: any[];
}

export function AdminWorkspaceDetailClient({ shop, docStats, recentDocs }: AdminWorkspaceDetailClientProps) {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>(shop.plan || "FREE");
  const [isLifetimePro, setIsLifetimePro] = useState<boolean>(shop.isLifetimePro || false);
  const [isSuspended, setIsSuspended] = useState<boolean>(shop.isSuspended || false);
  const [suspendedReason, setSuspendedReason] = useState<string>(shop.suspendedReason || "");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  async function handleSavePlan() {
    setIsUpdating(true);
    const toastId = toast.loading("Updating tenant subscription tier...");

    const res = await updateWorkspacePlanAction({
      shopId: shop.id,
      plan: currentPlan,
      isLifetimePro,
      subscriptionStatus: isLifetimePro ? "LIFETIME_FREE" : "ACTIVE",
    });

    setIsUpdating(false);
    if (!res.success) {
      toast.error(res.error || "Failed to update plan tier.", { id: toastId });
    } else {
      toast.success(res.message || "Plan updated!", { id: toastId });
      router.refresh();
    }
  }

  async function handleToggleSuspension() {
    const nextState = !isSuspended;
    setIsUpdating(true);
    const toastId = toast.loading(nextState ? "Suspending workspace..." : "Restoring access...");

    const res = await toggleWorkspaceSuspensionAction({
      shopId: shop.id,
      isSuspended: nextState,
      reason: nextState ? suspendedReason : undefined,
    });

    setIsUpdating(false);
    if (!res.success) {
      toast.error(res.error || "Failed to update status.", { id: toastId });
    } else {
      setIsSuspended(nextState);
      toast.success(res.message || "Status updated!", { id: toastId });
      router.refresh();
    }
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* TOP BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
            <Link href="/admin/workspaces" className="hover:text-black underline">
              Workspaces Directory
            </Link>
            <span>/</span>
            <span>{shop.slug}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              {shop.name}
            </h2>
            {isLifetimePro && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                👑 LIFETIME PRO
              </span>
            )}
            {isSuspended && (
              <span className="bg-rose-100 text-rose-900 border border-rose-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                🔒 SUSPENDED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Link
            href={`/workspaces/${shop.slug}`}
            target="_blank"
            className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold uppercase shadow-sm flex items-center gap-1.5 no-underline"
          >
            <span>🚀</span>
            <span>Access Workspace</span>
          </Link>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: METADATA + GOVERNANCE CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLUMNS: METADATA, TEAM & STATS */}
        <div className="lg:col-span-2 space-y-6 font-mono text-xs">
          
          {/* BUSINESS ATTRIBUTES CARD */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">
              🏢 Business Profile Metadata
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Trading Alias</span>
                <span className="font-bold text-black">{shop.shortName || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Workspace Slug</span>
                <span className="font-bold text-black font-mono">/{shop.slug}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Tax PIN</span>
                <span className="font-bold text-black">{shop.taxPin || "NOT_PROVIDED"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">VAT Regime</span>
                <span className="font-bold text-black">{shop.isVatRegistered ? "16% Standard VAT" : "Non-VAT"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Base Currency</span>
                <span className="font-bold text-black">{shop.currency || "KES"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Created Date</span>
                <span className="font-bold text-black">{new Date(shop.createdAt).toLocaleDateString("en-KE")}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Business Email</span>
                <span className="font-bold text-black truncate block">{shop.email || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Business Phone</span>
                <span className="font-bold text-black">{shop.phone || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">General Ledger</span>
                <span className={`font-bold ${shop.isGlEnabled ? "text-emerald-700" : "text-zinc-500"}`}>
                  {shop.isGlEnabled ? "ACTIVE" : "DISABLED"}
                </span>
              </div>
            </div>
          </div>

          {/* TEAM MEMBERS CARD */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">
              👥 Authorized Team Members ({shop.members?.length || 1})
            </h3>

            <div className="divide-y divide-zinc-100">
              {/* Owner Item */}
              {shop.owner && (
                <div className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black font-sans">{shop.owner.name}</span>
                      <span className="bg-black text-white text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                        OWNER
                      </span>
                      {shop.owner.isSuperAdmin && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                          SUPER ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500">{shop.owner.email}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold">Primary Tenant Owner</span>
                </div>
              )}

              {/* Members */}
              {shop.members?.map((m: any) => {
                if (m.userId === shop.ownerId) return null;
                return (
                  <div key={m.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black font-sans">{m.user?.name || "Member"}</span>
                        <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                          {m.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{m.user?.email}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      Added {new Date(m.createdAt).toLocaleDateString("en-KE")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DOCUMENT METRICS BREAKDOWN */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">
              📜 Document Breakdown by Type
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {docStats.map((stat: any) => (
                <div key={stat.type} className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">{stat.type}</span>
                  <div className="text-lg font-black text-black">{stat.count}</div>
                  <span className="text-[10px] text-emerald-800 font-bold block truncate">
                    {formatCurrency(stat.totalAmount, shop.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT 10 DOCUMENTS */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">
              ⚡ Recent Document Activity
            </h3>

            <div className="divide-y divide-zinc-100">
              {recentDocs.map((doc: any) => (
                <div key={doc.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">{doc.docNumber}</span>
                      <span className="text-[9px] bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded font-bold uppercase">
                        {doc.type}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-zinc-500">
                        {doc.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {doc.client?.name || doc.supplier?.name || "Walk-in Customer"} • {new Date(doc.issueDate).toLocaleDateString("en-KE")}
                    </span>
                  </div>
                  <span className="font-bold text-black">
                    {formatCurrency(doc.grandTotal, shop.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ADMINISTRATIVE & PLAN GOVERNANCE */}
        <div className="space-y-6 font-mono text-xs">
          
          {/* PLAN MANAGEMENT BOX */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-5">
            <h3 className="font-bold text-xs uppercase text-black tracking-wider border-b border-zinc-100 pb-3">
              👑 Plan &amp; Subscription Controls
            </h3>

            {/* LIFETIME PRO WHITELIST TOGGLE */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLifetimePro}
                  onChange={(e) => {
                    setIsLifetimePro(e.target.checked);
                    if (e.target.checked) setCurrentPlan("PRO");
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-bold text-amber-900 block font-sans text-xs">
                    👑 Lifetime PRO (Whitelist)
                  </span>
                  <p className="text-[10px] text-amber-800 leading-tight font-mono mt-0.5">
                    Exempt from billing loops. Permanently unlocks all PRO modules (e.g. for Corban Technologies).
                  </p>
                </div>
              </label>
            </div>

            {/* PLAN SELECTION */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 uppercase block">
                Assigned Plan Tier
              </label>
              <select
                value={currentPlan}
                onChange={(e) => setCurrentPlan(e.target.value)}
                disabled={isLifetimePro}
                className="w-full px-3 py-2 border border-zinc-300 rounded bg-white text-xs font-mono font-bold uppercase focus:outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="FREE">FREE TIER</option>
                <option value="STARTER">STARTER TIER</option>
                <option value="PRO">PRO TIER</option>
                <option value="ENTERPRISE">ENTERPRISE TIER</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSavePlan}
              disabled={isUpdating}
              className="w-full bg-black hover:bg-zinc-800 text-white font-bold uppercase text-[11px] py-2.5 rounded shadow-sm transition-colors disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save Plan Tier"}
            </button>
          </div>

          {/* ADMINISTRATIVE LOCKOUT / SUSPENSION BOX */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase text-rose-900 tracking-wider border-b border-zinc-100 pb-3 flex items-center justify-between">
              <span>🔒 Administrative Lockout</span>
              {isSuspended && (
                <span className="bg-rose-100 text-rose-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                  LOCKED
                </span>
              )}
            </h3>

            {!isSuspended ? (
              <div className="space-y-3">
                <p className="text-zinc-600 font-sans text-xs">
                  Locking this workspace blocks all tenant members from accessing their documents and POS terminals.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold block">
                    Reason for Suspension
                  </label>
                  <textarea
                    value={suspendedReason}
                    onChange={(e) => setSuspendedReason(e.target.value)}
                    placeholder="e.g. Delinquent account, fraud audit, client request..."
                    rows={2}
                    className="w-full px-3 py-2 border border-zinc-300 rounded text-xs font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleToggleSuspension}
                  disabled={isUpdating}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-[11px] py-2.5 rounded shadow-sm transition-colors disabled:opacity-50"
                >
                  {isUpdating ? "Processing..." : "🔒 Suspend Workspace"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-rose-50 border border-rose-200 p-3 rounded text-rose-900 text-xs">
                  <span className="font-bold block">Locked Out Reason:</span>
                  <p className="font-mono text-[10px] mt-0.5">{shop.suspendedReason || "Administrative security lockout"}</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSuspension}
                  disabled={isUpdating}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase text-[11px] py-2.5 rounded shadow-sm transition-colors disabled:opacity-50"
                >
                  {isUpdating ? "Processing..." : "✅ Lift Suspension &amp; Restore"}
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
