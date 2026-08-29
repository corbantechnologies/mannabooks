import { enforceSuperAdmin } from "@/lib/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/logout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // 1. Enforce strict Super Admin privileges at the layout boundary
    const adminUser = await enforceSuperAdmin();
    
    if (!adminUser) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-black selection:text-white flex flex-col">
            
            {/* Platform Super Admin Header */}
            <header className="bg-black text-white border-b border-zinc-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="flex items-center gap-3 no-underline text-white">
                            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                                <span className="text-black font-black text-xs">M_</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="font-bold text-sm leading-tight tracking-tight">MANNA BOOKS ROOT</h1>
                                <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Global Administrative Terminal</span>
                            </div>
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-mono text-zinc-300">ROOT: {adminUser.email}</span>
                        </div>
                        
                        <form action={logoutAction}>
                            <button className="text-xs font-semibold text-zinc-300 hover:text-white uppercase tracking-wider transition-colors border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded cursor-pointer">
                                Terminate Session
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
                
                {/* Admin Sidebar Navigation */}
                <aside className="w-full md:w-64 shrink-0">
                    <div className="sticky top-24 space-y-4">
                        <nav className="space-y-1.5 bg-white border border-zinc-200/80 rounded-xl p-3 shadow-xs font-mono text-xs">
                            <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Platform Navigation
                            </div>
                            
                            <Link 
                                href="/admin" 
                                className="flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-lg font-semibold transition-colors no-underline"
                            >
                                <span>📊</span>
                                <span>Platform Metrics</span>
                            </Link>

                            <Link 
                                href="/admin/workspaces" 
                                className="flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-lg font-semibold transition-colors no-underline"
                            >
                                <span>🏢</span>
                                <span>Tenant Workspaces</span>
                            </Link>

                            <Link 
                                href="/admin/users" 
                                className="flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-lg font-semibold transition-colors no-underline"
                            >
                                <span>👥</span>
                                <span>User Accounts &amp; Roles</span>
                            </Link>
                            
                            <div className="pt-3 mt-3 border-t border-zinc-100">
                                <Link 
                                    href="/dashboard" 
                                    className="flex items-center gap-2.5 px-3 py-2 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg font-semibold transition-colors no-underline"
                                >
                                    <span>🔄</span>
                                    <span>Return to Workspaces</span>
                                </Link>
                            </div>
                        </nav>

                        {/* SYSTEM HEALTH WIDGET */}
                        <div className="bg-zinc-950 border border-zinc-800 text-white rounded-xl p-4 font-mono text-[10px] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-400 uppercase font-bold">SYSTEM ENGINE</span>
                                <span className="text-emerald-400 font-bold">ONLINE</span>
                            </div>
                            <p className="text-zinc-400">Multi-tenant isolation active with PostgreSQL Row Security.</p>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
