# Manna Books — Inventory & Paywall Development Log

**Branch:** `feature-inventory-management`  
**Session Date:** 2026-08-18  
**Committed:** Yes — `8e04d29` ("implement stock tracking"), `09a1bc8` ("update documentations"), `a07d288` ("update layout")  
**Production Build Status:** ✅ Passed (Next.js compilation & TypeScript typecheck success)

---

## ✅ ACCOMPLISHED TODAY

### Phase 2 — Database Schema
All 4 new tables added to `src/db/schema.ts` and pushed to production DB (`db:push` exited code 0):

| Table | Purpose |
|-------|---------|
| `stock_locations` | Physical storage nodes per workspace (warehouses, branches, shop floors) |
| `stock_ledger` | Immutable audit trail of every stock movement — single source of truth |
| `stock_transfers` | Inter-location transfer headers with DRAFT → IN_TRANSIT → COMPLETED lifecycle |
| `stock_transfer_items` | Line items per transfer (qty requested / qty received) |

Additional schema changes:
- `products.defaultLocationId` — links a product to its preferred stock location
- `stockMovementTypeEnum` — PURCHASE_RECEIPT, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_OUT, TRANSFER_IN, OPENING_BALANCE, RETURN, VOID
- `stockAdjustmentReasonEnum` — DAMAGED, EXPIRED, THEFT, COUNT_CORRECTION, PROMOTION, OTHER
- `stockTransferStatusEnum` — DRAFT, IN_TRANSIT, COMPLETED, CANCELLED
- Full Drizzle ORM relations wired for all new tables

---

### Phase 3 — Server Actions (2 new files)

**`src/lib/actions/inventory.ts`**
- `getStockLocations(shopId)` — list active locations
- `createStockLocation(...)` — creates with auto-default on first location
- `updateStockLocation(...)` — updates name/code/default/active
- `deleteStockLocation(...)` — guards against deletion if ledger history exists
- `recordStockAdjustment(...)` — writes ADJUSTMENT_IN/OUT + updates cached stockQuantity
- `recordOpeningBalance(...)` — seeds OPENING_BALANCE ledger entries
- `getStockLedger(...)` — full audit trail with filters
- `getStockValuation(shopId)` — weighted avg cost × qty per product
- `getInventoryOverview(shopId)` — dashboard KPIs + recent 10 movements
- `getLowStockProducts(shopId)` — products ≤ reorderThreshold
- `getAbcAnalysis(shopId)` — revenue-ranked Pareto tiers (A=70%, B=20%, C=10%)

**`src/lib/actions/stock-transfers.ts`**
- `createStockTransfer(...)` — creates header + line items as DRAFT
- `dispatchStockTransfer(...)` — DRAFT → IN_TRANSIT, writes TRANSFER_OUT ledger entries, deducts source stock
- `receiveStockTransfer(...)` — IN_TRANSIT → COMPLETED, writes TRANSFER_IN ledger entries, credits destination stock with partial receive support
- `cancelStockTransfer(...)` — CANCELLED with automatic stock restoration if already IN_TRANSIT
- `getStockTransfers(shopId)` — list all transfers with full relations
- `getStockTransfer(transferId)` — single transfer with all relations

**`src/lib/actions/stock.ts`** _(Updated)_
- `applyDocumentStockMovements(...)` now writes a `stock_ledger` entry for every document-triggered stock change (SALE, PURCHASE_RECEIPT, RETURN, VOID) before updating the cached `stockQuantity`

---

### Phase 4 — Inventory UI & Marketing

*   **Sub-Navigation Layout Overlap Fix**: Resolved container-relative sticky layout positioning by changing `top-14` to `top-0` in `src/app/workspaces/[slug]/inventory/layout.tsx` and securing background opacity (`bg-zinc-50`) to prevent text show-through during scroll.
*   **Public Features Page Update**: Updated Module 02 on `src/app/features/page.tsx` to detail the newly implemented **Multi-Location Inventory & COGS Ledger** features and upgraded the copy grid to a balanced 4-column layout.

