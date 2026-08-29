import { enforceSuperAdmin } from "@/lib/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminGuidePage() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-12 font-sans pb-16">
            
            {/* HEADER */}
            <div className="border-b border-zinc-200/80 pb-6">
                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                    <Link href="/admin" className="hover:text-black underline">
                        Admin Terminal
                    </Link>
                    <span>/</span>
                    <span>Knowledge Base &amp; System Architecture</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
                    Super Admin Operations Handbook
                </h1>
                <p className="text-xs text-zinc-600 font-mono mt-1">
                    Comprehensive technical reference for managing tenants, paywalls, Safaricom Daraja M-Pesa billing, stock ledgers, and database operations.
                </p>
            </div>

            {/* QUICK NAVIGATION TABLE OF CONTENTS */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-6 shadow-2xs">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black mb-4">
                    ⚡ Quick Navigation Index
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                    <a href="#admin-accounts" className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors block text-zinc-800 font-semibold no-underline">
                        <span className="text-emerald-700 block text-[10px] font-bold">SECTION 1</span>
                        👑 Admin Accounts &amp; Elevation
                    </a>
                    <a href="#tenants-lifetime" className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors block text-zinc-800 font-semibold no-underline">
                        <span className="text-emerald-700 block text-[10px] font-bold">SECTION 2</span>
                        🏢 Workspaces &amp; Lifetime PRO
                    </a>
                    <a href="#paywalls-quotas" className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors block text-zinc-800 font-semibold no-underline">
                        <span className="text-emerald-700 block text-[10px] font-bold">SECTION 3</span>
                        🔒 Paywall Engine &amp; Quotas
                    </a>
                    <a href="#mpesa-gateway" className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors block text-zinc-800 font-semibold no-underline">
                        <span className="text-emerald-700 block text-[10px] font-bold">SECTION 4</span>
                        📱 Daraja M-Pesa STK Push
                    </a>
                    <a href="#dynamic-pricing" className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors block text-zinc-800 font-semibold no-underline">
                        <span className="text-emerald-700 block text-[10px] font-bold">SECTION 5</span>
                        💳 Dynamic Pricing &amp; Plans
                    </a>
                    <a href="#inventory-ledger" className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors block text-zinc-800 font-semibold no-underline">
                        <span className="text-emerald-700 block text-[10px] font-bold">SECTION 6</span>
                        📦 Multi-Location Inventory
                    </a>
                    <a href="#general-ledger" className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors block text-zinc-800 font-semibold no-underline">
                        <span className="text-emerald-700 block text-[10px] font-bold">SECTION 7</span>
                        📊 Accounting &amp; General Ledger
                    </a>
                    <a href="#troubleshooting" className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-black transition-colors block text-zinc-800 font-semibold no-underline">
                        <span className="text-emerald-700 block text-[10px] font-bold">SECTION 8</span>
                        🛠️ CLI &amp; Troubleshooting
                    </a>
                </div>
            </div>

            {/* SECTION 1: ADMIN ACCOUNTS & ROOT */}
            <section id="admin-accounts" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                    <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">01</span>
                    <h2 className="text-lg font-black uppercase text-black">
                        Super Admin Accounts &amp; Root Elevation
                    </h2>
                </div>

                <div className="prose prose-sm max-w-none text-zinc-700 text-xs font-mono space-y-4 leading-relaxed">
                    <p>
                        Super Admin accounts possess system-wide <strong className="text-black">ROOT</strong> privileges. When a Super Admin logs into MannaBooks, they are automatically directed to the <strong>Administrative Terminal (<Link href="/admin" className="text-emerald-700 underline font-bold">/admin</Link>)</strong>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                            <span className="font-bold text-black text-xs block uppercase">Method A: Using CLI Command</span>
                            <p className="text-zinc-600 text-[11px]">Run from terminal after user has registered:</p>
                            <pre className="bg-zinc-950 text-emerald-400 p-3 rounded-lg text-[11px] overflow-x-auto">
npm run make:admin user@corbantechnologies.org
                            </pre>
                        </div>

                        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                            <span className="font-bold text-black text-xs block uppercase">Method B: Direct API Bootstrap</span>
                            <p className="text-zinc-600 text-[11px]">Hit this URL in browser after signing up:</p>
                            <pre className="bg-zinc-950 text-emerald-400 p-3 rounded-lg text-[11px] overflow-x-auto">
GET /api/admin/bootstrap?email=user@corbantechnologies.org
                            </pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: WORKSPACES & LIFETIME PRO */}
            <section id="tenants-lifetime" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                    <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">02</span>
                    <h2 className="text-lg font-black uppercase text-black">
                        Tenant Workspaces &amp; Lifetime PRO Whitelist
                    </h2>
                </div>

                <div className="text-zinc-700 text-xs font-mono space-y-4 leading-relaxed">
                    <p>
                        Each company using MannaBooks operates in an isolated workspace bounded by <code className="bg-zinc-100 px-1 py-0.5 rounded text-black font-bold">shop_id</code>.
                    </p>

                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-amber-900 text-xs uppercase">
                            <span>👑</span>
                            <span>Internal Company Exemption Policy (Lifetime PRO)</span>
                        </div>
                        <p className="text-amber-800 text-[11px]">
                            Internal companies (such as <strong>Corban Technologies</strong>, GearHouse Africa, etc.) must NEVER be subjected to subscription paywalls or renewal loops.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 pt-1">
                            <li>Go to <Link href="/admin/workspaces" className="font-bold underline text-amber-950">Tenant Workspaces Directory (/admin/workspaces)</Link>.</li>
                            <li>Locate the company workspace and click <strong>&quot;👑 Lifetime PRO&quot;</strong>.</li>
                            <li>This permanently sets <code className="bg-amber-100 px-1 rounded font-bold">is_lifetime_pro = true</code>, granting unlimited team members, unlimited warehouses, and the full General Ledger suite with <strong>no expiration date</strong>.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* SECTION 3: PAYWALL ENGINE & QUOTAS */}
            <section id="paywalls-quotas" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                    <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">03</span>
                    <h2 className="text-lg font-black uppercase text-black">
                        Paywall Engine &amp; Quota Assertions
                    </h2>
                </div>

                <div className="text-zinc-700 text-xs font-mono space-y-4 leading-relaxed">
                    <p>
                        The paywall engine (<code className="bg-zinc-100 px-1 py-0.5 rounded text-black font-bold">src/lib/paywall.ts</code>) evaluates every mutating action on the server before database execution:
                    </p>

                    <div className="overflow-x-auto border border-zinc-200 rounded-xl bg-white">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
                                <tr>
                                    <th className="py-3 px-4">Plan Tier</th>
                                    <th className="py-3 px-4">Team Quota</th>
                                    <th className="py-3 px-4">Locations Quota</th>
                                    <th className="py-3 px-4">Inter-Branch Transfers</th>
                                    <th className="py-3 px-4">General Ledger / Balance Sheet</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                <tr>
                                    <td className="py-3 px-4 font-bold text-black">Free Starter</td>
                                    <td className="py-3 px-4">1 Member (Owner)</td>
                                    <td className="py-3 px-4">1 Location (Main)</td>
                                    <td className="py-3 px-4 text-rose-600 font-bold">✕ Disabled</td>
                                    <td className="py-3 px-4 text-rose-600 font-bold">✕ Disabled</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 font-bold text-black">Basic (KES 1,500/mo)</td>
                                    <td className="py-3 px-4">Up to 3 Members</td>
                                    <td className="py-3 px-4">Up to 3 Locations</td>
                                    <td className="py-3 px-4 text-emerald-700 font-bold">✓ Enabled</td>
                                    <td className="py-3 px-4 text-rose-600 font-bold">✕ Disabled</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 font-bold text-black">Professional (KES 3,500/mo)</td>
                                    <td className="py-3 px-4">Up to 10 Members</td>
                                    <td className="py-3 px-4 font-bold text-emerald-700">Unlimited (∞)</td>
                                    <td className="py-3 px-4 text-emerald-700 font-bold">✓ Enabled</td>
                                    <td className="py-3 px-4 text-emerald-700 font-bold">✓ Full General Ledger</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 font-bold text-black">Enterprise</td>
                                    <td className="py-3 px-4 font-bold text-emerald-700">Unlimited (∞)</td>
                                    <td className="py-3 px-4 font-bold text-emerald-700">Unlimited (∞)</td>
                                    <td className="py-3 px-4 text-emerald-700 font-bold">✓ Enabled</td>
                                    <td className="py-3 px-4 text-emerald-700 font-bold">✓ Full GL &amp; APIs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* SECTION 4: SAFARICOM DARAJA M-PESA GATEWAY */}
            <section id="mpesa-gateway" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                    <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">04</span>
                    <h2 className="text-lg font-black uppercase text-black">
                        Safaricom Daraja M-Pesa Subscription Gateway
                    </h2>
                </div>

                <div className="text-zinc-700 text-xs font-mono space-y-4 leading-relaxed">
                    <p>
                        When a merchant chooses to upgrade their workspace at <code className="bg-zinc-100 px-1 py-0.5 rounded text-black font-bold">/settings/billing</code>:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1.5">
                            <span className="font-bold text-black text-xs block">1. STK Push Request</span>
                            <p className="text-zinc-600 text-[11px]">
                                Server calls Daraja <code className="text-black">/stkpush/v1/processrequest</code> with amount, Shortcode, encrypted password, and callback URL.
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1.5">
                            <span className="font-bold text-black text-xs block">2. Customer PIN Prompt</span>
                            <p className="text-zinc-600 text-[11px]">
                                Safaricom displays the PIN dialog on customer handset. Browser polls transaction status every 2.5s.
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1.5">
                            <span className="font-bold text-black text-xs block">3. Webhook Callback</span>
                            <p className="text-zinc-600 text-[11px]">
                                Safaricom posts receipt metadata to <code className="text-emerald-700 font-bold">/api/billing/mpesa-callback</code>, upgrading the shop instantly.
                            </p>
                        </div>
                    </div>

                    <div className="bg-zinc-950 text-zinc-300 p-4 rounded-xl space-y-2">
                        <span className="text-[11px] font-bold uppercase text-white block">Required Environment Variables:</span>
                        <pre className="text-emerald-400 text-[11px] overflow-x-auto">
