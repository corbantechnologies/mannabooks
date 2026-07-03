# Technical Architecture & System Engineering Manual

This document outlines the system configuration, database structures, and runtime routing boundaries governing the Manna Books codebase platform.

---

## 1. Technical Stack Overview

The application is built on a modern, robust, and unified full-stack TypeScript architecture:
* **Frontend Framework:** Next.js 16 (App Router) executing via React Server Components (RSC) for optimized data rendering.
* **Style Engine:** Tailwind CSS v4 using a flat, architectural, CSS-first design token definition layer (`border-radius: 0px`).
* **Database Layer:** PostgreSQL hosted on Railway Cloud infrastructure.
* **ORM Mapping:** Drizzle ORM utilizing strict relational schemas and type-safe transactional compilation macros.
* **Authentication Pool:** Secure, stateful database cookie session mapping system using native Node crypto and HTTP-Only lax attributes.
* **Communication Pipelines:** Resend API integration for automated email notifications.
* **Document Export Module:** Server-side PDF engine utilizing `@react-pdf/renderer` executing on the Node.js native runtime environment.

---

## 2. Relational Database Schema Model

The PostgreSQL architecture relies on clear multi-tenant containment layers mapped explicitly via `shop_id` foreign keys.

### Core Data Models & Relationships
* **`users`**: Contains master system profiles with unique emails and hashed credentials.
* **`shops`**: Represents distinct workspace business entities, storing currency properties, tax configurations, and custom KRA PIN strings.
* **`shop_members`**: High-performance junction table mapping user access profiles to shops with designated privilege roles (`OWNER`, `OPERATOR`).
* **`sessions`**: Tracks active database-backed cookie sessions with explicit timestamps and automatic expiration barriers.
* **`clients`**: Contains customer data, mapping customer types (`WALK_IN`, `INDIVIDUAL`, `CORPORATE`) to specific validation rules.
* **`products`**: Your product catalog lookup index, storing default tax statuses (`V_16`, `V_0`, `EXEMPT`) and base rates.
* **`documents`**: The central financial ledger snapshot, storing numeric figures as string variables to preserve exact database precision.
* **`document_items`**: Sub-ledger arrays recording specific item row lines, quantity valuations, and applied taxes.
* **`document_tokens`**: Stores secure 64-character token identifiers to authenticate client portal views without a password layer.

---

## 3. Data Processing & Calculation Logic

To prevent Javascript floating-point math issues ($0.1 + 0.2 = 0.30000000000000004$), all financial metrics are processed using explicit scaling and rounding before being written to the database:

$$\text{SubTotal} = \text{Quantity} \times \text{UnitPrice}$$
$$\text{TaxAmount} = \text{SubTotal} \times 0.16 \quad (\text{if TaxType} = \text{"V\_16"})$$

All metrics are processed through a central utility function before database insertion:
```typescript
Math.round(value * 100) / 100