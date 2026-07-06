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
                        <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                            <span className="text-black font-black text-xs">M_</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-sm leading-tight tracking-tight">MANNA BOOKS SYSTEM</h1>
                            <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Global Administrative Terminal</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-mono text-zinc-300">Logged in as {adminUser.email} (ROOT)</span>
                        </div>
                        
                        <form action={logoutAction}>
                            <button className="text-xs font-semibold text-zinc-300 hover:text-white uppercase tracking-wider transition-colors border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded">
                                Terminate Session
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
                
                {/* Admin Sidebar */}
                <aside className="w-full md:w-64 shrink-0">
                    <nav className="space-y-1 bg-white border border-zinc-200/80 rounded-xl p-3 shadow-sm">
                        <Link 
                            href="/admin" 
                            className="flex items-center gap-3 px-3 py-2.5 bg-black text-white rounded-lg text-sm font-bold shadow-sm"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Platform Metrics
                        </Link>
                        
                        <div className="pt-4 mt-4 border-t border-zinc-100">
                            <Link 
                                href="/dashboard" 
                                className="flex items-center gap-3 px-3 py-2 text-zinc-600 hover:text-black hover:bg-zinc-50 rounded-lg text-sm font-semibold transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                Return to Workspaces
                            </Link>
                        </div>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
