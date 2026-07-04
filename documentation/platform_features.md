# Manna Books // Simple Financial Tracking for SMEs

Manna Books is a high-visibility, zero-friction financial document compiler, client flow tracking engine, and statutory compliance console. Designed specifically for small and medium enterprises (SMEs), it replaces bulky, generic accounting software with a sleek, editorial interface optimized for speed, precision, statutory KRA eTIMS compliance, and real-time business intelligence.

---

## Core Product Capabilities

### 1. Unified Client & Supplier Network Directories
Transform how you monitor customer and vendor relationships with specialized account profiling:
* **Conditional Profiles:** Categorize clients and suppliers as **Walk-In**, **Individual**, or **Corporate** nodes.
* **Statutory Guardrails:** Enforce collection of structural Tax PINs (Personal `A...` or Corporate `P...`) for formal accounts right during creation, keeping your accounting ledger audit-ready.
* **Financial Profiles:** Instantly calculate a client's **Lifetime Value (LTV)**, active **Accounts Receivable Balance**, and **Overdue Cash Pool** from their standalone transaction history.

### 2. High-Velocity Multi-Line Document Builder & Lineage Engine
Generate business documents with clean layouts and robust logic:
* **Flexible Transaction Types:** Toggle items on the fly between **Quotations**, **Invoices**, **Receipts**, **LPOs**, **Purchase Orders**, **Goods Received Notes (GRN)**, **Payment Vouchers**, and **Credit Notes**.
* **Universal Document Lineage Conversion:** Convert Quotes to Invoices, or LPOs/POs to Goods Received Notes and Payment Vouchers with `parentDocumentId` audit tracking.
* **Real-Time Client-Side Compilations:** Watch totals, taxes, and grand balances recalculate instantly as you update rates, adjust quantities, or swap item lines.
* **Catalog Shortcuts:** Link into a product lookup index to auto-fill common items, with options to easily override descriptions manually.

### 3. Statutory KRA eTIMS & 20th Monthly VAT Return Engine
Stay fully compliant with Kenyan tax regulations:
* **Multi-Rate Tax Structure:** Assign line item tax rates per row between **16% Standard Output VAT**, **0% Zero-Rated**, and **Exempt** flags.
* **KRA Control Unit (CU) Serial Numbers:** Store and update official `kraCuInvoiceNumber` strings across all document statuses (including `PAID` items).
* **Statutory Warning Badges:** Non-blocking amber **`⚠️ eTIMS CU Serial Pending`** warning tags alert operators when eTIMS documents are missing CU serial numbers without interrupting client billing.
* **Live 20th Monthly VAT Tracker:** Dedicated dashboard tracker calculating Output VAT (16%), Taxable Sales, Zero-Rated, and Exempt totals alongside a countdown to the statutory **20th of the month iTax deadline**.

### 4. Custom Shop Theme Branding & Logo Assets
Personalize workspace interfaces to match your company brand:
* **Dynamic Hex Theme Colors:** Select primary brand theme colors (e.g. Navy Blue `#1e3a8a` or Emerald Green `#065f46`) that dynamically inject across workspace shell navigation, client portals, vector PDFs, and Resend emails.
* **Cloudinary Asset Uploads:** Upload high-resolution shop logos directly to Cloudinary.
* **Extended Profile Metadata:** Store business phone numbers, short names, and website URLs.

### 5. Payment Channel & Transaction Ref # Tracking
Streamline settlement auditing and payment confirmation:
* **Remittance Destination Tracking:** Record payment channels (**Bank Account**, **M-Pesa Till/Paybill**, **Cash**, **Cheque**, **Other**).
* **Transaction Code Auditing:** Input M-Pesa transaction codes (e.g. `QAB71239X`) or Bank Reference numbers (`FT261900123`).
* **Multi-Channel Delivery:** Render payment confirmation particulars on document details, public client portals, downloadable PDFs, and Resend emails.

### 6. Real-Time Financial Intelligence & Analytics Suite
Gain deep visibility into operating cash flow and debt risks:
* **Executive KPIs:** Settled Inflow, Settled Outflow, Net Cash Flow, Accounts Receivable Pool, Accounts Payable Debt.
* **Timeframe Horizons:** Filter metrics across `This Month`, `Last Month`, `This Quarter`, `This Year`, and `All Time`.
* **Chronological Cash Flow Timeline Stream:** Visual 6-month monthly stream comparing sales receipts against procurement expenses.
* **Accounts Receivable (A/R) Aging Risk Matrix:** Categorize overdue client receivables into `0–30`, `31–60`, `61–90`, and `90+` day risk buckets.
* **Leaderboards:** Track top 5 bestselling products by sales volume and top 5 customer accounts by Lifetime Value.

### 7. Standalone Installable Progressive Web App (PWA)
Native app experience with offline resilience:
* **Standalone Display Mode:** Runs without browser URL bars on Windows, macOS, Android, and iOS.
* **Service Worker Caching:** Asset pre-fetching and offline fallback screen (`/offline`).
* **Install Prompt Banner:** Smart installer prompt with `localStorage` dismissal persistence.

### 8. Dual Operator Documentation System
* **Public Operator Manual (`/guide`):** Accessible to web visitors, onboarding prospects, and search engines.
* **In-App Workspace Manual (`/workspaces/[slug]/guide`):** Embedded `[07] Operator Guide` directly accessible in the workspace sidebar.

---

## What SMEs Can Accomplish with Manna Books

* **Eliminate Rounding Leakages:** Protect cash margins using a math engine built to eliminate standard floating-point precision drift.
* **Automate Billing Runs:** Use built-in Resend integrations to mail secure public document pathways directly to a client’s email inbox with one click.
* **Simplify KRA iTax Filing:** Prepare monthly 16% VAT returns before the 20th using real-time tax aggregation cards.
* **Track Outstanding Debts:** Monitor your exact accounts receivable pipelines using sharp dashboard metric frames and aging risk buckets.