# Technical Architecture & System Engineering Manual

This document outlines the system configuration, database structures, runtime routing boundaries, and feature architecture governing the Manna Books codebase platform.

---

## 1. Technical Stack Overview

The application is built on a modern, robust, and unified full-stack TypeScript architecture:
* **Frontend Framework:** Next.js 15+ (App Router) executing via React Server Components (RSC) for optimized data rendering.
* **Style Engine:** Vanilla CSS & Tailwind CSS v4 using a flat, architectural, CSS-first design token definition layer (`border-radius: 0px`).
* **Dynamic Theme Provider:** Dynamic CSS Custom Property (`--brand-primary`) injection into workspace layout, public client portals, vector PDFs, and Resend emails.
* **Database Layer:** PostgreSQL hosted on Railway Cloud infrastructure.
* **ORM Mapping:** Drizzle ORM utilizing strict relational schemas and type-safe transactional compilation macros.
* **Authentication Pool:** Secure, stateful database cookie session mapping system using native Node crypto and HTTP-Only lax attributes.
* **Asset Upload Pipeline:** Cloudinary REST API integration for business logo image uploads.
* **Communication Pipelines:** Resend API integration for automated email notifications.
* **Document Export Module:** Server-side PDF engine utilizing `@react-pdf/renderer` executing on the Node.js native runtime environment.
* **PWA Engine:** Web App Manifest (`manifest.ts`), Service Worker (`public/sw.js`), offline fallback handling (`/offline`), and custom iOS/Android install prompts.

---

## 2. Relational Database Schema Model

The PostgreSQL architecture relies on clear multi-tenant containment layers mapped explicitly via `shop_id` foreign keys.

### Core Data Models & Relationships
* **`users`**: Contains master system profiles with unique emails and hashed credentials.
* **`shops`**: Represents distinct workspace business entities, storing currency properties, tax configurations, custom KRA PIN strings, `primaryColor`, `logoUrl`, `phone`, `website`, and `shortName`.
* **`shop_members`**: High-performance junction table mapping user access profiles to shops with designated privilege roles (`OWNER`, `OPERATOR`).
* **`sessions`**: Tracks active database-backed cookie sessions with explicit timestamps and automatic expiration barriers.
* **`clients`**: Contains customer data, mapping customer types (`WALK_IN`, `INDIVIDUAL`, `CORPORATE`) to specific validation rules and tax PINs.
* **`suppliers`**: Contains vendor data, mapping supplier types (`CORPORATE`, `INDIVIDUAL`), tax PINs, payment terms, and `requiresEtims` compliance flags.
* **`products`**: Product catalog lookup index, storing default tax statuses (`V_16`, `V_0`, `EXEMPT`), unit prices, and SKU codes.
* **`documents`**: The central financial ledger snapshot, storing numeric figures as string variables to preserve exact database precision. Fields include `type`, `docNumber`, `status`, `kraCuInvoiceNumber`, `parentDocumentId`, `requiresEtims`, `paymentChannel`, `paymentReference`, `subTotal`, `taxAmount`, `grandTotal`, `issueDate`, `dueDate`.
* **`document_items`**: Sub-ledger arrays recording specific item row lines, quantity valuations, unit rates, tax types, and applied tax amounts.
* **`document_tokens`**: Stores secure 64-character token identifiers to authenticate client portal views without a password layer.

---

## 3. Data Processing & Calculation Logic

To prevent Javascript floating-point math issues ($0.1 + 0.2 = 0.30000000000000004$), all financial metrics are processed using explicit scaling and rounding before being written to the database:

$$\text{SubTotal} = \text{Quantity} \times \text{UnitPrice}$$
$$\text{TaxAmount} = \text{SubTotal} \times 0.16 \quad (\text{if TaxType} = \text{"V\_16"})$$

All metrics are processed through a central utility function before database insertion:
```typescript
Math.round(value * 100) / 100
```

---

## 4. Key Server Actions & API Engines

### Document & Lineage Actions (`src/lib/actions/documents.ts`)
* `createBillingDocument`: Compiles new multi-line documents with auto-increment serial numbers (`INV-`, `RCT-`, `QT-`, `LPO-`, `PO-`, `GRN-`, `PV-`, `CN-`).
* `updateDocumentStatus`: Updates document lifecycle status (`DRAFT`, `SENT`, `OVERDUE`, `PAID`) with permanent settlement guards (blocking reverting `PAID` items). Supports updating `paymentChannel` and `paymentReference`.
* `updateDocumentKraCuNumberAction`: Updates statutory KRA eTIMS CU serial numbers across all statuses.
* `convertDocumentAction`: Universal document conversion engine converting source documents (Quotes, LPOs, POs) into target types (Invoices, Goods Received Notes, Payment Vouchers) maintaining `parentDocumentId` lineage links.
* `raiseCreditNoteAction`: Issues a Credit Note against an existing settled invoice to reverse value.

### Analytics Data Engine (`src/lib/actions/analytics.ts`)
* `getWorkspaceAnalyticsData(shopId, timeframe)`: Aggregates real-time business intelligence:
  - Executive KPIs (Settled Inflow, Outflow, Net Cash Flow, A/R Pool, A/P Debt).
  - 6-month Chronological Cash Flow Timeline Stream.
  - Statutory KRA eTIMS 20th Monthly VAT Return Tracker.
  - Accounts Receivable (A/R) Aging Matrix (`0–30d`, `31–60d`, `61–90d`, `90+d`).
  - Product Sales Velocity & Client LTV Concentration Leaderboards.