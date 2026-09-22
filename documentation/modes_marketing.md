# Manna Books — Three Operating Modes Marketing & Go-To-Market Playbook

> **Document Classification:** Internal Growth & Marketing Strategy Blueprint  
> **Platform Engine:** [Manna Books](https://www.mannabooks.co.ke) • Developed by [Corban Technologies LTD](https://corbantechnologies.org)  
> **Scope:** Full Marketing, Messaging, Sales Enablement, and Go-To-Market (GTM) Strategy for Manna Books' Three Workspace Business Modes.

---

## 1. Executive Summary & Strategic Rationale

### 1.1 The Fatal Flaw of One-Size-Fits-All ERPs
Traditional business software in emerging markets makes one of two fatal mistakes:
1. **Monolithic Over-Engineering (SAP, NetSuite, Odoo):** Forces pure service companies (law firms, consultancies, wealth managers) to navigate through confusing physical warehouse tables, delivery notes, and POS terminals they will never use.
2. **Oversimplified Invoicing Apps (Wave, Zoho Invoice):** Lack double-entry general ledger integrity, multi-warehouse stock controls, barcode counter POS speeds, statutory Kenyan payroll (SHIF 2.75%, AHL 1.5%), or KRA Withholding Tax (WHT) deductions.

### 1.2 The Manna Books Three-Mode Architecture
Manna Books solves this with **Adaptive Workspace Business Modes (`shops.businessMode`)**:
A single, bulletproof financial engine that dynamically shapes its user interface, workflows, document terminology, and accounting pipelines to match the exact operating model of the business:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  MANNA BOOKS CORE ENGINE                               │
│            Double-Entry General Ledger • KRA Tax & eTIMS • Banking & M-Pesa            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
 ┌───────────────────────────┐┌───────────────────────────┐┌───────────────────────────┐
 │       MODE 1: SERVICES    ││       MODE 2: RETAIL      ││       MODE 3: HYBRID      │
 │  Financial & Professional ││  Walk-in Counter & Retail ││ Commercial Enterprise & B2B │
 ├───────────────────────────┤├───────────────────────────┤├───────────────────────────┤
 │ • No POS/Stock Clutter    │ • Rapid 2-Sec POS Terminal │ • Multi-Warehouse Transfers  │
 │ • Compound Journals       │ • Barcode & Scanner Engine │ • Trade Counter Walk-in POS  │
 │ • Accounts Payable (AP)   │ • Auto Stock Deductions    │ • Progress Retainer Invoicing│
 │ • Retainer & Time Invoices│ • Points & Cashback Loyalty│ • Project Cost Centers       │
 │ • Cost Center Allocation  │ • Real-Time COGS & GP %    │ • Remittance & Batch Payouts │
 │ • Statutory Payroll       │ • Low-Stock Warning Radar  │ • Full Board GL Reports      │
 └───────────────────────────┘└───────────────────────────┘└───────────────────────────┘
```

---

## 2. Mode-by-Mode Deep Dive & Go-To-Market Playbook

---

### MODE 1: Financial & Professional Services (`SERVICES`)

#### A. Target Audience & Ideal Customer Profiles (ICPs)
* **Core Segments:**
  * **Law Firms & Advocates:** Managing client retainers, disbursements, billable fees, trust accounting, and vendor bills.
  * **Audit, Tax & Accounting Practices:** CPKs managing multi-client books, compound monthly payroll accruals, and KRA compliance.
  * **Wealth Managers, SACCOs & Microfinance Institutions:** Handling interest allocations, statutory splits, and zero-variance bank reconciliations.
  * **Architecture, Engineering & Project Consultancies:** Billing milestone retainers with project-based cost center allocations.
  * **Digital Agencies & IT Consultancies:** Software retainers, contractor payments, and cross-border SaaS subscriptions.

#### B. Primary Pain Points & The Manna Books Solution
| Client Pain Point | Legacy Friction | Manna Books Services Solution |
| :--- | :--- | :--- |
| **Workspace Navigation Clutter** | Forced to see "Stocktakes", "Warehouses", and "POS Registers" in their sidebar. | **Clean Financial Interface:** Physical stock, transfers, and POS are completely hidden. "Product Catalog" adapts to **"Services & Rates"**. |
| **Complex Multi-Leg Journals** | Cannot post compound payroll accruals or statutory splits without manual ledger balance hacks. | **Compound Multi-Line Journal Builder:** Arbitrary $N$-line grid with 1-click **Auto-Balance**, cost center attribution, and live $\sum \text{Dr} = \sum \text{Cr}$ validation. |
| **Vendor Bills & WHT Deductions** | Manual computation of 5% / 10% Withholding Tax; forgotten payments; no formal remittance advice. | **Integrated Accounts Payable (AP):** Auto-deducts WHT, posts to `2350 WHT Payable`, queues KRA returns, and prints professional Remittance Vouchers. |
| **Monthly Period Chaos** | Staff backdating entries into closed months, destroying audited balance sheets. | **Fiscal Calendar & Period Locking:** 1-click monthly closing, read-only enforcement, and password-protected audit reopening logs. |

#### C. Value Propositions, Slogans & Elevator Pitch
* **Hero Headline:** *"Zero Inventory Clutter. Pure Financial Precision."*
* **Sub-Headline:** *The dedicated practice management and accounting OS built for legal firms, financial institutions, and consultancies across East Africa.*
* **Elevator Pitch (30s):**  
  *"If you run a law firm, consultancy, or wealth management practice, why is your accounting software asking you about physical stock and barcode scanners? Manna Books Services Mode clears away retail clutter to give your managing partners what they actually need: compound journal builders, KRA Withholding Tax tracking, vendor bill approvals, cost center profitability, and 1-click IFRS-compliant board reports."*

#### D. Marketing Copy & Campaign Assets

##### 1. LinkedIn Campaign (Sponsored Post & Thought Leadership)
* **Audience:** Managing Partners, Senior Advocates, Chief Financial Officers, Practice Managers in Kenya.
* **Ad Copy:**
  ```text
  Managing a law firm or professional consultancy on software built for corner shops?
  
  Stop scrolling past "Inventory Stocktakes" and "Barcode Scanners" to find your General Ledger.
  
  Manna Books [Services Mode] delivers an immaculate, clutter-free financial command center:
  ✓ Clean "Services & Rates" registry without physical warehouse clutter
  ✓ Compound multi-line journal entries with 1-click auto-balancing
  ✓ Accounts Payable with automatic 5% / 10% KRA Withholding Tax (WHT) deduction
  ✓ Corporate Payment Vouchers & Remittance Advice with letterhead & sign-offs
  ✓ Strict monthly fiscal period locking to safeguard your audit trail
  
  Designed for modern Kenyan legal, audit, and wealth management firms.
  
  👉 Request a Private Executive Demo: mannabooks.co.ke/industries
  ```

##### 2. Cold Outreach Email Script (For Practice Managers & Partners)
* **Subject:** Managing retainers & WHT deductions at {{BusinessName}}
* **Body:**
  ```text
  Hi {{FirstName}},
  
  Most managing partners we speak with in Nairobi spend 3 to 5 days at the end of every month reconciling client retainer invoices, computing statutory Withholding Tax (WHT 5%/10%), and ensuring junior accountants haven't backdated entries into previously audited months.
  
  We engineered Manna Books specifically for professional practices:
  1. No retail or inventory clutter—your workspace only shows General Ledger, Retainers, Vendor Bills, and Tax.
  2. Automated WHT deduction on supplier bills with 1-click Remittance Vouchers.
  3. High-volume retainer dispatch: Email 50 client invoices with vector PDFs in 10 seconds without password friction.
  
  Would you be open to a 10-minute walkthrough this Thursday to see how firms like yours streamline monthly closing?
  
  Best regards,
  {{YourName}} | Manna Books Practice Solutions
  ```

---

### MODE 2: Retail, Supermarket & POS Counter (`RETAIL`)

#### A. Target Audience & Ideal Customer Profiles (ICPs)
* **Core Segments:**
  * **Supermarkets, Minimarts & Grocery Outlets:** Rapid scanning, queue busting, till reconciliation.
  * **Hardware & Building Supply Stores:** Fast counter sales, heavy walk-in traffic, physical inventory control.
  * **Pharmacies, Chemists & Cosmetic Stores:** High-SKU volume, barcode lookup, instant thermal printing.
  * **Electronics, Computer & Phone Retailers:** Serialized hardware, warranty receipts, walk-in counter sales.
  * **Fashion Boutiques, Apparel & Shoe Stores:** Size/color variants, retail margins, customer loyalty points.

#### B. Primary Pain Points & The Manna Books Solution
| Retail Pain Point | Legacy Friction | Manna Books Retail Solution |
| :--- | :--- | :--- |
| **Counter Checkout Delays** | 30-second checkout per customer causes long queues and walk-outs. | **Rapid Walk-in POS Terminal:** 2-second barcode search, single-key numeric keypad entry, and instant M-Pesa / Cash tender splits. |
| **Inventory Shrinkage & Theft** | Discrepancies discovered weeks later when stock balances are already lost. | **Auto Stock Deduction & Variance Reconciler:** Every issued receipt instantly updates stock; physical stocktake counts immediately identify variances. |
| **Lost Walk-In Repeat Business** | Customers buy once and never return; no customer retention system. | **Built-in Loyalty Engine:** Configurable Points & Cashback system (e.g. 5% cashback on counter spend) auto-attributed to customer phone numbers. |
| **Blind Pricing (No Profit Visibility)** | Cashiers sell at volume without knowing if gross profit margin covers overhead. | **Real-Time COGS & Gross Profit %:** Displays real-time Cost of Goods Sold and profit margins before closing the sale. |

#### C. Value Propositions, Slogans & Elevator Pitch
* **Hero Headline:** *"Fast Counters. Zero Stock Shrink. Maximum Customer Retention."*
* **Sub-Headline:** *Turn walk-ins into repeat buyers with Kenya's fastest retail POS and inventory automation engine.*
* **Elevator Pitch (30s):**  
  *"Long queues kill retail businesses. When a customer stands in line for 2 minutes, you lose money. Manna Books Retail Mode puts your counter register front and center: scan a barcode, split payments across Cash and M-Pesa, print a thermal receipt in 2 seconds, and automatically deduct your stock. Plus, customer loyalty points keep buyers coming back to your shop instead of your competitor's down the street."*

#### D. Marketing Copy & Campaign Assets

##### 1. TikTok & Instagram Reels Script (High-Energy Hook)
* **Visual:** Split screen. Left side: Cashier typing slowly on a computer, line of 6 customers looking impatient. Right side: Cashier using Manna Books POS.
* **Audio Track:** Fast energetic beat.
* **Scene Breakdown:**
  * **0:00 - 0:03:** Hook: *"Why are your customers still waiting 3 minutes to buy two items in your shop?"* (Zoom in on frustrated customer).
  * **0:03 - 0:15:** *"Slow software is stealing your daily sales. Here's how Manna Books Retail POS works."*
  * **0:15 - 0:30:** (Over-the-shoulder POV): Scan barcode *beep*, tap M-Pesa, customer phone pings, thermal receipt prints instantly. Total time: 4 seconds.
  * **0:30 - 0:45:** *"Your inventory updates automatically, and your customer just earned 50 loyalty points linked to their phone number."*
  * **0:45 - 0:60:** Call to action: *"Stop losing sales at the counter. Upgrade your shop at mannabooks.co.ke."*

##### 2. Field Sales Playbook (Direct Retail Agent Pitch)
* **Location:** Commercial hubs (Biashara Street, Luthuli Ave, River Road, Mombasa Old Town, Nakuru CBD, Kisumu).
* **Agent Opening Line:**  
  *"Jambo Boss! How many times a week do you do a stock count and find 3 items missing from the shelf? And when M-Pesa network is busy, does your line get stuck?"*
* **The Demo Device:** Agent carries a 10-inch Android tablet or laptop with Bluetooth thermal printer.
* **3-Step Live Demo:**
  1. Scan any item in their shop using the camera/handheld scanner.
  2. Ring up a KES 250 sale with KES 50 M-Pesa / KES 200 Cash split.
  3. Print instant 58mm/80mm thermal receipt right in front of them with shop name, KRA PIN, and loyalty points.
* **Closing Hook:** *"You can start on your existing phone or PC right now with zero expensive hardware lock-in."*

---

### MODE 3: Hybrid Commercial Enterprise (`HYBRID`)

#### A. Target Audience & Ideal Customer Profiles (ICPs)
* **Core Segments:**
  * **Wholesalers & Bulk Distributors:** Operating a physical trade counter for walk-in retailers while dispatching container-load B2B invoices on credit.
  * **General Contractors & Engineering Firms:** Managing physical materials across multiple project sites while running progress billing and subcontractor vendor bills.
  * **Auto Spares & Industrial Machinery Importers:** Selling fast-moving parts over the counter while managing wholesale reseller trade accounts with credit limits.
  * **Value-Added Resellers (VARs) & Turnkey Tech Integrators:** Supplying physical hardware alongside recurring IT managed service contracts.
  * **Agro-dealers & Commercial Farming Supply Centers:** Counter trade of feeds/seeds combined with commercial credit supply lines to agricultural estates.

#### B. Primary Pain Points & The Manna Books Solution
| Hybrid Pain Point | Legacy Friction | Manna Books Hybrid Solution |
| :--- | :--- | :--- |
| **The "Dual World" Disconnect** | Retail POS doesn't talk to B2B credit accounts; corporate accounting doesn't support counter checkout. | **Unified Dual-Channel Engine:** Walk-in cash/M-Pesa POS and 30-day B2B corporate credit invoices pull from the same inventory in real time. |
| **Multi-Location Inventory Leakage** | Stock transfers between central depot and retail branches get lost or untracked. | **Inter-Depot Transfers & Movement Ledger:** Formal dispatch-and-receive workflows with full historical audit trails and valuation reports. |
| **Project & Branch Cost Blindness** | Cannot tell if Branch B or Project Site C is profitable after overhead and logistics expenses. | **Departmental Cost Centers:** Tag supplier bills, payroll, and journals with specific cost centers to track segmented P&L margins. |
| **High-Volume Supplier Remittance** | Reconciling hundreds of supplier deliveries, paying via bank EFT, and sending manual proof of payment. | **Batch Payment Manifests & Remittance Advice:** Export bank-ready CSV payout files and generate formal remittance vouchers in 1 click. |

#### C. Value Propositions, Slogans & Elevator Pitch
* **Hero Headline:** *"Trade Counter Meets Corporate Boardroom."*
* **Sub-Headline:** *The complete operating system for hybrid enterprises that sell physical stock and manage corporate accounts.*
* **Elevator Pitch (30s):**  
  *"If you run a wholesale business or contracting firm, you live in two worlds: you have a walk-in trade counter ringing up physical sales, and you have corporate clients needing formal 30-day invoices, multi-warehouse transfers, and detailed project cost tracking. Running two separate systems causes inventory chaos and accounting errors. Manna Books Hybrid Mode unites both: walk-in POS, multi-location depots, vendor bill approvals, and full double-entry board financial statements in one seamless platform."*

#### D. Marketing Copy & Campaign Assets

##### 1. Executive Briefing Whitepaper / Downloadable Lead Magnet
* **Title:** *The Hybrid Enterprise Blueprint: Unifying Trade Counter Speed and Corporate Financial Control in East Africa.*
* **Target Channels:** LinkedIn Sponsored InMail, Google Search Ads (Keywords: *ERP Kenya, Wholesale inventory software Kenya, Sage alternatives Kenya*).
* **Summary Outline:**
  * Chapter 1: The hidden cost of running disconnected POS and Accounting systems.
  * Chapter 2: Solving stock leakage across central warehouses and satellite branches.
  * Chapter 3: Automating KRA Withholding Tax (WHT) and eTIMS without manual paperwork.
  * Chapter 4: Case Study: How an electrical wholesaler eliminated stock shrink and cut month-end closing by 80%.

##### 2. Enterprise Sales Battlecard: Manna Books vs. Legacy Alternatives
| Capability | Manna Books Hybrid Mode | QuickBooks Enterprise | Zoho Books / Inventory | Sage Pastel |
| :--- | :---: | :---: | :---: | :---: |
| **Kenyan Statutory Payroll (SHIF 2.75%, AHL 1.5%)** | **Native Built-in** | ❌ Third-party add-on | ❌ Missing Kenyan rates | ❌ Expensive module |
| **KRA eTIMS & WHT 5%/10% Deductions** | **Native Built-in** | ❌ Manual workaround | ❌ Custom scripting required | ⚠️ Complex setup |
| **Combined Walk-in POS + B2B Invoicing** | **Seamless Dual Engine** | ⚠️ Clunky add-on | ⚠️ Requires 2 separate subscriptions | ❌ Rigid legacy POS |
| **Cost Centers & Departmental Allocations** | **Included Standard** | ⚠️ Premium tier only | ⚠️ Premium tier only | ⚠️ Premium tier only |
| **Passwordless 64-Char Client Portal** | **Instant WhatsApp link** | ❌ Requires login | ❌ Requires customer login | ❌ PDF email attachment only |
| **Local Pricing (KES)** | **Transparent KES Pricing** | ❌ Expensive USD billing | ❌ Multi-app USD pricing | ❌ High annual license |

---

## 3. Comparative Architecture & Feature Matrix

To empower sales reps, marketing copywriters, and onboarding specialists, the table below highlights how the platform behaves across the three modes:

| Feature / Module | Mode 1: Services 💼 | Mode 2: Retail 🏪 | Mode 3: Hybrid 🏗️ |
| :--- | :---: | :---: | :---: |
| **Primary Target Market** | Consultancies, Law, Finance | Shops, Marts, Chemists | Wholesalers, Contractors |
| **POS Counter Terminal** | *Hidden (No Clutter)* | **Primary Centerpiece** | **Included (Trade Counter)** |
| **Physical Inventory & Stocktakes** | *Hidden* | **Full Multi-Category** | **Full Multi-Category** |
| **Multi-Warehouse Transfers** | *Hidden* | *Optional* | **Active Inter-Depot** |
| **Catalog Nomenclature** | *"Services & Rates"* | *"Products & Stock"* | *"Products & Services"* |
| **Compound Multi-Line Journals** | **Advanced Grid** | *Standard GL* | **Advanced Grid** |
| **Vendor Bills & Remittance Advice** | **Full AP Suite** | *Standard Expenses* | **Full AP Suite** |
| **KRA Withholding Tax (WHT) Engine** | **5% / 10% Auto-Deduct** | *Standard* | **5% / 10% Auto-Deduct** |
| **Customer Loyalty Engine** | *Corporate VIP Tiers* | **Points & Cashback** | **Hybrid Points + VIP** |
| **Cost Center & Department Tracking** | **Active Project/Division** | *Store Level* | **Multi-Branch / Project** |
| **Batch Payment Manifest Export** | **Bank / M-Pesa CSV** | *Cash / Till Close* | **Bank / M-Pesa CSV** |
| **Fiscal Calendar & Monthly Locking** | **Strict Audit Close** | *Standard Month Close* | **Strict Audit Close** |

---

## 4. Multi-Channel Go-To-Market (GTM) Execution Plan

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                GTM LAUNCH TIMELINE                                     │
├────────────────────┬────────────────────┬─────────────────────┬────────────────────────┤
│  WEEKS 1–2: LAUNCH │ WEEKS 3–4: CONTENT │ WEEKS 5–6: OUTREACH │  WEEKS 7+: SCALE       │
├────────────────────┼────────────────────┼─────────────────────┼────────────────────────┤
│ • Deploy 3 mode    │ • Publish 3 Mode   │ • Direct outreach to│ • Paid ad scaling      │
│   landing pages    │   Guide chapters   │   150 Law / Audit   │ • Partner webinars with│
│ • Update /features │ • Launch TikTok &  │   firms (Services)  │   CPK accountants      │
│   & /industries    │   Reels campaign   │ • Field blitz in    │ • Hardware bundle      │
│ • Configure ads    │ • Release Video    │   commercial trade  │   promotions (Printers │
│   by intent search │   demonstrations   │   hubs (Retail)     │   + Scanners + Manna)  │
└────────────────────┴────────────────────┴─────────────────────┴────────────────────────┘
```

### 4.1 Digital Advertising Strategy (Google, Meta, LinkedIn)

#### Campaign A: Services Intent (Search & LinkedIn)
* **Search Keywords:** `law firm accounting software kenya`, `sacco management software nairobi`, `wht withholding tax automation kenya`, `cpk accounting software`, `quickbooks alternatives for lawyers kenya`.
* **Landing Page:** `mannabooks.co.ke/industries` (Auto-scroll to Financial & Legal Services card).
* **Core Hook:** *"Ditch inventory clutter. The accounting platform built specifically for Kenyan professional practices."*

#### Campaign B: Retail Intent (TikTok, Instagram, Meta Ads)
* **Target Interests:** Small business owners, retail shop owners, supermarket operators in Nairobi, Mombasa, Kisumu, Nakuru, Eldoret.
* **Creatives:** High-speed counter checkout videos, barcode beep demonstrations, 58mm thermal receipt printing.
* **Core Hook:** *"The fastest walk-in POS in Kenya. Scan, accept M-Pesa, and issue receipts in 3 seconds."*

#### Campaign C: Hybrid Enterprise Intent (Google Search & Industry Publications)
* **Search Keywords:** `wholesale inventory software kenya`, `construction project accounting kenya`, `multi warehouse management system kenya`, `sage pastel alternative nairobi`.
* **Landing Page:** `mannabooks.co.ke/industries` (Auto-scroll to Hybrid Enterprise card).
* **Core Hook:** *"Unite your trade counter and your balance sheet in real time."*

---

## 5. Automated Onboarding & Email Nurture Sequences

When a user initializes an account and chooses their business mode in Settings, the automated email sequence tailors its messaging:

### 5.1 Nurture Track: Mode 1 (Services)
* **Day 0 (Welcome):** *"Welcome to Manna Books — Your practice command center is ready."* (Highlights how to set up Services & Rates and add team members).
* **Day 3 (Accounting Precision):** *"Mastering compound journals and KRA Withholding Tax in 5 minutes."* (Links to Chapter 17 & 18 of the Guide).
* **Day 7 (Retainer Workflow):** *"How to bill 50 client retainers in 45 seconds using bulk email dispatch."*
* **Day 14 (Audit Readiness):** *"Zero-panic monthly close: How to lock fiscal periods and export board reports."*

### 5.2 Nurture Track: Mode 2 (Retail)
* **Day 0 (Welcome):** *"Your counter is open! Let's ring up your first test sale in 60 seconds."*
* **Day 2 (Stock Control):** *"How to import your product list and turn on auto-stock deductions."*
* **Day 5 (Customer Retention):** *"Activate your Points & Cashback engine to turn walk-ins into repeat buyers."*
* **Day 10 (End-of-Day Balancing):** *"Daily cash drawer reconciliation and zero-leakage stocktakes."*

### 5.3 Nurture Track: Mode 3 (Hybrid)
* **Day 0 (Welcome):** *"Welcome to Manna Books Hybrid — Connect your trade counter and warehouse."*
* **Day 3 (Multi-Depot Power):** *"Setting up secondary warehouses and recording stock transfers."*
* **Day 7 (Cost Centers & AP):** *"Track project profit margins with Cost Centers and Vendor Bills."*
* **Day 14 (Financial Mastery):** *"From warehouse receipts to Trial Balance: Your complete audit trail."*

---

## 6. Key Performance Indicators (KPIs) & Review Cadence

To measure the commercial performance of each mode, the marketing and growth team tracks:

| Metric | Target (Services) | Target (Retail) | Target (Hybrid) | Tracking Frequency |
| :--- | :--- | :--- | :--- | :--- |
| **New Workspace Registrations** | 25% of total signups | 45% of total signups | 30% of total signups | Weekly |
| **Activation Rate (First Doc / Sale in 48h)** | > 70% | > 85% | > 65% | Weekly |
| **Month-1 Retention Rate** | > 85% | > 80% | > 90% | Monthly |
| **Average Revenue Per User (ARPU)** | Tier 2 / Corporate Tier | Standard / Retail Tier | Premium Enterprise Tier | Monthly |
| **Support Ticket Volume per 100 Users** | < 4 tickets/month | < 3 tickets/month | < 5 tickets/month | Bi-Weekly |

---

## 7. Summary & Implementation Checklist

- [x] **Schema & Engine:** `shops.businessMode` implemented with `'SERVICES'`, `'RETAIL'`, `'HYBRID'`.
- [x] **Workspace Settings:** Interactive 3-mode card selector live in [SettingsForm.tsx](file:///c:/Users/ADMIN/Documents/Finance/mannabooks/src/app/workspaces/[slug]/settings/SettingsForm.tsx).
- [x] **Dynamic Navigation:** `DesktopSideNav.tsx` and `MobileNavDrawer.tsx` filter POS, Stock, and rename catalogs automatically.
- [x] **Marketing Pages:** Features page, Industries page, and Operator Guide updated with all three modes.
- [ ] **Field Campaign Execution:** Deploy Retail sales reps with demonstration kits.
- [ ] **Digital Ads:** Activate Mode-targeted search campaigns on Google and LinkedIn.
- [ ] **Accountant Partner Network:** Host onboarding webinar for independent Kenyan CPKs.