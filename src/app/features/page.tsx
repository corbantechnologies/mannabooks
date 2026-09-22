// src/app/features/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: "Features | Manna Books — KRA eTIMS, General Ledger, Bank Reconciliation & Multi-Currency",
  description:
    "Explore all Manna Books platform features: KRA eTIMS invoicing, statutory payroll, bank & M-Pesa CSV reconciliation, compound multi-line journals, accounts payable vendor bills, bulk invoicing, fiscal periods, walk-in POS terminal, smart inventory, and double-entry general ledger.",
  keywords: [
    "KRA eTIMS features Kenya",
    "bank reconciliation software Kenya",
    "M-Pesa statement reconciliation",
    "compound multi-line journals",
    "accounts payable vendor bills Kenya",
    "bulk invoicing Kenya",
    "statutory payroll PAYE SHIF NSSF Kenya",
    "invoicing software features Kenya",
    "walk-in POS Kenya",
    "general ledger double entry Kenya",
    "multi-currency accounting Kenya",
    "financial management software Kenya",
    "mannabooks.co.ke features",
  ],
  openGraph: {
    title: "Platform Features | Manna Books — KRA eTIMS, General Ledger, Bank Reconciliation & Payroll",
    description: "Complete feature specifications for Manna Books: eTIMS invoicing, bank & M-Pesa reconciler, multi-line compound journals, vendor bills, statutory payroll, digital catalogs, and double-entry accounting.",
    url: "https://mannabooks.co.ke/features",
    siteName: "Manna Books",
    locale: "en_KE",
    type: "website",
  },
  alternates: {
    canonical: "https://mannabooks.co.ke/features",
  },
};

