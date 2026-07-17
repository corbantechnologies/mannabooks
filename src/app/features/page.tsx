// src/app/features/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: "Features | Manna Books — KRA eTIMS Invoicing, Statutory Payroll & POS Platform",
  description:
    "Explore all Manna Books platform features: KRA eTIMS multi-rate invoicing, statutory payroll (PAYE, SHIF, AHL, NSSF), walk-in POS terminal, smart inventory with COGS tracking, 20th VAT return automation, A4 vector PDF engine, and passwordless client portals.",
  keywords: [
    "KRA eTIMS features Kenya",
    "statutory payroll PAYE SHIF NSSF Kenya",
    "invoicing software features Kenya",
    "walk-in POS Kenya",
    "inventory management Kenya",
    "VAT tracker Kenya",
    "mannabooks.co.ke features",
  ],
  openGraph: {
    title: "Platform Features | Manna Books — KRA eTIMS, Payroll & POS",
    description: "Complete feature specifications for Manna Books: eTIMS invoicing, statutory payroll, walk-in POS, COGS analytics, and passwordless client portals — built for Kenyan SMEs.",
    url: "https://mannabooks.co.ke/features",
    siteName: "Manna Books",
    locale: "en_KE",
    type: "website",
  },
  alternates: {
    canonical: "https://mannabooks.co.ke/features",
  },
};

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/guide", label: "Guide" },
  { href: "/login", label: "Login" },
];

