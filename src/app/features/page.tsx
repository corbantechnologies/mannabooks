// src/app/features/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: "Features | Manna Books — KRA eTIMS Invoicing, Statutory Payroll, POS & Digital Catalog",
  description:
    "Explore all Manna Books platform features: KRA eTIMS multi-rate invoicing, statutory payroll (PAYE, SHIF, AHL, NSSF), walk-in POS terminal, shareable digital product catalog, smart multi-location inventory, 20th VAT return automation, general ledger, and passwordless client portals.",
  keywords: [
    "KRA eTIMS features Kenya",
    "statutory payroll PAYE SHIF NSSF Kenya",
    "invoicing software features Kenya",
    "digital product catalog rate cards Kenya",
    "walk-in POS Kenya",
    "inventory management Kenya",
    "VAT tracker Kenya",
    "general ledger double entry Kenya",
    "mannabooks.co.ke features",
  ],
  openGraph: {
    title: "Platform Features | Manna Books — KRA eTIMS, Payroll, POS & Digital Catalog",
    description: "Complete feature specifications for Manna Books: eTIMS invoicing, statutory payroll, digital product catalog, walk-in POS, COGS analytics, and passwordless client portals — built for Kenyan SMEs.",
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
            Manna Books is an end-to-end financial operations &amp; statutory compliance platform engineered for Kenyan and African SMEs. Explore every module, compliance engine, inventory system, and architectural pillar built into the platform.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5 font-mono text-xs">
            {[
              { href: "#pos", label: "Walk-in POS" },
              { href: "#invoicing", label: "Invoicing & eTIMS" },
              { href: "#catalog-showcase", label: "Digital Catalog & Rate Cards" },
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
                Invoicing, Procurement &amp; eTIMS Engine
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Full billing lifecycle from Quotation → Invoice → Receipt. Issue formal procurement LPOs, POs, and GRNs for suppliers. Embed KRA eTIMS CU numbers and multi-rate tax calculations on every document.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Item-Level VAT Provisioning", body: "Explicit 16% Standard VAT, 0% Zero-Rated, and Tax EXEMPT rules applied per line item. Computes and displays dedicated VAT line items right above Grand Total." },
                { title: "Credit Notes & Debit Notes", body: "Issue double-entry credit and debit notes with automatic general ledger postings against Sales Revenue (4100), Accounts Receivable (1100), or Cash & Bank (1200)." },
                { title: "KRA CU & PIN Compliance", body: "Embed official KRA eTIMS Control Unit (CU) serial numbers and merchant/client KRA PINs on all formal financial documents for statutory audit compliance." },
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

          {/* MODULE 3: SMART INVENTORY & COGS */}
          <div id="inventory" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 03</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Multi-Location Inventory &amp; COGS Ledger
              </h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Define physical stock locations (warehouses, stores, branches) and track products across them with a real-time, double-entry audit trail ledger. Monitor profit margins, low stock status, and value on-hand inventory.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { title: "Multi-Location Warehouses", body: "Map physical warehouses, retail stores, branches, or stock floors. Assign locations dynamically to stock movements and set per-workspace default locations." },
                { title: "Immutable Stock Ledger", body: "Every inventory action — purchases, POS checkouts, invoice adjustments, or manual corrections — writes an unalterable audit log tracking quantity, cost, and running balance." },
                { title: "Secure Stock Transfers", body: "Move stock between locations with in-transit lifecycle validation. Dispatch from source (deducts stock) and receive at destination (credits stock) with partial-receipt support." },
                { title: "Advanced Stock Reporting", body: "Generate real-time FIFO stock valuations, inspect full ledger histories, review active low-stock alerts, and perform ABC revenue Pareto analyses." },
              ].map((item) => (
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 4: STATUTORY PAYROLL */}
          <div id="payroll" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 04</span>
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

          {/* MODULE 5: KRA 20TH VAT TRACKER */}
          <div id="vat" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 05</span>
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

          {/* MODULE 6: VECTOR PDF & THERMAL TICKET ENGINE */}
          <div id="pdf-engine" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 06</span>
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

          {/* MODULE 7: PASSWORDLESS PORTALS */}
          <div id="portals" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 07</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 8: ANALYTICS & A/R AGING */}
          <div id="analytics" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 08</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 9: CRM — CLIENT & SUPPLIER NETWORK */}
          <div id="crm" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 09</span>
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

          {/* MODULE 10: OPERATING EXPENSES */}
          <div id="expenses" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 10</span>
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

          {/* MODULE 11: TEAM MANAGEMENT */}
          <div id="team" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 11</span>
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
                <div key={item.title} className="card-emerald-accent p-6 bg-white space-y-3">
                  <span className="text-[#064e3b] font-bold uppercase block text-xs font-sans">{item.title}</span>
                  <p className="text-zinc-600 text-xs font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 12: B2B NETWORK INBOX */}
          <div id="b2b-inbox" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 12</span>
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

          {/* MODULE 13: GENERAL LEDGER & FINANCIAL REPORTING */}
          <div id="general-ledger" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 13</span>
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

          {/* MODULE 14: KENYA INCOME TAX COMPLIANCE SUITE */}
          <div id="income-tax" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-[#064e3b] text-white px-2.5 py-1 uppercase rounded-md shrink-0">MODULE 14</span>
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
