# Accounting System Overhaul & Clean Slate Architecture (`accounting_fix.md`)

This document outlines the architectural assessment, root causes, and step-by-step implementation plan to resolve the accounting issues across Manna Books, covering:
1. **Accounting Periods (Monthly Detail View & Audit Breakdown)**
2. **Operating Budgets (Historical & Future Month Navigation with Cloning)**
3. **General Ledger Engine & Migration Overhaul (Credit Notes, Partial Payments, Deterministic Double-Entry)**
4. **Full Workspace Clean Slate (Automated Pre-Purge Document/Data Export & Deep Factory Reset)**

---

## 1. Accounting Periods (Months) Detail View

### Current Problems
* `/finance/periods` only displays a high-level summary table (Period Name, Dates, Closed By, Status) with basic Close/Reopen triggers.
* Operators cannot click into a month to inspect the underlying financial data, journal entries, or account balances.
* If there is an imbalance or unassigned entry, there is no way to diagnose which transactions caused it.

### Proposed Architecture & Solution
* **Period Details Drawer / Dedicated View (`/finance/periods/[periodId]` or Expandable Modal)**:
  * **Period KPI Bar**:
    * Gross Revenue, Cost of Goods Sold, Gross Profit, Total Operating Expenses, Net Income for the month.
    * Total Debits vs Total Credits (verification that Month Net Balance = 0.00).
    * Total Transactions Count (Invoices, Receipts, Credit Notes, Expense Vouchers, Payroll Runs).
  * **Account Category Balances**:
    * Breakdown of Debits vs Credits grouped by account type (`ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`).
  * **Transaction Journal Stream**:
    * Searchable, paginated table of all journal entries specifically timestamped within that month (`startDate` to `endDate`).
    * Direct links to view source documents (`docNumber`, expense voucher, payroll run).
  * **Period Snapshot & Closing Audit**:
    * Audit trail showing who closed/reopened the period, timestamp, and closing Retained Earnings snapshot.
    * Month-end lock status indicator preventing accidental backdating.

---

## 2. Operating Budgets: Historical & Multi-Month Navigation

### Current Problems
* `/finance/budgets/page.tsx` hardcodes the current month (`const month = now.getMonth() + 1; const year = now.getFullYear();`).
* `BudgetsClient.tsx` has no UI controls (date pickers or dropdowns) to select past or future months.
* Users cannot review how their spending performed against budget limits in previous months, nor can they pre-plan budgets for upcoming months.

### Proposed Architecture & Solution
* **Month/Year Navigation Header**:
  * Add a **Month & Year Selector Bar** with:
    * `← Previous Month` and `Next Month →` quick-switch buttons.
    * Month Dropdown (January – December) and Year Selector (e.g. 2024, 2025, 2026, 2027).
    * "Today / Current Month" jump button.
  * URL query sync (`?month=7&year=2026`) to allow shareable and bookmarkable budget reports.
* **Historical Actuals vs Budget Limit Analytics**:
  * For past months: display actual expenses recorded in that month vs the budget set for that month.
  * Visual variance indicators (`Under Budget`, `Warning 80%`, `Over Budget`).
* **Budget Cloning Facility**:
  * Add a **"Copy Budget From Previous Month"** button to automatically copy all category limits from Month $N-1$ to Month $N$ with a single click.
* **Annual Budget Summary Tab**:
  * 12-month cross-tabulation table showing total budgeted vs actual expense per category across the entire fiscal year.

---

## 3. General Ledger Engine & Migration Overhaul

