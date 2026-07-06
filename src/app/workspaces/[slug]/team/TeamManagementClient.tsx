"use client";

import { useState } from "react";
import { inviteTeamMember, removeTeamMember } from "@/lib/actions/team";

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

export default function TeamManagementClient({ shopId, initialMembers }: { shopId: string, initialMembers: Member[] }) {
    const [isInviting, setIsInviting] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"ADMIN" | "MANAGER" | "ACCOUNTANT" | "EMPLOYEE" | "VIEWER">("VIEWER");
    
    // Employee Permissions
    const [permissions, setPermissions] = useState({
        manage_documents: false,
        manage_products: false,
        manage_expenses: false,
        view_analytics: false,
        manage_payroll: false,
    });

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
        } else {
            setStatus("ERROR");
            setErrorMsg(res.error || "Failed to invite user.");
        }
    }

    async function handleRemove(memberId: string) {
        if (!confirm("Are you sure you want to remove this user from the workspace?")) return;
        const res = await removeTeamMember(shopId, memberId);
        if (!res.success) alert(res.error);
    }

    return (
        <div>
            {isInviting ? (
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-lg text-black">Invite Team Member</h2>
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
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                                />
                                <p className="text-[10px] text-zinc-500">User must already have a Manna Books account.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                                >
                                    <option value="VIEWER">Viewer (Read Only)</option>
                                    <option value="EMPLOYEE">Employee (Customizable)</option>
                                    <option value="ACCOUNTANT">Accountant (Financials)</option>
                                    <option value="MANAGER">Manager (Full Access minus Team Settings)</option>
                                    <option value="ADMIN">Admin (Full Access)</option>
                                </select>
                            </div>
                        </div>

                        {role === "EMPLOYEE" && (
                            <div className="pt-4 border-t border-zinc-100">
                                <h3 className="text-sm font-bold text-black mb-3">Custom Employee Permissions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(permissions).map(([key, value]) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer p-3 border border-zinc-200 rounded-lg bg-zinc-50 hover:border-black transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => setPermissions(p => ({ ...p, [key]: e.target.checked }))}
                                                className="accent-black w-4 h-4"
                                            />
                                            <span className="text-xs font-semibold capitalize">{key.replace("_", " ")}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={status === "LOADING"}
                                className="bg-black hover:bg-zinc-800 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                                {status === "LOADING" ? "Inviting..." : "Grant Access"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex justify-end mb-4">
                    <button onClick={() => setIsInviting(true)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-zinc-800 transition-colors">
                        + Add Member
                    </button>
                </div>
            )}

            <div className="card-modern overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                            <th className="p-4 border-r border-zinc-200">Name</th>
                            <th className="p-4 border-r border-zinc-200">Email</th>
                            <th className="p-4 border-r border-zinc-200">Role</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 bg-white">
                        {initialMembers.map(member => (
                            <tr key={member.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="p-4 border-r border-zinc-200/80 font-sans text-sm font-semibold uppercase tracking-tight text-black">{member.name}</td>
                                <td className="p-4 border-r border-zinc-200/80 text-zinc-600">{member.email}</td>
                                <td className="p-4 border-r border-zinc-200/80">
                                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                                        member.role === 'OWNER' ? 'bg-black text-white' : 
                                        member.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
                                        'bg-zinc-100 text-zinc-800'
                                    }`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {member.role !== 'OWNER' && (
                                        <button onClick={() => handleRemove(member.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold uppercase tracking-wider">
                                            Remove
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {initialMembers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-sm text-zinc-500 font-mono">No team members found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
