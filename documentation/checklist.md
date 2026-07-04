# MANNA BOOKS // PILOT CLIENT ONBOARDING BLUEPRINT
**Target Objective:** Complete all infrastructure initialization tracks to transition a workspace from a draft sandbox to a production-active node.

---

### [ ] TRACK 1: Configure Shop Parameters & Custom Brand Theme
* **Objective:** Establish the primary multi-tenant boundary, local currency settings, statutory tax configuration, and shop brand styling.
* **Actions Required:**
  * Navigate to **[06] System Settings** (`/workspaces/[slug]/settings`).
  * Input the exact business name, phone number, website URL, and short name.
  * Enter the mandatory **13-character statutory KRA Tax PIN**.
  * Toggle `isVatRegistered` if the company processes standard 16% VAT.
  * Upload branding logo asset via Cloudinary.
  * Select your shop's **Primary Theme Hex Color** (e.g. Navy Blue `#1e3a8a` or Emerald Green `#065f46`).
  * Click **Commit Changes**.

### [ ] TRACK 2: Onboard First Customer Profile
* **Objective:** Create the initial outbound client flow tracking registry.
* **Actions Required:**
  * Navigate to **[02] Client Flow** (`/workspaces/[slug]/clients`).
  * Click **+ Register Customer**.
  * Classify the client node accurately: **Walk-In**, **Individual**, or **Corporate**.
  * Enter name, functional email identifier, and active phone reference.
  * If the client is a structured individual or corporate firm, input their legal Tax PIN to ensure valid eTIMS ledger matching.

### [ ] TRACK 3: Build Out Item Catalog Indices
* **Objective:** Define the inventory master products or service deliverables baseline.
* **Actions Required:**
  * Navigate to **[03] Product Catalog** (`/workspaces/[slug]/products`).
  * Click **+ Register Catalog Item**.
  * Enter a clear, descriptive name for the product or service specification.
  * Assign a trackable, unique **SKU / Code Reference** for line identification.
  * Define the **Base Unit Price** (the baseline rate prior to tax computation).
  * Map the default statutory tax vector for the item: **16% VAT**, **0% (Zero-Rated)**, or **Tax Exempt**.

### [ ] TRACK 4: Register Procurement Suppliers
* **Objective:** Set up the inbound vendor database to unlock supply chain logistics management.
* **Actions Required:**
  * Navigate to **[04] Supplier Network** (`/workspaces/[slug]/suppliers`).
  * Click **+ Add Supplier**.
  * Log supplier company name, corporate contact emails, phone numbers, and tax PINs.
  * Flag whether this vendor requires explicit eTIMS invoice matching on purchase transactions (`requiresEtims: true`).

### [ ] TRACK 5: Compile Initial Live Financial Ledger Document
* **Objective:** Execute a live transaction entry to test multi-line arithmetic engines, eTIMS taxes, and vector PDF generation.
* **Actions Required:**
  * Navigate to **[01] Fiscal Ledgers** (`/workspaces/[slug]/documents/new`).
  * Select target client or supplier.
  * Choose document compile type: **INVOICE**, **QUOTATION**, **RECEIPT**, or **LPO**.
  * Use catalog lookup shortcuts to pull products, adjusting quantities and rates as needed.
  * Verify that the client-side math engine perfectly aggregates the subtotal, VAT pool, and grand payable sum without rounding leaks.
  * Click **Commit Billing Compilation** to run the transaction.
  * Open document profile, verify unguessable 64-character token URL, passwordless portal, downloadable vector PDF, and Resend email dispatch.

### [ ] TRACK 6: Record Payment Settlement & Remittance Ref #
* **Objective:** Record payment destination channels and transaction codes for audit trails.
* **Actions Required:**
  * Open any document detail page (`/workspaces/[slug]/documents/[id]`).
  * Select **Payment Channel** (Bank Account, M-Pesa Till/Paybill, Cash, Cheque).
  * Input **Transaction Reference Code** (e.g. M-Pesa Code `QAB71239X` or Bank Ref `FT261900123`).
  * Click **Paid** to finalize settlement and verify confirmation particulars on portal and PDF.

### [ ] TRACK 7: Review Financial Intelligence & KRA 20th VAT Return Tracker
* **Objective:** Inspect real-time cash flow metrics, aging risk matrix, and statutory tax return deadlines.
* **Actions Required:**
  * Navigate to **[05] Financial Analytics** (`/workspaces/[slug]/analytics`).
  * Review **Statutory KRA 20th VAT Return Tracker** countdown and Output VAT (16%) totals for monthly iTax filing.
  * Inspect 6-month **Cash Flow Timeline Stream** comparing sales receipts against procurement expenses.
  * Analyze **A/R Aging Risk Matrix** (0–30, 31–60, 61–90, 90+ days) to target overdue client collections.

### [ ] TRACK 8: Install Standalone PWA Appliance
* **Objective:** Install Manna Books to desktop or mobile home screens for native offline access.
* **Actions Required:**
  * On Desktop/Android: Click **📲 Install App** on the bottom right prompt banner or browser address bar.
  * On iOS Safari: Tap **Share** -> **Add to Home Screen**.
  * Launch Manna Books from home screen to confirm standalone app window mode without browser URL bars.

---

### 💡 FOUNDER CONCIERGE ROADMAP LOGS
Use this space during your Week 1 setup sessions to take raw notes on where the merchant ran into friction, what columns they had missing from their legacy spreadsheets, or specific UI layout tweaks they requested:

* **Client Name / Archetype:** _________________________________________
* **Data Migration Roadblocks:** _______________________________________
* **UX/UI Friction Points Observed:** __________________________________
* **Requested Feature Enhancements:** _________________________________