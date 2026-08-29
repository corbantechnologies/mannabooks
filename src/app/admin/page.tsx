import { getPlatformStats } from "@/lib/actions/admin";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const res = await getPlatformStats();

    if (!res.success || !res.stats) {
        return (
            <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl text-rose-900 shadow-sm font-mono text-xs">
                <h2 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <span>⚠️</span> Metric Retrieval Failed
                </h2>
                <p>{res.error || "An unknown error occurred while fetching platform telemetry."}</p>
            </div>
        );
    }

    const { users, workspaces, documents, turnover, lifetimeProCount, suspendedCount, recentShops, recentUsers } = res.stats;

    return (
        <div className="space-y-8 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
                <div>
                    <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                        SUPER ADMIN ROOT // PLATFORM TELEMETRY
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-0.5">
                        Platform Overview
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/workspaces"
                        className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase px-4 py-2 rounded-lg shadow-sm transition-colors no-underline"
                    >
                        🏢 Tenant Directory &rarr;
                    </Link>
                    <Link
                        href="/admin/users"
                        className="bg-white border border-zinc-300 hover:border-black text-black font-mono text-xs font-bold uppercase px-4 py-2 rounded-lg shadow-xs transition-colors no-underline"
                    >
                        👥 Users
                    </Link>
                </div>
            </div>

            {/* TOP 4 KEY PLATFORM METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Total Users */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-black transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-3 text-zinc-500">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Accounts</span>
                            <span className="text-lg">👥</span>
                        </div>
                        <div className="text-3xl font-black text-black tracking-tight">
                            {users.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100 text-[10px] font-mono text-zinc-400 uppercase">
                        Registered platform users
                    </div>
                </div>

                {/* Total Workspaces */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-black transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-3 text-zinc-500">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Workspaces (Shops)</span>
                            <span className="text-lg">🏢</span>
                        </div>
                        <div className="text-3xl font-black text-black tracking-tight">
                            {workspaces.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100 text-[10px] font-mono text-zinc-400 uppercase flex justify-between">
                        <span>Active business tenants</span>
                        {lifetimeProCount > 0 && (
                            <span className="text-amber-600 font-bold">👑 {lifetimeProCount} Lifetime</span>
                        )}
                    </div>
                </div>

                {/* Total Documents */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-black transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-3 text-zinc-500">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Documents</span>
                            <span className="text-lg">📜</span>
                        </div>
                        <div className="text-3xl font-black text-black tracking-tight">
                            {documents.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100 text-[10px] font-mono text-zinc-400 uppercase">
                        Invoices, Receipts, Quotes, LPOs
                    </div>
                </div>

                {/* Total Financial Turnover */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-black transition-colors">
                    <div>
                        <div className="flex items-center justify-between mb-3 text-zinc-500">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Gross Turnover</span>
                            <span className="text-lg">💰</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-800 tracking-tight truncate">
                            {formatCurrency(turnover, "KES")}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100 text-[10px] font-mono text-zinc-400 uppercase">
                        Total billing volume processed
                    </div>
                </div>

            </div>

            {/* SUBSCRIPTION & STATUS HIGHLIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 p-5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900">
                            👑 Lifetime PRO Tenants
                        </span>
                        <span className="bg-amber-100 text-amber-900 font-mono font-bold text-xs px-2 py-0.5 rounded border border-amber-300">
                            {lifetimeProCount}
                        </span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                        Whitelisted businesses (such as Corban Technologies &amp; internal entities) exempt from subscription billing loops with permanent full PRO access.
                    </p>
                    <div className="pt-1">
                        <Link href="/admin/workspaces?plan=LIFETIME_PRO" className="text-[11px] font-mono font-bold text-amber-900 underline hover:no-underline">
                            View Lifetime PRO Workspaces &rarr;
                        </Link>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 p-5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                            ⚡ Active Workspaces
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 font-mono font-bold text-xs px-2 py-0.5 rounded border border-emerald-300">
                            {workspaces - suspendedCount}
                        </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                        Tenants with healthy account standings actively processing invoices, walk-in sales, and accounting journals.
                    </p>
                    <div className="pt-1">
                        <Link href="/admin/workspaces" className="text-[11px] font-mono font-bold text-emerald-900 underline hover:no-underline">
                            Browse All Workspaces &rarr;
                        </Link>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-zinc-50 to-rose-50/30 border border-zinc-200 p-5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-900">
                            🔒 Suspended Tenants
                        </span>
                        <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${suspendedCount > 0 ? "bg-rose-100 text-rose-900 border-rose-300" : "bg-zinc-100 text-zinc-600 border-zinc-300"}`}>
                            {suspendedCount}
                        </span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                        Tenants placed on administrative lockout due to delinquent status or compliance investigations.
                    </p>
                    <div className="pt-1">
                        <Link href="/admin/workspaces?plan=SUSPENDED" className="text-[11px] font-mono font-bold text-zinc-800 underline hover:no-underline">
                            Inspect Suspended Tenants &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            {/* RECENT ACTIVITY: RECENT SHOPS & RECENT USERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Recent Workspaces */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                        <h3 className="font-bold text-sm uppercase tracking-tight text-black flex items-center gap-2">
                            <span>🏢</span>
                            <span>Recent Workspaces</span>
                        </h3>
                        <Link href="/admin/workspaces" className="font-mono text-[10px] text-zinc-500 hover:text-black font-bold uppercase underline">
                            View All &rarr;
                        </Link>
                    </div>

                    <div className="divide-y divide-zinc-100 font-mono text-xs">
                        {recentShops.map((shop: any) => (
                            <div key={shop.id} className="py-3 flex justify-between items-center hover:bg-zinc-50 px-2 rounded transition-colors">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-black font-sans text-xs">{shop.name}</span>
                                        {shop.isLifetimePro && (
                                            <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded font-bold">
                                                LIFETIME PRO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-mono">
                                        Owner: {shop.owner?.name || shop.owner?.email || "Unknown"} • {shop.taxPin || "No PIN"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Link
                                        href={`/admin/workspaces/${shop.id}`}
                                        className="text-[10px] font-bold uppercase border border-zinc-300 hover:border-black px-2 py-1 rounded bg-white"
                                    >
                                        Inspect
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Platform Users */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                        <h3 className="font-bold text-sm uppercase tracking-tight text-black flex items-center gap-2">
                            <span>👥</span>
                            <span>Recent User Accounts</span>
                        </h3>
                        <Link href="/admin/users" className="font-mono text-[10px] text-zinc-500 hover:text-black font-bold uppercase underline">
                            View All &rarr;
                        </Link>
                    </div>

                    <div className="divide-y divide-zinc-100 font-mono text-xs">
                        {recentUsers.map((u: any) => (
                            <div key={u.id} className="py-3 flex justify-between items-center hover:bg-zinc-50 px-2 rounded transition-colors">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-black font-sans text-xs">{u.name}</span>
                                        {u.isSuperAdmin && (
                                            <span className="text-[9px] bg-black text-white px-1.5 py-0.2 rounded font-bold">
                                                ROOT ADMIN
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-mono">
                                        {u.email}
                                    </p>
                                </div>
                                <div className="text-right text-[10px] text-zinc-400">
                                    {new Date(u.createdAt).toLocaleDateString("en-KE")}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
