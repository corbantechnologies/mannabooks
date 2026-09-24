"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { quickInviteStaffAction, removeStaffFromWorkspaceAction, type OrganizationStaffMember } from "@/lib/actions/team-directory";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import { Users, Building2, UserPlus, Trash2, ArrowRight, ShieldCheck, X, Check } from "lucide-react";

interface WorkspaceDirectoryClientProps {
  currentUser: any;
  rawPlan: string;
  isLifetime: boolean;
  memberships: any[];
  initialRoster: OrganizationStaffMember[];
  ownedShops: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
    memberCount: number;
  }[];
}

export function WorkspaceDirectoryClient({
  currentUser,
  rawPlan,
  isLifetime,
  memberships,
  initialRoster,
  ownedShops,
}: WorkspaceDirectoryClientProps) {
  const [activeTab, setActiveTab] = useState<"WORKSPACES" | "STAFF">("WORKSPACES");
  const [roster, setRoster] = useState<OrganizationStaffMember[]>(initialRoster);
  const [isPending, startTransition] = useTransition();

  // Selected workspace for slide-over team drawer
  const [selectedShopForTeam, setSelectedShopForTeam] = useState<{
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
  } | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteShopId, setInviteShopId] = useState(ownedShops[0]?.id || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MANAGER" | "ACCOUNTANT" | "STOREKEEPER" | "CASHIER" | "DISPATCHER" | "SALES_REP" | "EMPLOYEE" | "VIEWER">("STOREKEEPER");
  const [hideCostPrices, setHideCostPrices] = useState(true);
  const [directApprovalLimit, setDirectApprovalLimit] = useState("");

  const handleQuickInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteShopId || !inviteEmail.trim()) {
      toast.error("Please provide workspace and staff email.");
      return;
    }

    startTransition(async () => {
      const res = await quickInviteStaffAction({
        shopId: inviteShopId,
        email: inviteEmail.trim(),
        role: inviteRole,
        hideCostPrices,
        directApprovalLimit: Number(directApprovalLimit) || 0,
      });

      if (res.success) {
        toast.success(`Staff invitation processed for ${inviteEmail.trim()}`);
        setShowInviteModal(false);
        setInviteEmail("");
        // Reload page to refresh server state
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to invite staff member.");
      }
    });
  };

  const handleRemoveStaff = async (shopId: string, membershipId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove ${staffName} from this workspace?`)) return;

    startTransition(async () => {
      const res = await removeStaffFromWorkspaceAction(shopId, membershipId);
      if (res.success) {
        toast.success("Staff member access revoked.");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to remove staff member.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* TABS CONTROLLER */}
      <div className="flex items-center justify-between border-b border-zinc-200">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("WORKSPACES")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "WORKSPACES"
                ? "border-black text-black"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Authorized Workspaces ({memberships.length})</span>
          </button>

          {ownedShops.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("STAFF")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "STAFF"
                  ? "border-black text-black"
                  : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Organization Staff Roster ({roster.length})</span>
            </button>
          )}
        </div>

        <div className="pb-2">
          {ownedShops.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setInviteShopId(ownedShops[0]?.id || "");
                setShowInviteModal(true);
              }}
              className="bg-black text-white hover:bg-zinc-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add / Assign Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: WORKSPACE CARDS ── */}
      {activeTab === "WORKSPACES" && (
        <div className="card-modern divide-y divide-zinc-200/80 bg-white">
          {memberships.map((member) => {
            if (!member.shop) return null;
            const isOwnerOrAdmin = member.role === "OWNER" || member.role === "ADMIN";

            return (
              <div
                key={member.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-50/60 transition-colors"
              >
                <Link
                  href={`/workspaces/${member.shop.slug}`}
                  className="space-y-1 group min-w-0 flex-1 no-underline"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 border border-black/30 rounded-sm shrink-0 inline-block"
                      style={{ backgroundColor: member.shop.primaryColor || "#000000" }}
                    />
                    <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight font-sans text-black group-hover:underline decoration-2 underline-offset-4 truncate">
                      {member.shop.shortName || member.shop.name}
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-zinc-400 truncate">
                    /workspaces/{member.shop.slug}
                  </p>
                </Link>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] shrink-0">
                  {/* ROLE BADGE */}
                  <span className="border border-zinc-300 px-2.5 py-0.5 font-bold uppercase bg-white text-zinc-800 rounded">
                    {member.role}
                  </span>

                  {/* CURRENCY */}
                  <span className="bg-zinc-100 border border-zinc-200 text-zinc-600 px-2.5 py-0.5 font-semibold rounded">
                    {member.shop.currency}
                  </span>

                  {/* QUICK MANAGE TEAM BUTTON */}
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setSelectedShopForTeam(member.shop)}
                      className="border border-zinc-300 hover:border-black bg-zinc-50 hover:bg-black hover:text-white px-3 py-1 font-bold text-zinc-700 rounded transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Manage team members for this branch"
                    >
                      <Users className="w-3 h-3" />
                      <span>Manage Team</span>
                    </button>
                  )}

                  {/* ENTER WORKSPACE BUTTON */}
                  <Link
                    href={`/workspaces/${member.shop.slug}`}
                    className="bg-black hover:bg-zinc-800 text-white px-3.5 py-1 font-bold uppercase rounded flex items-center gap-1 no-underline transition-all"
                  >
                    <span>Enter</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: CONSOLIDATED STAFF ROSTER ── */}
      {activeTab === "STAFF" && (
        <div className="card-modern bg-white overflow-hidden">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-black">
                Organization Staff Matrix
              </h3>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Staff members and their designated access roles across your business workspaces.
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 px-2 py-0.5 rounded">
              {roster.length} Accounts Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-zinc-100/60 border-b border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Staff Member</th>
                  <th className="py-2.5 px-4 font-semibold">Email</th>
                  <th className="py-2.5 px-4 font-semibold">Assigned Workspaces & Roles</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 font-sans text-xs">
                {roster.map((staff) => (
                  <tr key={staff.userId} className="hover:bg-zinc-50/50">
                    <td className="py-3 px-4 font-semibold text-black">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {staff.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600 text-[11px]">
                      {staff.email}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {staff.memberships.map((m) => (
                          <span
                            key={m.membershipId}
                            className="inline-flex items-center gap-1 border border-zinc-200 bg-zinc-50 px-2 py-0.5 rounded text-[11px]"
                          >
                            <span className="font-semibold text-black">{m.shopName}:</span>
                            <span className="font-bold text-zinc-600">{m.role}</span>
                            {m.role !== "OWNER" && (
                              <button
                                type="button"
                                onClick={() => handleRemoveStaff(m.shopId, m.membershipId, staff.name)}
                                title={`Revoke access to ${m.shopName}`}
                                className="text-zinc-400 hover:text-red-600 ml-1 cursor-pointer bg-transparent border-none p-0"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setInviteEmail(staff.email);
                          setShowInviteModal(true);
                        }}
                        className="text-[10px] font-mono font-bold text-black border border-zinc-300 hover:border-black px-2 py-1 rounded bg-white hover:bg-black hover:text-white transition-all cursor-pointer"
                      >
                        + Assign to Workspace
                      </button>
                    </td>
                  </tr>
                ))}
                {roster.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-400 italic">
                      No staff members assigned yet. Use "+ Add / Assign Staff" to invite team members.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: INVITE / ASSIGN STAFF ── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-md w-full bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-black flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Invite / Assign Staff Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-zinc-400 hover:text-black cursor-pointer bg-transparent border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickInvite} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Target Workspace Branch *
                </label>
                <select
                  value={inviteShopId}
                  onChange={(e) => setInviteShopId(e.target.value)}
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-sans bg-white focus:outline-black"
                  required
                >
                  {ownedShops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} ({shop.memberCount} active staff)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Staff Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. manager@yourbusiness.co.ke"
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-mono focus:outline-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Role Assignment *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => {
                    const role = e.target.value as any;
                    setInviteRole(role);
                    if (role === "STOREKEEPER" || role === "CASHIER") {
                      setHideCostPrices(true);
                    } else if (role === "ACCOUNTANT" || role === "MANAGER" || role === "ADMIN") {
                      setHideCostPrices(false);
                    }
                  }}
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-sans bg-white focus:outline-black"
                >
                  <option value="STOREKEEPER">STOREKEEPER — WMS, shelf bins, counts, GRN receiving &amp; BOM assemblies</option>
                  <option value="CASHIER">CASHIER — Retail POS counter, daily registers &amp; receipts</option>
                  <option value="DISPATCHER">DISPATCHER — Delivery notes, vehicles &amp; inter-branch transfers</option>
                  <option value="SALES_REP">SALES REP — CRM pipeline, quotes &amp; interactive proposals</option>
                  <option value="ACCOUNTANT">ACCOUNTANT — Financial ledgers, bills, tax, payroll &amp; P&amp;L</option>
                  <option value="MANAGER">MANAGER — Full operational control across all modules</option>
                  <option value="ADMIN">ADMIN — Full branch admin (can manage team &amp; settings)</option>
                  <option value="EMPLOYEE">EMPLOYEE — General staff clerk</option>
                  <option value="VIEWER">VIEWER — Read-only observation</option>
                </select>
              </div>

              {/* Cost Price Privacy & Approval Limit */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="hideCostPrices"
                    checked={hideCostPrices}
                    onChange={(e) => setHideCostPrices(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-300 text-black focus:ring-black"
                  />
                  <label htmlFor="hideCostPrices" className="text-xs text-zinc-700">
                    <strong className="block text-zinc-900 font-semibold">Cost-Price Blindness (Commercial Privacy)</strong>
                    Hide unit purchase costs and vendor margin values from this staff member across inventory and audits.
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                    Direct Adjustment Cap (KES) [0 = All requires Manager Approval]
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={directApprovalLimit}
                    onChange={(e) => setDirectApprovalLimit(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full border border-zinc-200 rounded p-1.5 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-black text-white hover:bg-zinc-800 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? <Spinner size={14} /> : <Check className="w-3.5 h-3.5" />}
                  <span>Authorize &amp; Assign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DRAWER: MANAGE SPECIFIC WORKSPACE TEAM ── */}
      {selectedShopForTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-xs border border-black/30"
                      style={{ backgroundColor: selectedShopForTeam.primaryColor }}
                    />
                    <h2 className="text-base font-bold uppercase tracking-tight text-black">
                      {selectedShopForTeam.name} — Team
                    </h2>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Branch: /workspaces/{selectedShopForTeam.slug}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedShopForTeam(null)}
                  className="text-zinc-400 hover:text-black cursor-pointer bg-transparent border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ACTIVE MEMBERS IN THIS SHOP */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Active Branch Staff
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInviteShopId(selectedShopForTeam.id);
                      setShowInviteModal(true);
                    }}
                    className="text-[11px] font-bold text-black border border-black hover:bg-black hover:text-white px-2.5 py-1 rounded transition-all cursor-pointer"
                  >
                    + Add Member
                  </button>
                </div>

                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded">
                  {roster
                    .filter((staff) =>
                      staff.memberships.some((m) => m.shopId === selectedShopForTeam.id)
                    )
                    .map((staff) => {
                      const m = staff.memberships.find(
                        (mem) => mem.shopId === selectedShopForTeam.id
                      )!;
                      return (
                        <div
                          key={staff.userId}
                          className="p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-black">{staff.name}</p>
                            <p className="text-[11px] font-mono text-zinc-500">{staff.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded uppercase text-zinc-700">
                              {m.role}
                            </span>
                            {m.role !== "OWNER" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveStaff(
                                    selectedShopForTeam.id,
                                    m.membershipId,
                                    staff.name
                                  )
                                }
                                title="Remove from this workspace"
                                className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer bg-transparent border-none"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 flex justify-between items-center">
              <Link
                href={`/workspaces/${selectedShopForTeam.slug}/team`}
                className="text-xs font-semibold text-zinc-600 hover:text-black underline"
              >
                Open Full Team Settings &rarr;
              </Link>
              <button
                type="button"
                onClick={() => setSelectedShopForTeam(null)}
                className="btn-secondary-modern px-4 py-1.5 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
