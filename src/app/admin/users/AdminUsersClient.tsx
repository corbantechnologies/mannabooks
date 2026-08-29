"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleSuperAdminAction } from "@/lib/actions/admin";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  async function handleToggleAdmin(user: AdminUserSummary) {
    const nextAdminState = !user.isSuperAdmin;
    const actionLabel = nextAdminState ? "Elevating to Super Admin..." : "Revoking Super Admin rights...";

    setUpdatingId(user.id);
    const toastId = toast.loading(actionLabel);

    const res = await toggleSuperAdminAction({
      userId: user.id,
      isSuperAdmin: nextAdminState,
    });

    setUpdatingId(null);
    if (!res.success) {
      toast.error(res.error || "Failed to update admin role.", { id: toastId });
    } else {
      toast.success(res.message || "User role updated!", { id: toastId });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, isSuperAdmin: nextAdminState } : item
        )
      );
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
            PLATFORM ACCOUNTS // ACCESS &amp; ROLES
          </span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-0.5">
            Platform Users ({users.length})
          </h2>
        </div>
      </div>

      {/* SEARCH CONTROLS */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user name, email..."
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

      {/* USERS TABLE */}
      <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">User Account</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Owned Workspaces</th>
                <th className="py-3 px-4">Member Of</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Root Governance</th>
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
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                    
                    {/* NAME & EMAIL */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="space-y-0.5">
                        <div className="font-bold text-black text-sm">{u.name}</div>
                        <div className="font-mono text-[10px] text-zinc-500">{u.email}</div>
                      </div>
                    </td>

                    {/* ROLE STATUS */}
                    <td className="py-3.5 px-4">
                      {u.isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 bg-black text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs">
                          <span>👑</span>
                          <span>SUPER ADMIN (ROOT)</span>
                        </span>
                      ) : (
                        <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                          STANDARD USER
                        </span>
                      )}
                    </td>

                    {/* OWNED WORKSPACES */}
                    <td className="py-3.5 px-4">
                      {u.ownedShops.length === 0 ? (
                        <span className="text-zinc-400 text-[10px]">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
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

                    {/* TOGGLE SUPER ADMIN ACTION */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleAdmin(u)}
                        disabled={updatingId === u.id}
                        className={`font-mono text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors disabled:opacity-50 ${
                          u.isSuperAdmin
                            ? "bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-600 hover:text-white"
                            : "bg-black text-white hover:bg-zinc-800 shadow-2xs"
                        }`}
                      >
                        {updatingId === u.id
                          ? "Saving..."
                          : u.isSuperAdmin
                          ? "Revoke Admin"
                          : "👑 Promote Admin"}
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