MPESA_ENV=&quot;production&quot;
MPESA_CONSUMER_KEY=&quot;your_consumer_key&quot;
MPESA_CONSUMER_SECRET=&quot;your_consumer_secret&quot;
MPESA_PASSKEY=&quot;your_daraja_passkey&quot;
MPESA_SHORTCODE=&quot;174379&quot;
NEXT_PUBLIC_APP_URL=&quot;https://www.mannabooks.co.ke&quot;
                        </pre>
                    </div>
                </div>
            </section>

            {/* SECTION 5: DYNAMIC PRICING & TIERS */}
            <section id="dynamic-pricing" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                    <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">05</span>
                    <h2 className="text-lg font-black uppercase text-black">
                        Dynamic Pricing &amp; Plan Tier Editor
                    </h2>
                </div>

                <div className="text-zinc-700 text-xs font-mono space-y-4 leading-relaxed">
                    <p>
                        Super Admins can edit live pricing, feature bullet points, and quota parameters directly from <Link href="/admin/pricing" className="text-emerald-700 underline font-bold">Pricing &amp; Plan Tiers (/admin/pricing)</Link> without redeploying code.
                    </p>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                        <span className="font-bold text-black text-xs block uppercase">Supported Plan Modifications:</span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-700">
                            <li><strong>Monthly &amp; Annual Pricing:</strong> Set monthly KES rates and customized annual discounts (e.g. 20% savings).</li>
                            <li><strong>Tenant Quotas:</strong> Change max team members and physical stock locations (`-1` = Unlimited $\infty$).</li>
                            <li><strong>Feature Checklists:</strong> Add, edit, or remove marketing bullets displayed on the public <Link href="/pricing" className="underline font-bold">/pricing</Link> page.</li>
                            <li><strong>Card Badges:</strong> Apply custom badges like <em>&quot;Most Popular&quot;</em> or <em>&quot;Best Value&quot;</em>.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* SECTION 6: INVENTORY & STOCK LEDGER */}
            <section id="inventory-ledger" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                    <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">06</span>
                    <h2 className="text-lg font-black uppercase text-black">
                        Multi-Location Inventory &amp; Stock Ledger
                    </h2>
                </div>

                <div className="text-zinc-700 text-xs font-mono space-y-4 leading-relaxed">
                    <p>
                        Inventory is tracked using an immutable double-entry style stock ledger (<code className="bg-zinc-100 px-1 py-0.5 rounded text-black font-bold">inventory_movements</code>) partitioned by physical locations (<code className="bg-zinc-100 px-1 py-0.5 rounded text-black font-bold">stock_locations</code>).
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                            <span className="font-bold text-black text-xs block uppercase">Populate Stock Ledger Banner</span>
                            <p className="text-zinc-600 text-[11px]">
                                If existing catalog products do not have initial ledger balances, the inventory dashboard displays a <strong>&quot;📦 Populate Stock Ledger&quot;</strong> action calling <code className="text-black">migrateCatalogToStockLedger()</code>.
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                            <span className="font-bold text-black text-xs block uppercase">Backfill Historical Location Data</span>
                            <p className="text-zinc-600 text-[11px]">
                                If historical movements lack a <code className="text-black">location_id</code>, clicking <strong>&quot;🔧 Fix Historical Location Data&quot;</strong> attaches them to the workspace&apos;s primary default store.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 7: GENERAL LEDGER & RECONCILIATION */}
            <section id="general-ledger" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                    <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">07</span>
                    <h2 className="text-lg font-black uppercase text-black">
                        Double-Entry General Ledger &amp; Financial Reports
                    </h2>
                </div>

                <div className="text-zinc-700 text-xs font-mono space-y-4 leading-relaxed">
                    <p>
                        The General Ledger suite implements GAAP-compliant double-entry accounting:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-700">
                        <li><strong>Balance Sheet (Statement of Financial Position):</strong> Computes Assets = Liabilities + Equity dynamically from journal entry balances.</li>
                        <li><strong>Trial Balance:</strong> Verifies total Debits equal total Credits across all active Chart of Accounts nodes.</li>
                        <li><strong>Bank &amp; M-Pesa Reconciliation:</strong> Matches parsed bank/M-Pesa CSV statement lines against recorded general ledger journal entries.</li>
                    </ul>
                </div>
            </section>

            {/* SECTION 8: CLI & TROUBLESHOOTING */}
            <section id="troubleshooting" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                    <span className="bg-black text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">08</span>
                    <h2 className="text-lg font-black uppercase text-black">
                        CLI Commands &amp; Production Maintenance
                    </h2>
                </div>

                <div className="text-zinc-700 text-xs font-mono space-y-4 leading-relaxed">
                    <div className="bg-zinc-950 text-white rounded-xl p-4 font-mono text-xs space-y-3">
                        <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">1. Sync Database Schema (Push to Railway PostgreSQL):</span>
                            <code className="text-emerald-400">npm run db:push</code>
                        </div>
                        <div className="border-t border-zinc-800 pt-2">
                            <span className="text-zinc-400 block text-[10px] uppercase">2. Elevate Account to Super Admin (ROOT):</span>
                            <code className="text-emerald-400">npm run make:admin admin@corbantechnologies.org</code>
                        </div>
                        <div className="border-t border-zinc-800 pt-2">
                            <span className="text-zinc-400 block text-[10px] uppercase">3. TypeScript Type Safety Check:</span>
                            <code className="text-emerald-400">npx tsc --noEmit</code>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