| Route | File | Purpose |
|-------|------|---------|
| `/inventory/` | `page.tsx` + `layout.tsx` | Dashboard KPIs, recent movements, quick links, setup prompt |
| `/inventory/locations/` | `page.tsx` + `LocationsClientView.tsx` | Full CRUD with modal form, default badge, archive status |
| `/inventory/adjustments/` | `page.tsx` + `AdjustmentsClientView.tsx` | Stock In/Out form + adjustment history table |
| `/inventory/transfers/` | `page.tsx` | Transfer list with status-aware action links |
| `/inventory/transfers/new/` | `page.tsx` + `NewTransferForm.tsx` | Transfer wizard with dynamic product lines |
| `/inventory/transfers/[id]/` | `page.tsx` + `TransferDetailClient.tsx` | Detail + Dispatch + Confirm Receipt + Cancel with lifecycle timeline |
| `/inventory/reports/valuation/` | `page.tsx` | Stock valuation table (avg cost × qty) with status badges |
| `/inventory/reports/movement/` | `page.tsx` | Full 200-entry ledger with color-coded movement types |
| `/inventory/reports/low-stock/` | `page.tsx` | 3-tier severity dashboard (Out of Stock / Critical / Reorder Now) |
| `/inventory/reports/abc/` | `page.tsx` | ABC analysis with tier cards + revenue bar per product |

### Navigation Updated
- `DesktopSideNav.tsx` — Inventory group with 8 sub-links added between Product Catalog and Cash Book
- `MobileNavDrawer.tsx` — Same Inventory group mirrored

---

## 🔜 PENDING (Next Session)

### Phase 1 — Paywall Foundation
> Priority: implement AFTER inventory system is user-tested

- [ ] Add `plan` (STARTER/BASIC/PROFESSIONAL/ENTERPRISE), `plan_expires_at`, `plan_activated_at` columns to `shops` table
- [ ] Create `subscriptions` table in `schema.ts`
- [ ] Run `npm run db:push`
- [ ] Create `src/lib/plan-limits.ts` — PLAN_LIMITS matrix defining per-plan feature flags and numeric limits
- [ ] Create `src/lib/actions/plan.ts` — `getShopPlan`, `enforcePlanFeature`, `enforcePlanLimit`, `upgradeShopPlan`
- [ ] Create `src/components/PaywallGate.tsx` — Server component wrapper
- [ ] Create `src/components/UpgradeBanner.tsx` — Upgrade CTA shown inside locked features
- [ ] Enforce limits in server actions:
  - `products.ts` → 51st product blocked on STARTER
  - `team.ts → inviteTeamMember()` → 4th member blocked below BASIC
  - `workspace creation` → 2nd workspace blocked below PROFESSIONAL
  - `gl.ts → activateGeneralLedger()` → blocked below BASIC
  - `payroll.ts → processPayrollRun()` → blocked below BASIC
  - `/inventory/*` layout → `PaywallGate` requiring PROFESSIONAL
  - `inventory.ts → createStockLocation()` → 2nd location blocked below PROFESSIONAL
- [ ] Seed all existing shops with `plan = 'STARTER'` via migration script
- [ ] **M-Pesa self-serve upgrade flow** (Daraja API) — self-serve payment to upgrade plan
- [ ] **Admin panel plan management** at `/admin` — upgrade/downgrade any shop plan, record payment references, view subscription history

### Admin Panel Enhancement
- [ ] `/admin` route needs proper setup beyond plan management:
  - User management (list all users, suspend accounts)
  - Shop directory (all workspaces, owner, plan, creation date)
  - Plan override — manually upgrade/downgrade any shop
  - Subscription log — all payment records with Mpesa refs
  - Platform KPIs (total users, active shops, revenue)

### Minor Outstanding Items — Resolved ✅
- [x] Verify DEBIT_NOTE appears correctly in printed PDF template — **Completed**. Modified standard PDF template `route.ts` to automatically format document enums replacing underscores with spaces (e.g. `DEBIT NOTE`).
- [x] Verify recurring invoice cron job (`/api/cron`) is active on Vercel — **Completed**. Code fully verified and configured in `/api/cron/process-recurring/route.ts` using secure Vercel Cron header signatures.
- [x] Add inventory COGS data feed into main analytics module — **Resolved**. Confirmed that `analytics.ts` dynamically sums cost prices across *all* catalog sales (both physical items and untracked services), providing the most comprehensive gross profit margin calculation.
- [x] Opening balance seeder — **Completed**. Built the `migrateCatalogToStockLedger` server action and integrated a dashboard button on `/inventory` when the ledger is empty to auto-migrate legacy catalog stocks to ledger opening balances.

---

## Technical Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| COGS method | Weighted Average (display) | FIFO structure in ledger but avg cost used for valuation report simplicity |
| Paywall activation | Manual first, M-Pesa Daraja API next | KE market; manual via admin panel allows faster go-live |
| Existing users | Auto-assign STARTER | Admin can override individual shops to BASIC/PROFESSIONAL |
| Inventory on STARTER | Basic stock qty visible | Ledger history + multi-location locked to PROFESSIONAL+ |
| Admin plan management | Add to `/admin` super-admin panel | `/admin` route already exists; needs full buildout |
| stockQuantity field | Kept as cached denormalized field | Performance optimization; updated atomically alongside ledger writes |