### Current Problems
1. **GL Migration Skips Credit Notes**: `runGlMigration` in `src/lib/actions/gl-migration.ts` only processes `INVOICE`, `RECEIPT`, and `LPO/PO/PAYMENT_VOUCHER`. It completely ignores `CREDIT_NOTE` and `DEBIT_NOTE`.
2. **Backdating Date Mismatch**: Document creation in `documents.ts` uses `new Date()` (today's timestamp) for journal entries instead of the document's actual `issueDate`, distorting historical accounting periods.
3. **Partial Payments & Settlement Tracking**: Invoices with multiple payments or credit note adjustments are not handled with proper clearing accounts (`1100 Accounts Receivable` vs `1200 Cash & Bank`).

### Deterministic Double-Entry Rules Matrix

| Transaction Type | Trigger / Event | Debit Account | Credit Account | Note |
| :--- | :--- | :--- | :--- | :--- |
| **Invoice Issued** | Invoice finalized / sent | `1100 Accounts Receivable` | `4100 Sales Revenue` | Increases receivables & revenue |
| **Invoice Payment Received** | Receipt created against invoice | `1200 Cash & Bank` | `1100 Accounts Receivable` | Clears receivable, increases cash |
| **Direct POS Sale (Receipt)** | Standalone cash sale | `1200 Cash & Bank` | `4100 Sales Revenue` | Immediate cash revenue |
| **Credit Note (Refund/Return)** | Credit note issued (settled) | `4100 Sales Revenue` (or `4150 Sales Returns`) | `1200 Cash & Bank` (if refunded) or `1100 AR` (if credited) | Reduces revenue & cash/receivables |
| **Credit Note (VAT Portion)** | Credit note with VAT | `2200 VAT Output Tax` | `1100 AR` / `1200 Cash` | Decreases VAT liability |
| **Debit Note** | Debit note issued | `1100 Accounts Receivable` | `4100 Sales Revenue` | Increases receivable |
| **Expense Voucher** | Operating expense paid | `6100–6900 Expense Account` | `1200 Cash & Bank` | Increases expense, decreases cash |
| **Non-Operating Income** | Other income received | `1200 Cash & Bank` | `4200 Other Income` | Increases cash & other income |
| **Payroll Settlement** | Payroll run approved & paid | `6100 Salaries & Wages` | `1200 Cash` & `2300 PAYE Payable` | Splits net pay & tax liabilities |
| **Year-End Closing** | Fiscal Year closed | `4100 Revenue` / `3300 Retained Earnings` | `3300 Retained Earnings` / `6000 Expenses` | Zeroes P&L to Equity |

### Overhaul Implementation Strategy
* **Unified GL Engine (`src/lib/gl/engine.ts`)**:
  * Centralize all double-entry creation through a single, strictly typed engine.
  * Guarantee that `entryDate` is ALWAYS taken from the source document's `issueDate` or transaction date.
  * Include automated period lookup and backdating permission validation.
* **Comprehensive Re-Migration (`runGlMigration` / `repairLedgerAction`)**:
  * Rewrite `gl-migration.ts` to chronologically sort all historical records (`documents`, `expenses`, `incomes`, `payrollRuns`) by date and apply the exact rules matrix above.
  * Include all `CREDIT_NOTE` records (both standalone refunds and invoice-linked credit notes).

---

## 4. Automated Data Export & Clean Slate Factory Reset

### Current Problems
* Operators who want to start afresh cannot easily purge test or legacy data without manually hacking the database or running incomplete partial purges.
* Purging without an automated download leaves users vulnerable to accidental data loss.

### Proposed Architecture & Solution

```
┌─────────────────────────────────────────────────────────────┐
│             Clean Slate / Factory Reset Modal               │
│                                                             │
│  1. Prepare Data Archive (JSON + CSV)                       │
│     ├── documents.json (Invoices, Receipts, Credit Notes)   │
│     ├── catalog_and_inventory.json (Products, Stock)       │
│     ├── contacts.json (Clients, Suppliers)                  │
│     ├── expenses_and_incomes.json                           │
│     └── general_ledger_archive.json                         │
│                                                             │
│  2. Trigger Instant Client Download (manna_backup_*.zip)    │
│                                                             │
│  3. Execute Atomic Database Reset (Transaction)             │
│     ├── Wipe Ledger & Periods (or all workspace data)       │
│     └── Reset Document Sequences to 0001                    │
└─────────────────────────────────────────────────────────────┘
```

#### Step 1: Automated Pre-Purge Export Engine (`src/lib/actions/export-workspace.ts`)
* Before any deletion occurs, the server generates a complete, structured JSON/CSV data snapshot containing:
  1. `documents`: All Invoices, Receipts, Credit Notes, Quotes, LPOs, POs, Delivery Notes, and Line Items.
  2. `contacts`: All Clients and Suppliers with Tax PINs and contact info.
  3. `catalog`: All Products, Services, Cost Prices, and Stock Ledger Balances.
  4. `expenses_incomes`: All operational expenses and secondary incomes.
  5. `payroll`: All employees and historical payroll runs.
  6. `general_ledger`: Complete journal entries, chart of accounts, and period balances.
* The system streams or packages this as an automatic browser download (`.json` or `.zip`).

#### Step 2: Two Flexible Reset Options
* **Option A: Fresh Accounting Reset (Keep Master Catalog & Contacts)**:
  * Wipes all transactions (`documents`, `expenses`, `incomes`, `journalEntries`, `fiscalYears`, `accountingPeriods`, `budgets`, `stockLedgerEntries`).
  * Preserves business profile, payment methods, client database, supplier database, and product catalog items.
  * Resets document sequence numbers back to 1 (e.g. `INV-0001`).
  * Sets `isGlEnabled = false`, allowing a fresh GL activation and fiscal year setup.
* **Option B: Complete Factory Reset (Clean Slate)**:
  * Wipes all workspace data (transactions, catalog, clients, suppliers, team invitations).
  * Only preserves the Workspace Shop profile and the Owner user account.

#### Step 3: Security & Verification
* Requires entering the workspace code or typing `CONFIRM RESET` in an input box.
* Restricted strictly to the Workspace `OWNER`.

---

## 5. Execution Roadmap

| Phase | Component | Tasks | Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Automated Export & Clean Slate** | Build `exportWorkspaceData` and `factoryResetWorkspace` actions; add Clean Slate UI to Diagnostics page with auto-download trigger. | Safe, 1-click export + clean restart |
| **Phase 2** | **GL Engine & Migration Overhaul** | Build unified GL posting engine; fix `issueDate` timestamps; add Credit Note & Debit Note rules to `gl-migration.ts` & `repairLedgerAction`. | 100% accurate, balanced double-entry accounting |
| **Phase 3** | **Budgets Multi-Month Navigation** | Add Month/Year navigation bar and URL params; implement past actuals vs budget analytics and "Clone Last Month" feature. | Full historical & future budget planning |
| **Phase 4** | **Period Details View** | Build `/finance/periods/[periodId]` or expandable period inspector with KPIs, account breakdowns, and journal entry stream. | Deep month-by-month financial visibility |

---
*Created as part of the Manna Books Accounting Overhaul initiative.*
