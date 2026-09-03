"use client";

import { useState } from "react";
import { inviteTeamMember, removeTeamMember, revokeInvitation, updateTeamMemberRoleAndPermissions } from "@/lib/actions/team";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type Member = {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    customPermissions: Record<string, boolean>;
};

type Invite = {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
};

const PERMISSION_DEFINITIONS = [
    { key: "canCreateDocuments", label: "Can Create Documents (Invoices, Quotes, Receipts)" },
    { key: "canEditClients", label: "Can Edit Clients & Directory" },
    { key: "canViewFinance", label: "Can View Finance, Ledgers & Analytics" },
    { key: "canExportReports", label: "Can Export Reports & Summaries" },
    { key: "manage_products", label: "Can Manage Product Catalog & Stock" },
    { key: "manage_payroll", label: "Can Manage Payroll & Staff Wages" },
];

export default function TeamManagementClient({ shopId, initialMembers, initialInvites = [] }: { shopId: string, initialMembers: Member[], initialInvites?: Invite[] }) {
    const router = useRouter();
    const [isInviting, setIsInviting] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"ADMIN" | "MANAGER" | "ACCOUNTANT" | "EMPLOYEE" | "VIEWER">("VIEWER");
    
    // Employee Permissions for Inviting
    const [permissions, setPermissions] = useState<Record<string, boolean>>({
        canCreateDocuments: false,
        canEditClients: false,
        canViewFinance: false,
        canExportReports: false,
        manage_products: false,
        manage_payroll: false,
    });

    // Editing State for existing members
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editRole, setEditRole] = useState<"ADMIN" | "MANAGER" | "ACCOUNTANT" | "EMPLOYEE" | "VIEWER">("VIEWER");
    const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
    const [errorMsg, setErrorMsg] = useState("");

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setStatus("LOADING");
        setErrorMsg("");

        const res = await inviteTeamMember(shopId, email, role, role === "EMPLOYEE" ? permissions : {});

        if (res.success) {
            setStatus("SUCCESS");
            setEmail("");
            setRole("VIEWER");
            setTimeout(() => { setIsInviting(false); setStatus("IDLE"); }, 2000);
            router.refresh();
        } else {
            setStatus("ERROR");
            setErrorMsg(res.error || "Failed to invite user.");
        }
    }

    function openEditModal(member: Member) {
        setEditingMember(member);
        setEditRole(member.role as any);
        setEditPermissions(member.customPermissions || {});
    }

    async function handleSaveEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingMember) return;

        setIsSavingEdit(true);
        const toastId = toast.loading("Updating staff permissions...");

        try {
            const res = await updateTeamMemberRoleAndPermissions(
                shopId,
                editingMember.id,
                editRole,
                editRole === "EMPLOYEE" ? editPermissions : {}
            );

            if (res.success) {
                toast.success("Staff role & permissions updated successfully.", { id: toastId });
                setEditingMember(null);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to update member.", { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update member.", { id: toastId });
        } finally {
            setIsSavingEdit(false);
        }
    }

    function handleRemove(memberId: string) {
        toast((t) => (
            <div className="flex flex-col gap-3 font-mono text-xs">
                <span className="font-semibold uppercase tracking-tight text-black">Remove this member?</span>
                <div className="flex gap-2">
                    <button 
                        className="bg-black text-white px-3 py-1.5 rounded font-bold uppercase tracking-wider cursor-pointer"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const toastId = toast.loading("Removing member...");
                            const res = await removeTeamMember(shopId, memberId);
                            if (!res.success) {
                                toast.error(res.error || "Failed to remove member.", { id: toastId });
                            } else {
                                toast.success("Member removed successfully.", { id: toastId });
                                router.refresh();
                            }
                        }}
                    >
                        Yes, Remove
                    </button>
                    <button 
                        className="bg-zinc-200 text-black px-3 py-1.5 rounded font-bold uppercase tracking-wider cursor-pointer"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 6000 });
    }

    async function handleRevoke(inviteId: string) {
        const toastId = toast.loading("Revoking invitation...");
        const res = await revokeInvitation(shopId, inviteId);
        if (!res.success) {
            toast.error(res.error || "Failed to revoke invitation.", { id: toastId });
        } else {
            toast.success("Invitation revoked.", { id: toastId });
            router.refresh();
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 font-sans">
            <div>
                <h1 className="text-xl font-bold uppercase tracking-tight text-black">Staff &amp; Team Management</h1>
                <p className="text-xs text-zinc-500 mt-1">Manage staff roles, document permissions, client management access, and financial visibility.</p>
            </div>

            {isInviting ? (
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-base text-black">Add New Staff Member</h2>
                        <button onClick={() => setIsInviting(false)} className="text-zinc-400 hover:text-black">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <form onSubmit={handleInvite} className="space-y-5">
                        {status === "ERROR" && <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-lg text-xs font-bold">{errorMsg}</div>}
                        {status === "SUCCESS" && <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold">Invitation successful! They can now access this workspace.</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">User Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Registered email address"
                                    required
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                                />
                                <p className="text-[10px] text-zinc-500">If they don't have an account, we'll email them an invite link.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold"
                                >
                                    <option value="VIEWER">Viewer (Read Only)</option>
                                    <option value="EMPLOYEE">Employee (Granular Permissions)</option>
                                    <option value="ACCOUNTANT">Accountant (Financials &amp; Reports)</option>
                                    <option value="MANAGER">Manager (Full Access minus Team Settings)</option>
                                    <option value="ADMIN">Admin (Full Control)</option>
                                </select>
                            </div>
                        </div>

                        {role === "EMPLOYEE" && (
                            <div className="pt-4 border-t border-zinc-100 space-y-3">
                                <div>
                                    <h3 className="text-xs font-bold text-black uppercase">Granular Employee Permissions</h3>
                                    <p className="text-[11px] text-zinc-500">Toggle specific operational capabilities for this employee.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {PERMISSION_DEFINITIONS.map((def) => (
                                        <label key={def.key} className="flex items-start gap-2.5 cursor-pointer p-3 border border-zinc-200 rounded-lg bg-zinc-50 hover:border-black transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(permissions[def.key])}
                                                onChange={(e) => setPermissions(p => ({ ...p, [def.key]: e.target.checked }))}
                                                className="accent-black w-4 h-4 mt-0.5"
                                            />
                                            <span className="text-xs font-medium text-black leading-snug">{def.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={status === "LOADING"}
                                className="bg-black hover:bg-zinc-800 text-white font-bold py-2 px-5 rounded-lg text-xs transition-colors disabled:opacity-50"
                            >
                                {status === "LOADING" ? "Inviting..." : "Grant Access"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex justify-end mb-4">
                    <button onClick={() => setIsInviting(true)} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-zinc-800 transition-colors">
                        + Add Member
                    </button>
                </div>
            )}

            <div className="surface overflow-x-auto">
                <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100 uppercase tracking-wider font-semibold text-zinc-500 text-[10px]">
                            <th className="px-4 py-3 border-r border-zinc-100">Name</th>
                            <th className="px-4 py-3 border-r border-zinc-100">Email</th>
                            <th className="px-4 py-3 border-r border-zinc-100">Role</th>
                            <th className="px-4 py-3 border-r border-zinc-100">Permissions</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {initialMembers.map(member => {
                            const perms = member.customPermissions || {};
                            const activePermCount = Object.values(perms).filter(Boolean).length;
                            return (
                                <tr key={member.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                                    <td className="p-4 border-r border-zinc-100 font-semibold uppercase tracking-tight text-black">{member.name}</td>
                                    <td className="p-4 border-r border-zinc-100 text-zinc-600 font-mono text-[11px]">{member.email}</td>
                                    <td className="p-4 border-r border-zinc-100">
                                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold font-mono tracking-wider ${
                                            member.role === 'OWNER' ? 'bg-black text-white' : 
                                            member.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
                                            'bg-zinc-100 text-zinc-800'
                                        }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="p-4 border-r border-zinc-100 text-[11px]">
                                        {member.role === 'OWNER' || member.role === 'ADMIN' ? (
                                            <span className="text-zinc-500 font-medium italic">Full Admin Access</span>
                                        ) : member.role === 'EMPLOYEE' ? (
                                            <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                                                {activePermCount} Permission{activePermCount === 1 ? "" : "s"} Enabled
                                            </span>
                                        ) : (
                                            <span className="text-zinc-500 font-medium">{member.role} Preset</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            {member.role !== 'OWNER' && (
                                                <button
                                                    onClick={() => openEditModal(member)}
                                                    className="text-black hover:underline text-xs font-bold uppercase tracking-wider cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {member.role !== 'OWNER' && (
                                                <button
                                                    onClick={() => handleRemove(member.id)}
                                                    className="text-rose-600 hover:text-rose-800 text-xs font-bold uppercase tracking-wider cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {initialMembers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-xs text-zinc-500 font-mono">No team members found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingMember && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <form
                        onSubmit={handleSaveEdit}
                        className="bg-white border border-zinc-300 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-left font-sans"
                    >
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <div>
                                <h3 className="font-bold text-base text-black">
                                    Edit Permissions: {editingMember.name}
                                </h3>
                                <p className="text-xs text-zinc-500 font-mono">{editingMember.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingMember(null)}
                                className="text-zinc-400 hover:text-black font-bold text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-black uppercase">Role</label>
                            <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value as any)}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold"
                            >
                                <option value="VIEWER">Viewer (Read Only)</option>
                                <option value="EMPLOYEE">Employee (Granular Permissions)</option>
                                <option value="ACCOUNTANT">Accountant (Financials &amp; Reports)</option>
                                <option value="MANAGER">Manager (Full Access minus Team Settings)</option>
                                <option value="ADMIN">Admin (Full Control)</option>
                            </select>
                        </div>

                        {editRole === "EMPLOYEE" && (
                            <div className="space-y-2.5">
                                <div>
                                    <h4 className="text-xs font-bold text-black uppercase">Granular Permissions</h4>
                                    <p className="text-[11px] text-zinc-500">Configure what this staff member is allowed to do:</p>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {PERMISSION_DEFINITIONS.map((def) => (
                                        <label key={def.key} className="flex items-start gap-2.5 cursor-pointer p-2.5 border border-zinc-200 rounded-lg bg-zinc-50 hover:border-black transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(editPermissions[def.key])}
                                                onChange={(e) => setEditPermissions(p => ({ ...p, [def.key]: e.target.checked }))}
                                                className="accent-black w-4 h-4 mt-0.5"
                                            />
                                            <span className="text-xs font-medium text-black leading-snug">{def.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
                            <button
                                type="button"
                                onClick={() => setEditingMember(null)}
                                className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-bold uppercase text-zinc-600 hover:text-black"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingEdit}
                                className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase disabled:opacity-50"
                            >
                                {isSavingEdit ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {initialInvites.length > 0 && (
                <div className="mt-8">
                    <h3 className="font-bold text-black uppercase text-xs mb-3">Pending Invitations</h3>
                    <div className="surface overflow-x-auto">
                        <table className="w-full text-left font-sans text-xs border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-100 uppercase tracking-wider font-semibold text-zinc-500 text-[10px]">
                                    <th className="px-4 py-3 border-r border-zinc-100">Email</th>
                                    <th className="px-4 py-3 border-r border-zinc-100">Role</th>
                                    <th className="px-4 py-3 border-r border-zinc-100">Status</th>
                                    <th className="px-4 py-3 border-r border-zinc-100">Sent On</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {initialInvites.map(invite => (
                                    <tr key={invite.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                                        <td className="p-4 border-r border-zinc-100 font-mono text-[11px] text-black">{invite.email}</td>
                                        <td className="p-4 border-r border-zinc-100">
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-zinc-100 text-zinc-800 uppercase">
                                                {invite.role}
                                            </span>
                                        </td>
                                        <td className="p-4 border-r border-zinc-100">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase ${
                                                invite.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                                                invite.status === 'REVOKED' ? 'bg-rose-100 text-rose-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {invite.status}
                                            </span>
                                        </td>
                                        <td className="p-4 border-r border-zinc-100 text-zinc-600 font-mono text-[11px]">
                                            {invite.createdAt.split('T')[0]}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {invite.status === 'PENDING' ? (
                                                <button onClick={() => handleRevoke(invite.id)} className="text-amber-600 hover:text-amber-800 text-xs font-bold uppercase tracking-wider cursor-pointer">
                                                    Revoke
                                                </button>
                                            ) : (
                                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