export default function FeaturesPage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans">

      <PublicNavbar />



      <main className="flex-1 flex flex-col">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HERO */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-zinc-200/80 px-6 py-16 md:py-24 max-w-7xl mx-auto w-full space-y-7">
          <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded-full font-semibold text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Platform Capabilities &amp; Technical Specifications
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none uppercase max-w-5xl">
            Complete platform<br />
            <span className="text-zinc-400">feature specifications.</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-600 max-w-3xl font-normal leading-relaxed">
            Manna Books is an end-to-end financial operations &amp; statutory compliance platform engineered for Kenyan and African SMEs. Explore every module, compliance engine, inventory system, and architectural pillar built into the platform.
          </p>
          <div className="pt-2 flex flex-wrap gap-3 font-mono text-xs">
            {[
              { href: "#pos", label: "Walk-in POS" },
              { href: "#invoicing", label: "Invoicing & eTIMS" },
              { href: "#inventory", label: "Smart Inventory" },
              { href: "#payroll", label: "Statutory Payroll" },
              { href: "#expenses", label: "Expenses" },
              { href: "#crm", label: "CRM" },
              { href: "#vat", label: "20th VAT Tracker" },
              { href: "#pdf-engine", label: "Vector PDF" },
              { href: "#portals", label: "Passwordless Portals" },
              { href: "#b2b-inbox", label: "B2B Inbox" },
              { href: "#analytics", label: "A/R & Analytics" },
              { href: "#team", label: "Team Management" },
              { href: "#general-ledger", label: "General Ledger" },
              { href: "#income-tax", label: "Kenya Income Tax" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase">
                {link.label}
              </a>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* DETAILED FEATURE MODULES */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto w-full px-6 py-16 space-y-20">

          {/* MODULE 0: WALK-IN POS */}
          <div id="pos" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-emerald-700 text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 00</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Walk-in Sales POS Counter Terminal
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Dedicated rapid point-of-sale terminal for instant counter sales. No client account required — select items, process payment, and an official PAID receipt is generated with automatic inventory deduction.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Rapid Product Catalog", body: "Search and add catalog items by name or SKU code. Cart indicator badges show quantities already added. Blocked-out items when stock runs out." },
                { title: "Multi-Method Payment", body: "Accept M-Pesa (with transaction reference), Cash (with change calculator), or Bank/Card payments. All logged against the receipt for audit trails." },
                { title: "Instant Receipt & Stock", body: "One-tap checkout generates an official PAID receipt and automatically decrements tracked inventory levels in real-time. Walk-in or assigned client." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-emerald-400 hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 1: INVOICING & ETIMS */}
          <div id="invoicing" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 01</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Invoicing, Procurement &amp; eTIMS Engine
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Full billing lifecycle from Quotation → Invoice → Receipt. Issue formal procurement LPOs, POs, and GRNs for suppliers. Embed KRA eTIMS CU numbers and multi-rate tax calculations on every document.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Multi-Rate Tax Billing", body: "Support for KRA 16% Standard Output VAT, 0% Zero-Rated export lines, and Tax EXEMPT items on a per-line-item basis with automatic tax pooling." },
                { title: "KRA CU & PIN Fields", body: "Embed official KRA eTIMS Control Unit (CU) serial numbers and merchant/client KRA PINs on all formal financial documents for statutory audit compliance." },
                { title: "Full Document Lifecycle", body: "Issue Quotations with 1-click conversion to Invoices, Receipts, Purchase Orders, LPOs, GRNs, Credit Notes, and Debit Notes — tracked through DRAFT → ISSUED → PAID states." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 2: SMART INVENTORY & COGS */}
          <div id="inventory" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 02</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Smart Inventory &amp; COGS Margin Tracking
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Register catalog items as Products (with stock tracking) or Services. Set selling prices and cost prices (COGS) to automatically power gross profit margin intelligence in the analytics dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Product vs. Service Types", body: "Classify catalog items as tangible Products (eligible for stock tracking) or intangible Services (labor, consulting). Services skip inventory tracking entirely." },
                { title: "Auto Stock Deduction", body: "When a RECEIPT or POS walk-in sale is completed, tracked product quantities are automatically decremented. Low-stock alerts fire at configurable threshold levels." },
                { title: "COGS & Profit Margins", body: "Set a cost price (COGS) per product. The analytics engine automatically calculates gross profit (Revenue − COGS) and gross margin % across all settled sales." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 3: STATUTORY PAYROLL */}
          <div id="payroll" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 03</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Statutory Payroll &amp; Wage Compiler
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Execute full statutory payroll runs for staff, casual wages, and commissions. Automatically computes all Kenyan statutory deductions and generates A4 Landscape multi-column payroll voucher PDFs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Kenyan Statutory Tax Bands", body: "Automatic progressive PAYE computation (10%, 25%, 30%, 32.5%, 35% bands) with KES 2,400 monthly Personal Relief offsets and gross-to-net reconciliation." },
                { title: "SHIF, AHL & NSSF Reserves", body: "Calculates Social Health Insurance Fund (SHIF 2.75%), Affordable Housing Levy (AHL 1.5%), and NSSF Tier I & II deductions automatically per employee." },
                { title: "Custom Schedules & Dispatch", body: "Run weekly or monthly payrolls with custom payout dates. Save as DRAFT, lock when ready, and dispatch email payslips to staff instantly." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 4: KRA 20TH VAT TRACKER */}
          <div id="vat" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 04</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Statutory KRA 20th VAT Return Tracker
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Kenya requires monthly VAT returns to be remitted on iTax before the 20th of each month. Manna Books automates all the number aggregation so you can file accurately and on time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Real-Time Tax Aggregation", body: "Automatically calculates 16% Output VAT liability, zero-rated volumes, and tax-exempt sales for the active calendar month from all issued documents." },
                { title: "Live 20th Countdown", body: "Displays a live countdown to KRA's monthly 20th VAT filing deadline — color-coded urgency (green > 10 days, amber < 10, red < 5) to prevent late penalties." },
                { title: "Compliance Audit Ledgers", body: "All issued invoices, receipts, and tax positions are stored immutably for easy cross-referencing during KRA iTax and eTIMS compliance audits." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 5: VECTOR PDF ENGINE */}
          <div id="pdf-engine" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 05</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                A4 Landscape Vector PDF Engine
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Powered by @react-pdf/renderer. Every document generates a professional, print-ready vector PDF with embedded logos, tax PINs, payment references, and line-item breakdowns.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: "🧾",
                  title: "A4 Vector PDF Engine",
                  desc: "Generate pixel-perfect A4 invoice and receipt PDFs instantly, optimized for both digital sharing and physical thermal or laser printing."
                },
                {
                  icon: "🔄",
                  title: "Retainers & Recurring Billing",
                  desc: "Put service billing on autopilot. Set monthly, quarterly, or yearly recurring schedules, and auto-dispatch overdue aging reminders with a single click."
                },
                {
                  icon: "💱",
                  title: "Multi-Currency Native",
                  desc: "Bill local and international clients effectively. Switch between KES, USD, GBP or EUR natively on a per-document basis without breaking ledger math."
                },
                {
                  icon: "📦",
                  title: "Smart Procurement Flow",
                  desc: "Generate Purchase Orders and LPOs. When marked as PAID/RECEIVED, your inventory inflow is automatically updated in real-time."
                },
                {
                  icon: "⚡",
                  title: "Rapid Bulk Provisioning",
                  desc: "Import catalogs faster than a CSV upload with our dynamic 15-item bulk provisioner. Set COGS, margins, and VAT classes in one screen."
                },
                { title: "11-Column Payroll PDF", body: "Generates A4 Landscape payroll vouchers with 11 unbundled columns: Base, Allowances, Commission, Gross, PAYE, SHIF, AHL, NSSF, Advances, Deductions, Net Pay." },
                { title: "Instant Download Links", body: "Download PDFs instantly from any document detail page with standardized file naming (MannaBooks_INV-2026-XXXX.pdf) for organized record keeping." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body || item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 6: PASSWORDLESS PORTALS */}
          <div id="portals" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 06</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Passwordless Client &amp; Staff Portals
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Clients receive secure 64-character token links to their invoices and receipts — no accounts, no passwords, no friction. Share via WhatsApp, email, or any messaging channel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "64-Character Token Security", body: "Every document generates a cryptographically secure, unguessable 64-character hex token link — unique per document, public-safe, and revokable." },
                { title: "Zero-Password Client Access", body: "Clients view invoices, inspect remittance details, and download vector PDFs without creating accounts or entering passwords — works in any browser." },
                { title: "Resend Email Dispatch", body: "Send branded HTML email notifications with shop logo, brand color CTA buttons, and secure portal links directly from your Manna workspace." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 7: ANALYTICS & A/R AGING */}
          <div id="analytics" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 07</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Business Intelligence &amp; A/R Aging Matrix
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Real-time executive analytics across every dimension of your business: cash flow streams, profitability margins, inventory velocity, client lifetime value, and accounts receivable aging risk.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "COGS & Gross Margin", body: "Live gross profit margin analysis (Revenue − COGS) using product cost prices. Visual margin progress bar and profitability breakdown across all settled sales in the timeframe." },
                { title: "A/R Aging Breakdown", body: "Categorizes pending invoices into 0–30, 31–60, 61–90, and 90+ day Accounts Receivable risk brackets with proportional risk bar visualization." },
                { title: "Sales Velocity & Client LTV", body: "Top product bestsellers by revenue and quantity sold. Client Lifetime Value (LTV) ranking with revenue concentration share — across This Month, Quarter, Year, or All Time." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 8: CRM — CLIENT & SUPPLIER NETWORK */}
          <div id="crm" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 08</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                CRM — Client &amp; Supplier Relationship Hub
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Maintain a structured directory of all clients and suppliers. Track corporate and individual profiles, KRA PINs, and payment references for seamless billing and procurement.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Client Profiles", body: "Maintain individual and corporate client profiles with KRA PINs, contact details, and billing address. Tag clients as Walk-in, Individual, or Corporate for document context." },
                { title: "Supplier Network & Cross-Sync", body: "Build a structured supplier directory. If a business acts as both a client and supplier, 1-click clone their profile with smart badges linking the dual profiles together." },
                { title: "Client Lifetime Value", body: "The analytics engine automatically computes each client's lifetime revenue contribution and ranks them by LTV — so you always know your most valuable relationships." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 9: OPERATING EXPENSES */}
          <div id="expenses" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 09</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Operating Expenses Tracker
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Log and categorize all business operating expenses. Track spend across Rent, Utilities, Fuel, Marketing, Salaries, and custom categories — with full payment audit trails.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Categorized Spend Tracking", body: "Log expenses under predefined categories: Rent, Utilities, Fuel, Marketing, Salaries, Office Supplies, and a custom Other bucket — keeping your P&L organized." },
                { title: "Payment Method & Reference", body: "Record the payment mode (M-Pesa, Cash, Bank Transfer, Card) and transaction reference number for every expense — creating a complete audit trail for accountants." },
                { title: "Expense Analytics", body: "Expenses feed directly into the analytics dashboard, showing total operating costs alongside gross revenue and profit — giving you a true picture of net operating income." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 10: TEAM MANAGEMENT */}
          <div id="team" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-emerald-700 text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 10</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Team Management &amp; RBAC
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Invite your accountants, managers, and staff into your workspace with role-based access control. Each role has granular permission scopes so team members only see what they need to.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Role-Based Access (RBAC)", body: "Assign roles: Owner, Admin, Manager, Accountant, Employee, or Viewer. Each role carries pre-defined permission scopes enforced server-side on every action." },
                { title: "Email Invitation System", body: "Invite team members by email. New users receive a branded onboarding email with a secure invite link. Existing Manna Books users are added instantly to your workspace." },
                { title: "Invitation History & Audit", body: "Track the full invitation lifecycle: Pending, Accepted, and Revoked. Revoke access at any time. A complete audit trail is maintained for compliance." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 11: B2B NETWORK INBOX */}
          <div id="b2b-inbox" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 11</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                B2B Network Inbox &amp; Read Receipts
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Manna Books workspaces can securely communicate with each other. Send invoices, POs, and receipts directly to another business&apos;s inbox within the platform using strict PIN and Email matching.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Secure Document Routing", body: "Documents are routed across workspaces matching strictly by KRA PIN and Business Email, ensuring no collisions or unauthorized access." },
                { title: "Inbox Zero Architecture", body: "A dedicated B2B Inbox for incoming documents. Read documents, archive completed ones, or restore them. Keep your workflow clean." },
                { title: "Live Read Receipts", body: "When you send a document via the network, know exactly when the recipient opens it with automatic '👁️ Viewed' read receipts." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 12: GENERAL LEDGER & FINANCIAL REPORTING */}
          <div id="general-ledger" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 12</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                General Ledger &amp; Double-Entry Bookkeeping
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Full-featured Double-Entry Accounting framework. Complete chart of accounts, customizable opening balances, monthly accounting periods with backdate controls, and real-time trial balance, P&L, and balance sheet reporting.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Standardized Chart of Accounts", body: "Configurable double-entry accounts mapped across Assets, Liabilities, Equity, Revenue, Cost of Sales, and Operating Expenses. Full audit trial ledger entries." },
                { title: "Closing Accounting Periods", body: "Close monthly accounting periods to lock down transactions and prevent backdating. Grant custom roles specific override permissions to reopen when necessary." },
                { title: "Real-time Financial Statements", body: "Dynamic Profit & Loss, Balance Sheet, and Trial Balance reports compiled instantly from ledger postings. Easily exportable for board or compliance audits." },
              ].map((item) => (
                <div key={item.title} className="border border-zinc-200/80 rounded-xl p-6 bg-white space-y-3 hover:border-black hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 13: KENYA INCOME TAX COMPLIANCE SUITE */}
          <div id="income-tax" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-emerald-700 text-white px-2.5 py-1 uppercase rounded-sm shrink-0">MODULE 13</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Kenya Income Tax Compliance Suite
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              KRA-compliant tax computation and instalment tracking module. Automatically assess Corporate Income Tax (CIT) obligations, Wear &amp; Tear Wear register allowances, and Turnover Tax (TOT) liabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Corporate Income Tax (CIT)", body: "Annual tax computation including non-deductible add-backs (marketing, entertainment) and capital allowances. Instantly determine resident/non-resident company liabilities." },
                { title: "Fixed Assets & Capital Allowances", body: "Categorize fixed assets into KRA Class bands (Class I 50%, Class II 25%, Class III 25%, Class IV 10%) to auto-calculate annual wear-and-tear depreciation deduction." },
                { title: "Instalment & Turnover Tax (TOT)", body: "Quarterly CIT instalment scheduler (with KES 30,000 auto-obligation check) and Turnover Tax (TOT) 1.5% calculation on monthly gross revenue." },
              ].map((item) => (
                <div key={item.title} className="border border-emerald-200 rounded-xl p-6 bg-white space-y-3 hover:border-emerald-400 hover:shadow-md transition-all">
                  <span className="text-emerald-700 font-bold uppercase block text-xs font-mono">&gt; {item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* CTA BANNER */}
        <section className="relative border-t border-zinc-200/80 bg-zinc-950 text-white py-24 px-6 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-semibold bg-emerald-950/80 border border-emerald-800/50 px-3.5 py-1 rounded-full inline-block">
              GET STARTED NOW
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight font-sans max-w-2xl mx-auto leading-tight">
              Every module. <br className="sm:hidden" />
              <span className="text-zinc-400">One workspace.</span>
            </h2>
            <p className="text-sm text-zinc-400 font-sans leading-relaxed max-w-xl mx-auto">
              Initialize your Manna Books workspace in under 3 minutes. POS, eTIMS invoicing, statutory payroll, inventory tracking, and analytics — all ready out of the box.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center font-mono text-xs">
              <Link 
                href="/signup" 
                className="w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-100 px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-md text-center hover:scale-[1.02] active:scale-[0.98]"
              >
                Initialize Your Workspace &rarr;
              </Link>
              <Link 
                href="/pricing" 
                className="w-full sm:w-auto border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500 hover:text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
              >
                View Pricing
              </Link>
              <Link 
                href="/contact" 
                className="w-full sm:w-auto border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500 hover:text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 text-xs text-zinc-500 font-mono gap-4">
        <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-black font-semibold">Corban Technologies LTD</Link></p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:underline hover:text-black">Terms</Link>
          <Link href="/privacy" className="hover:underline hover:text-black">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
