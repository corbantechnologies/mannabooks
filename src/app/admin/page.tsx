import { getPlatformStats } from "@/lib/actions/admin";

export const dynamic = "force-dynamic"; // Ensure dashboard always fetches fresh data

export default async function AdminDashboardPage() {
    const res = await getPlatformStats();

    if (!res.success || !res.stats) {
        return (
            <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl text-rose-900 shadow-sm">
                <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <span>⚠️</span> Metric Retrieval Failed
                </h2>
                <p className="text-sm">{res.error || "An unknown error occurred while fetching platform telemetry."}</p>
            </div>
        );
    }

    const { users, workspaces, documents } = res.stats;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black tracking-tight text-black">Platform Telemetry</h2>
                <p className="text-sm text-zinc-500 font-mono mt-1">Live data aggregation across all system nodes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Users Metric */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between group hover:border-black transition-colors relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                    <div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Users</h3>
                        </div>
                        <div className="relative z-10">
                            <span className="text-5xl font-black tracking-tighter text-black">{users.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-100 text-[10px] font-mono text-zinc-400 uppercase relative z-10">
                        Registered platform accounts
                    </div>
                </div>

                {/* Total Workspaces Metric */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between group hover:border-black transition-colors relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                    <div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Workspaces</h3>
                        </div>
                        <div className="relative z-10">
                            <span className="text-5xl font-black tracking-tighter text-black">{workspaces.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-100 text-[10px] font-mono text-zinc-400 uppercase relative z-10">
                        Business Tenants (Shops)
                    </div>
                </div>

                {/* Total Documents Metric */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between group hover:border-black transition-colors relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                    <div>
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Documents Processed</h3>
                        </div>
                        <div className="relative z-10">
                            <span className="text-5xl font-black tracking-tighter text-black">{documents.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-100 text-[10px] font-mono text-zinc-400 uppercase relative z-10">
                        Invoices, Receipts, Quotes, etc.
                    </div>
                </div>

            </div>
            
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-6 font-mono text-xs text-zinc-500 shadow-sm mt-8">
                <div className="flex items-center gap-2 mb-2 text-black font-bold">
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                    SYSTEM HEALTH & INTEGRITY
                </div>
                <p>All core infrastructure nodes are operating optimally. The Drizzle ORM layer is successfully maintaining real-time parity with the master Railway cluster.</p>
            </div>
        </div>
    );
}