export default function FeaturesPage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-[#064e3b] selection:text-white font-sans">

      <PublicNavbar />

      <main className="flex-1 flex flex-col">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HERO */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-zinc-200/80 px-6 py-16 md:py-24 max-w-7xl mx-auto w-full space-y-7 bg-white">
          <div className="inline-flex items-center gap-2 border border-emerald-200 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest bg-emerald-50 rounded-full font-semibold text-[#064e3b]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Platform Capabilities &amp; Technical Specifications
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none uppercase max-w-5xl text-black">
            Complete platform<br />
            <span className="gradient-text-emerald">feature specifications.</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-600 max-w-3xl font-normal leading-relaxed">
            Manna Books is an end-to-end financial operations, double-entry accounting &amp; statutory compliance platform engineered for Kenyan and African SMEs. Explore every module, compliance engine, reconciliation tool, and architectural pillar built into the platform.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5 font-mono text-xs">
            {[
              { href: "#pos", label: "Walk-in POS" },
              { href: "#invoicing", label: "Invoicing & eTIMS" },
              { href: "#catalog-showcase", label: "Digital Catalog & Rate Cards" },
              { href: "#inventory", label: "Smart Inventory & Reconciler" },
              { href: "#notifications", label: "In-App Activity Bell" },
              { href: "#payroll", label: "Statutory Payroll" },
              { href: "#expenses", label: "Expenses" },
              { href: "#crm", label: "CRM & Debtors" },
              { href: "#vat", label: "20th VAT Tracker" },
              { href: "#pdf-engine", label: "Vector PDF" },
              { href: "#portals", label: "Passwordless Portals" },
              { href: "#analytics", label: "A/R & Advanced Analytics" },
              { href: "#team", label: "Staff & Granular RBAC" },
              { href: "#currencies", label: "Multi-Currency & FX" },
              { href: "#b2b-inbox", label: "B2B Inbox" },
              { href: "#general-ledger", label: "General Ledger" },
              { href: "#income-tax", label: "Kenya Income Tax" },
              { href: "#reconciliation", label: "Bank & M-Pesa Reconciliation" },
              { href: "#compound-journals", label: "Compound Multi-Line Journals" },
              { href: "#accounts-payable", label: "Accounts Payable & Bills" },
              { href: "#bulk-actions", label: "Bulk Operations" },
              { href: "#fiscal-periods", label: "Fiscal Periods & Exports" },
              { href: "#business-modes", label: "3 Workspace Modes" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="btn-secondary-emerald px-3 py-1.5 text-xs font-semibold uppercase">
                {link.label}
              </a>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* DETAILED FEATURE MODULES */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto w-full px-6 py-16 space-y-20 bg-white">

          {/* MODULE 0: WALK-IN POS */}
          <div id="pos" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 00</span>
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
                { title: "Multi-Method Payment & Change", body: "Accept M-Pesa (with transaction reference), Cash (with change calculator), or Bank/Card payments. All logged against the receipt for audit trails." },
                { title: "Instant Receipt & Stock", body: "One-tap checkout generates an official PAID receipt and automatically decrements tracked inventory levels in real-time. Walk-in or assigned client." },
                { title: "58mm & 80mm Thermal Printing", body: "Continuous thermal ticket formatting for ESC/POS roll printers. Monospaced lines, store header, KRA PIN, itemized tax codes, and eTIMS CU QR verification." },
                { title: "Zero-Click Kiosk Silent Mode", body: "Supports Chrome/Edge kiosk printing (--kiosk-printing) for high-traffic retail counters — prints and cuts receipts instantly with zero popup dialogs." },
                { title: "1-Click Receipt Reprint", body: "Reprint 58mm or 80mm thermal slips at any time directly from the Document Status Panel or Fiscal Ledgers stream." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 1: INVOICING & ETIMS */}
          <div id="invoicing" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 01</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Invoicing, Procurement, Quotation Expiry &amp; eTIMS Engine
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Full billing lifecycle from Quotation → Invoice → Receipt. Issue formal procurement LPOs, POs, and GRNs for suppliers. Embed KRA eTIMS CU numbers, multi-rate tax calculations, and set quotation expiry dates with automated cancellation sweeps.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Item-Level VAT Provisioning", body: "Explicit 16% Standard VAT, 0% Zero-Rated, and Tax EXEMPT rules applied per line item. Computes and displays dedicated VAT line items right above Grand Total." },
                { title: "Quotation Expiry & Validity Presets", body: "Configure quotation expiry dates with quick preset buttons (+7d, +14d, +30d, +60d). Expired quotations display warning banners on client portals and are swept automatically by cron." },
                { title: "KRA CU & PIN Compliance", body: "Embed official KRA eTIMS Control Unit (CU) serial numbers and merchant/client KRA PINs on all formal financial documents for statutory audit compliance." },
                { title: "Credit Notes & Debit Notes", body: "Issue double-entry credit and debit notes with automatic general ledger postings against Sales Revenue (4100), Accounts Receivable (1100), or Cash & Bank (1200)." },
                { title: "Supplier Procurement Terms", body: "Dedicated procurement formatting for LPOs, POs, GRNs, and Payment Vouchers — automatically suppressing customer sales terms and displaying agreed vendor remittance criteria." },
                { title: "Goods Receiving Stock Inflow", body: "Transitioning an LPO, PO, or Goods Received Note (GRN) to RECEIVED or PAID status automatically executes physical stock inflow crediting inventory balances." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 2: DIGITAL PRODUCT CATALOG & RATE CARDS */}
          <div id="catalog-showcase" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 02</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Shareable Digital Product Catalog &amp; Rate Cards
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Share your product catalog or curated product lists with prospective clients. Customers can browse models, view specifications and selling prices (with your profit margins strictly hidden), and submit quote requests directly into your dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Public Digital Showcase", body: "Live, mobile-optimized catalog portal (/portal/catalog/[slug]) displaying your brand logo, contact channels, product models, SKUs, and selling prices." },
                { title: "Curated Selection Sharing", body: "Select specific products (e.g. 5 specific All-in-One PCs) to generate targeted public links and PDF price sheets containing only those selected models." },
                { title: "Automated Quotation Request", body: "Clients pick items and click 'Request Quotation'. The system instantly registers their contact and generates an ISSUED Quotation in your Manna Books workspace." },
                { title: "Branded PDF Price Sheets", body: "1-click export of print-ready vector PDF rate cards complete with company branding, KRA PIN, item descriptions, and pricing — ideal for WhatsApp and email." },
                { title: "1-Click WhatsApp Sharing", body: "Instantly generate and send pre-filled WhatsApp messages with your curated catalog link directly to clients." },
                { title: "Zero Data Duplication", body: "Your catalog is powered directly by your product inventory — any price or name update reflects immediately on the live link and PDF." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 3: SMART INVENTORY & RECONCILER */}
          <div id="inventory" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 03</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Multi-Location Inventory, COGS &amp; Discrepancy Reconciler
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Define physical stock locations (warehouses, stores, branches) and track products across them with a real-time, double-entry audit trail ledger. Monitor profit margins, low stock status, and value on-hand inventory.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { title: "Multi-Location Warehouses", body: "Map physical warehouses, retail stores, branches, or stock floors. Assign locations dynamically to stock movements and set per-workspace default locations." },
                { title: "Immutable Stock Ledger", body: "Every inventory action — purchases, POS checkouts, invoice adjustments, or manual corrections — writes an unalterable audit log tracking quantity, cost, and running balance." },
                { title: "1-Click Discrepancy Reconciler", body: "One-click automated tool on Inventory & Locations dashboards that scans, identifies, and synchronizes discrepancies between product catalog records and location stock." },
                { title: "Secure Stock Transfers", body: "Move stock between locations with in-transit lifecycle validation. Dispatch from source (deducts stock) and receive at destination (credits stock) with partial-receipt support." },
                { title: "Advanced Stock Reporting", body: "Generate real-time FIFO stock valuations, inspect full ledger histories, review active low-stock alerts, and perform ABC revenue Pareto analyses." },
                { title: "Real-Time Catalog Sync", body: "Editing product catalog stock quantities automatically updates the designated warehouse location balance and creates an audit adjustment log." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 4: IN-APP ACTIVITY BELL & NOTIFICATIONS */}
          <div id="notifications" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 04</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                In-App Notifications &amp; Activity Bell
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Stay in complete control of workspace operations with a real-time activity bell in the top navigation bar. Receive immediate notifications on customer quotation actions, overdue receivables, low inventory, and system alerts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Real-Time Unread Badge Counter", body: "Bell icon with dynamic unread counter badge displayed on both desktop top nav and mobile drawer headers." },
                { title: "Quotation Acceptance Alerts", body: "Instant notification when a client formally accepts or signs an issued quotation on their passwordless portal." },
                { title: "Quotation Amendment Requests", body: "Direct notification with links when a client requests price updates or scope revisions on an active quote." },
                { title: "Overdue Invoices & Expiry Sweeps", body: "Automated alerts when invoices cross due dates or when expired quotations are automatically cancelled by system sweeps." },
                { title: "Categorized Filter Tabs", body: "Toggle between 'All' and 'Unread' notifications with colored tags (Overdue, Subscription, Low Stock, Quote Accepted, System)." },
                { title: "1-Click 'Mark All as Read'", body: "Optimistic, fast clearing of notifications with single-click dismissal and automatic navigation to relevant documents." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 5: STATUTORY PAYROLL */}
          <div id="payroll" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 05</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 6: KRA 20TH VAT TRACKER */}
          <div id="vat" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 06</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 7: VECTOR PDF ENGINE */}
          <div id="pdf-engine" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 07</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Vector PDF Engine &amp; Thermal Receipt Slips
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Powered by @react-pdf/renderer and continuous ESC/POS formatting. Every document generates a professional vector PDF or a 58mm/80mm thermal ticket with embedded logos, tax PINs, payment references, and eTIMS verification QR codes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  title: "A4 Vector Invoices & Receipts",
                  body: "Generate pixel-perfect A4 invoice and receipt PDFs instantly, optimized for digital sharing, WhatsApp, or physical printing."
                },
                {
                  title: "58mm & 80mm Thermal Slips",
                  body: "Optimized continuous-roll ticket layouts with dashed separators, tax breakdowns, tendered change, and official KRA eTIMS QR verification."
                },
                {
                  title: "Product Rate Card PDFs",
                  body: "Export branded product catalog sheets and price lists with company logos, contact info, SKUs, and selling prices."
                },
                {
                  title: "11-Column Payroll PDF",
                  body: "Generates A4 Landscape payroll vouchers with 11 unbundled columns: Base, Allowances, Commission, Gross, PAYE, SHIF, AHL, NSSF, Advances, and Net Pay."
                },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 8: PASSWORDLESS PORTALS */}
          <div id="portals" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 08</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Passwordless Client Portals &amp; Interactive Quotes
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Clients receive secure 64-character token links to their invoices and receipts — no accounts, no passwords, no friction. Clients can inspect remittance details, accept quotations with electronic signatures, or request updated quotes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "64-Character Token Security", body: "Every document generates a cryptographically secure, unguessable 64-character hex token link — unique per document, public-safe, and revokable." },
                { title: "Interactive Quotation Acceptance", body: "Clients can review terms, sign electronically, and accept quotations directly on the portal — triggering instant in-app alerts for the workspace owner." },
                { title: "Quotation Amendment Requests", body: "Clients can submit modification requests if pricing or scope needs adjustment, creating clear audit trails before formal invoice generation." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 9: ADVANCED ANALYTICS & A/R AGING */}
          <div id="analytics" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 09</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Business Intelligence, Trajectories &amp; Leaderboards
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Real-time executive analytics across every dimension of your business: rolling cash flow streams, profitability margins, quotation conversion funnels, top 10 clients leaderboard, and accounts receivable aging risk.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "6-Month / 12-Month Trajectory", body: "Rolling financial cash flow chart with interactive horizon toggles comparing total inflows, outflows, and net profit margins across time." },
                { title: "Top 10 Clients Leaderboard", body: "Ranked leaderboard showing your highest-value customers with invoice counts, lifetime revenue (LTV), and revenue share progress bars." },
                { title: "Product vs Service Split", body: "Visual breakdown contrasting merchandise sales revenue against service fees to reveal your true business revenue drivers." },
                { title: "Quotation Conversion Funnel", body: "Tracks total quotes issued, conversion rate %, and converted revenue realization from quote creation to formal payment." },
                { title: "A/R Aging Breakdown", body: "Categorizes pending invoices into 0–30, 31–60, 61–90, and 90+ day Accounts Receivable risk brackets with proportional risk bar visualization." },
                { title: "COGS & Profit Margins", body: "Real-time gross profit margin analysis (Revenue − COGS) utilizing tracked product cost prices across all settled transactions." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 10: STAFF & GRANULAR RBAC */}
          <div id="team" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 10</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Staff Management &amp; Granular Role-Based Permissions (RBAC)
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Invite your accountants, cashiers, managers, and sales team into your workspace with fine-grained role-based access control. Tailor individual capabilities with granular permission toggles.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Role Hierarchies", body: "Assign predefined roles: Owner, Admin, Manager, Accountant, Employee, or Viewer. Each role carries strict server-enforced authority boundaries." },
                { title: "Granular Permission Toggles", body: "For Employee accounts, toggle specific capabilities: Can Create Documents, Can Edit Clients, Can View Finance, Can Export Reports, Can Manage Products, Can Manage Payroll." },
                { title: "Live Role & Permission Editing", body: "Easily adjust roles or toggle permissions on existing active staff members using the interactive Edit modal without having to delete and re-invite." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 11: MULTI-CURRENCY & FX */}
          <div id="currencies" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 11</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Multi-Currency &amp; Global Foreign Exchange (FX)
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Bill cross-border clients in USD, EUR, GBP, TZS, UGX, or any world currency while maintaining base currency general ledger and statutory KRA reporting.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Base Currency Isolation", body: "Set your workspace base currency (e.g. KES). All balance sheets, VAT returns, and general ledger journal postings resolve accurately to base currency." },
                { title: "Custom Exchange Rates", body: "Configure custom or real-time foreign exchange multipliers per currency in System Settings with automatic rate conversion on document builder forms." },
                { title: "Multi-Currency Documents", body: "Issue invoices, quotations, and receipts in foreign currencies with automatic FX conversion metadata embedded on PDFs and portals." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 12: CRM — CLIENT & SUPPLIER NETWORK */}
          <div id="crm" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 12</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 13: OPERATING EXPENSES */}
          <div id="expenses" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 13</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 14: B2B NETWORK INBOX */}
          <div id="b2b-inbox" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 14</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 15: GENERAL LEDGER & FINANCIAL REPORTING */}
          <div id="general-ledger" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 15</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                General Ledger &amp; Double-Entry Bookkeeping
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Full-featured Double-Entry Accounting framework. Standardized chart of accounts, multi-month operating budget planner with 1-click cloning, accounting period financial inspector, and automated clean slate resets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Standardized Chart of Accounts", body: "Configurable double-entry accounts mapped across Assets, Liabilities, Equity, Revenue, Cost of Sales, and Operating Expenses with immutable journal trails." },
                { title: "Statement of Financial Position", body: "Complete Balance Sheet reporting tracking Current & Fixed Assets, Liabilities, and Shareholder Equity with real-time A = L + E validation." },
                { title: "Bank & M-Pesa Reconciliation", body: "Upload bank statements or Safaricom M-Pesa CSV exports to auto-match settlement entries against GL Account 1200 with live variance tracking." },
                { title: "Client Statement of Account", body: "Dedicated A/R running balance ledgers for clients with date-range filters, debit/credit entries, running balances, and instant CSV/PDF export." },
                { title: "Operating Budgets & Cloning", body: "Track budget vs actuals across past and future calendar months. 1-click 'Copy Last Month's Budget' feature to carry forward expense allocations effortlessly." },
                { title: "Period Detail Inspector", body: "Inspect monthly gross revenue, expenses, net income, and double-entry balance check (DR = CR) alongside a real-time stream of all journal entries." },
                { title: "Clean Slate & Auto-Backup", body: "Wipe transactions to start afresh with 0001 sequences (Fresh Accounting Reset) or full factory wipe, with automated JSON backup downloads before any purge." },
                { title: "Closing Accounting Periods", body: "Close monthly accounting periods to lock down transactions and prevent backdating. Grant custom roles specific override permissions to reopen when necessary." },
                { title: "Real-time Financial Statements", body: "Dynamic Profit & Loss, Balance Sheet, Cash Flow, and Trial Balance reports compiled instantly from ledger postings for board or compliance audits." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 16: KENYA INCOME TAX COMPLIANCE SUITE */}
          <div id="income-tax" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 16</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 17: BANK & M-PESA CSV RECONCILIATION ENGINE */}
          <div id="reconciliation" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 17</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Bank &amp; M-Pesa CSV Statement Reconciliation Engine
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Eliminate manual bank statement audit headaches. Upload raw CSV exports from any commercial bank (corporate or retail online banking) or Safaricom M-Pesa (Till, Paybill, or B2B). The engine inverts bank statements (Bank Credit = Book Debit), auto-pairs matching transactions against Account 1200, and computes real-time statement variance down to KES 0.00.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Universal Commercial Bank Format Support", body: "Natively parses both standard 6-column commercial bank statements (Date, Ref, Narrative, Dr, Cr, Balance) and compact 4-column M-Pesa Business portal exports without tedious manual formatting." },
                { title: "Smart Auto-Matching Algorithm", body: "Instantly pairs external statement rows against internal GL journal entries using exact amount match (±0.01), direction inversion, and M-Pesa/check reference code verification." },
                { title: "1-Click Adjustments & Discrepancy Logger", body: "Directly create balancing journal entries for bank maintenance fees, withholding tax withholdings, or interest charges on the fly with live variance counter countdown to zero." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 18: COMPOUND MULTI-LINE JOURNAL ENTRY BUILDER */}
          <div id="compound-journals" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 18</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Compound Multi-Line Journal Entry Builder
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Full double-entry flexibility for professional accountants. Create arbitrary N-line compound journal entries with dynamic line additions, searchable Chart of Accounts, and real-time mathematical validation ensuring total debits equal total credits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Arbitrary N-Line Compound Postings", body: "Construct complex multi-line journals for monthly payroll accruals (splitting gross salary, PAYE, NSSF, SHIF, and net pay), mixed asset purchases with cash deposits, and debt restructurings." },
                { title: "Real-Time Balance & Auto-Balance Helper", body: "Live out-of-balance counter with disabled submission guards until total debits match total credits (Δ = 0.00). Includes 1-click Auto-Balance helper to calculate residual balancing entries." },
                { title: "Audit Trail & Document Attachments", body: "Every compound journal captures operator identity, timestamp, backdated audit justifications, and optional PDF/receipt image attachments for seamless external audit review." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 19: ACCOUNTS PAYABLE & VENDOR BILLS */}
          <div id="accounts-payable" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 19</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Accounts Payable (Vendor Bills) &amp; Remittance Advice
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Institutional procurement and vendor credit management. Track vendor obligations from bill receipt through multi-tier approval, payables aging categorization, and payment voucher execution with automated remittance dispatch.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Inbound Bill Registration & WHT", body: "Record vendor invoices with line-item GL expense and asset assignments, payment terms (Net 30, Net 60), and automated Withholding Tax (WHT 5% or 10%) deductions." },
                { title: "Payables Aging Analysis (30/60/90+)", body: "Real-time vendor liability categorization across Current, 1-30, 31-60, 61-90, and 90+ days overdue to optimize working capital and maintain vendor creditworthiness." },
                { title: "Payment Vouchers & Remittance Slips", body: "Authorizing disbursements debits Accounts Payable (2100) and credits Bank (1200), instantly generating official PDF payment vouchers and automated remittance emails to suppliers." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 20: BULK ACTIONS & HIGH-VOLUME OPERATIONS */}
          <div id="bulk-actions" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 20</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Bulk Actions &amp; High-Volume Financial Operations
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Scale your accounting throughput. Process recurring monthly invoicing across all retainer clients, execute multi-select batch emails with PDF attachments, bundle audit packs as ZIP files, and upload historical journal migrations in seconds.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Bulk Retainer Invoicing & Multi-Email", body: "Generate recurring monthly invoices for corporate retainers in 1 click. Multi-select invoices to trigger batch personalized email delivery with attached vector PDFs and payment links." },
                { title: "Batch Vendor Payment Runs (EFT / M-Pesa)", body: "Select approved supplier bills to generate consolidated payment schedules, export Bank EFT batch upload sheets or M-Pesa B2B manifests, and clear AP balances in one master voucher." },
                { title: "Atomic Bulk Journal CSV Importer", body: "Seamlessly migrate from QuickBooks, Sage, or Excel with our transactional CSV importer. Guarantees all-or-nothing database integrity with line-specific validation reporting." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 21: FISCAL PERIODS & REPORT EXPORTS */}
          <div id="fiscal-periods" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 21</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Fiscal Years, Monthly Periods &amp; Report Exports
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Complete fiscal calendar governance. Declaring a fiscal year auto-generates 12 monthly accounting periods with strict month-end closing guards, audit-logged reopening workflows, and 1-click CSV spreadsheet / high-res PDF exports across all financial statements.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "12 Monthly Periods & Month-End Locking", body: "Declare custom fiscal years (Jan-Dec or Jul-Jun). Lock closed months to prevent retroactive tampering, backdating, or accidental changes that affect reconciled reports." },
                { title: "Audit-Logged Period Reopening", body: "Authorized administrators can reopen closed periods with a mandatory audit justification reason to post legitimate adjusting entries before re-locking the period." },
                { title: "1-Click CSV & Executive PDF Exports", body: "Export Trial Balance, P&L, Balance Sheet, Cash Flow, Payables Aging, and Client Statements into formula-ready CSV spreadsheets or boardroom-ready PDFs with corporate letterhead." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 22: THREE WORKSPACE OPERATING MODES */}
          <div id="business-modes" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 22</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Three Workspace Operating Modes (Services vs. Retail vs. Hybrid)
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Tailor Manna Books to your exact operational model. Pure financial and service firms enjoy a clean, clutter-free financial workspace without POS or warehouse clutter, while retailers and hybrid enterprises harness physical stock tracking.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Mode 1: Pure Financial & Services", body: "For consultancies, law firms, wealth managers, and SACCOs. POS and warehouse menus are hidden, surfacing General Ledger, Invoicing, Banking, Tax, and Payroll." },
                { title: "Mode 2: Retail & Physical Inventory", body: "For supermarkets, hardware shops, and retail stores. Puts the rapid walk-in POS counter terminal, multi-location stock reconciler, and barcode lookup front and center." },
                { title: "Mode 3: Hybrid Complete Enterprise", body: "The best of both worlds for contractors and distributors. Sell goods with FIFO stock deductions while billing consulting hours and retainers on the same unified tax invoice." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* CTA BANNER */}
        <section className="relative border-t border-zinc-200/80 bg-zinc-950 text-white py-24 px-6 overflow-hidden">
          {/* Subtle emerald background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <span className="font-mono text-[10px] text-emerald-300 uppercase tracking-widest font-semibold bg-emerald-950/80 border border-emerald-800/60 px-3.5 py-1 rounded-full inline-block">
              GET STARTED NOW
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight font-sans max-w-2xl mx-auto leading-tight">
              Every module. <br className="sm:hidden" />
              <span className="text-zinc-400">One workspace.</span>
            </h2>
            <p className="text-sm text-zinc-400 font-sans leading-relaxed max-w-xl mx-auto">
              Initialize your Manna Books workspace in under 3 minutes. POS, digital catalogs, eTIMS invoicing, statutory payroll, inventory tracking, and analytics — all ready out of the box.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center font-mono text-xs">
              <Link 
                href="/signup" 
                className="w-full sm:w-auto btn-primary-emerald px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-center"
              >
                Initialize Your Workspace &rarr;
              </Link>
              <Link 
                href="/pricing" 
                className="w-full sm:w-auto border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-emerald-500 hover:text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all text-center"
              >
                View Pricing
              </Link>
              <Link 
                href="/contact" 
                className="w-full sm:w-auto border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-emerald-500 hover:text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all text-center"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 text-xs text-zinc-500 font-mono gap-4">
        <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-[#064e3b] font-semibold">Corban Technologies LTD</Link></p>
        <div className="flex gap-6">
          <Link href="/features" className="hover:underline hover:text-[#064e3b]">Features</Link>
          <Link href="/pricing" className="hover:underline hover:text-[#064e3b]">Pricing</Link>
          <Link href="/guide" className="hover:underline hover:text-[#064e3b]">Guide</Link>
          <Link href="/terms" className="hover:underline hover:text-[#064e3b]">Terms</Link>
          <Link href="/privacy" className="hover:underline hover:text-[#064e3b]">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
