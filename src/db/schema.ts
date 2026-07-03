import { pgTable, uuid, text, varchar, timestamp, numeric, pgEnum, unique, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. ENUMS (Strict Database Constraints)
// ==========================================
export const docTypeEnum = pgEnum('doc_type', ['QUOTATION', 'INVOICE', 'RECEIPT']);
export const docStatusEnum = pgEnum('doc_status', ['DRAFT', 'SENT', 'OVERDUE', 'PAID']);
export const taxTypeEnum = pgEnum('tax_type', ['V_16', 'V_0', 'EXEMPT']); // 16% VAT, 0% VAT, Tax Exempt
export const clientTypeEnum = pgEnum('client_type', ['WALK_IN', 'INDIVIDUAL', 'CORPORATE']);
export const userRoleEnum = pgEnum('user_role', ['OWNER', 'ADMIN', 'EMPLOYEE']);

// ==========================================
// 2. TABLES
// ==========================================

// USERS TABLE (The Accounts)
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SHOPS TABLE (The Business Tenants)
export const shops = pgTable('shops', {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').references(() => users.id).notNull(), // The user who created/owns the shop
    name: text('name').notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    currency: varchar('currency', { length: 3 }).default('KES').notNull(),
    logoUrl: text('logo_url'),
    primaryColor: varchar('primary_color', { length: 7 }).default('#000000').notNull(), // Sleek Black default
    taxPin: varchar('tax_pin', { length: 30 }), // e.g., KRA PIN
    isVatRegistered: boolean('is_vat_registered').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SHOP MEMBERS TABLE (Future-proofs Multi-shop access & Employees)
export const shopMembers = pgTable('shop_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: userRoleEnum('role').default('OWNER').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_user').on(table.shopId, table.userId), // Prevents duplicating a user in the same shop
]);

// PAYMENT METHODS TABLE
export const paymentMethods = pgTable('payment_methods', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 100 }).notNull(), // e.g., "M-Pesa Till", "NCBA Bank Account"
    details: text('details').notNull(), // Account numbers / instructions
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// PRODUCTS/SERVICES CATALOG TABLE
export const products = pgTable('products', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    defaultTaxType: taxTypeEnum('default_tax_type').default('V_16').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// CLIENTS TABLE (Supports both Corporate and Personal Tax PIN requirements)
export const clients = pgTable('clients', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: varchar('phone', { length: 20 }),
    clientType: clientTypeEnum('client_type').default('WALK_IN').notNull(),
    taxPin: varchar('tax_pin', { length: 30 }), // Personal or corporate tax identifier
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// DOCUMENTS TABLE (Quotations, Invoices, Receipts)
export const documents = pgTable('documents', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    clientId: uuid('client_id').references(() => clients.id).notNull(),
    type: docTypeEnum('type').notNull(),
    docNumber: varchar('doc_number', { length: 50 }).notNull(), // e.g., INV-001
    status: docStatusEnum('status').default('DRAFT').notNull(),

    // High-precision frozen metrics
    subTotal: numeric('sub_total', { precision: 12, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),

    issueDate: timestamp('issue_date').defaultNow().notNull(),
    dueDate: timestamp('due_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_doc_number').on(table.shopId, table.docNumber, table.type),
]);

// DOCUMENT ITEMS TABLE (Individual Line Items)
export const documentItems = pgTable('document_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
    description: text('description').notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    taxType: taxTypeEnum('tax_type').default('V_16').notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    itemTotal: numeric('item_total', { precision: 12, scale: 2 }).notNull(),
});

// DOCUMENT TOKENS TABLE (Secure 64-char public unguessable portal links)
export const documentTokens = pgTable('document_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull().unique(),
    token: varchar('token', { length: 64 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('token_idx').on(table.token)
]);

// ==========================================
// 3. RELATIONS (Application Level Hydration Helpers)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
    memberships: many(shopMembers),
    sessions: many(sessions),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
    owner: one(users, { fields: [shops.ownerId], references: [users.id] }),
    members: many(shopMembers),
    paymentMethods: many(paymentMethods),
    products: many(products),
    clients: many(clients),
    documents: many(documents),
}));

export const shopMembersRelations = relations(shopMembers, ({ one }) => ({
    shop: one(shops, { fields: [shopMembers.shopId], references: [shops.id] }),
    user: one(users, { fields: [shopMembers.userId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
    shop: one(shops, { fields: [documents.shopId], references: [shops.id] }),
    client: one(clients, { fields: [documents.clientId], references: [clients.id] }),
    items: many(documentItems),
    token: one(documentTokens, { fields: [documents.id], references: [documentTokens.documentId] }),
}));

export const documentItemsRelations = relations(documentItems, ({ one }) => ({
    document: one(documents, { fields: [documentItems.documentId], references: [documents.id] }),
}));

export const documentTokensRelations = relations(documentTokens, ({ one }) => ({
    document: one(documents, { fields: [documentTokens.documentId], references: [documents.id] }),
}));

// Add this table to the bottom of your src/db/schema.ts
export const sessions = pgTable('sessions', {
    id: varchar('id', { length: 255 }).primaryKey(), // The unique cryptographically secure token ID
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});



export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));