import { pgTable, uuid, text, varchar, timestamp, numeric, pgEnum, unique, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. ENUMS (Strict Database Constraints)
// ==========================================
export const docTypeEnum = pgEnum('doc_type', [
    'QUOTATION',
    'INVOICE',
    'RECEIPT',
    'LPO',
    'PO',
    'DELIVERY_NOTE',
    'CREDIT_NOTE',
    'DEBIT_NOTE',
    'GOODS_RECEIVED_NOTE',
    'PAYMENT_VOUCHER',
    'PAYROLL_VOUCHER'
]);
export const docStatusEnum = pgEnum('doc_status', ['DRAFT', 'ISSUED', 'OVERDUE', 'PAID', 'RECEIVED']);
export const taxTypeEnum = pgEnum('tax_type', ['V_16', 'V_0', 'EXEMPT']); // 16% VAT, 0% VAT, Tax Exempt
export const clientTypeEnum = pgEnum('client_type', ['WALK_IN', 'INDIVIDUAL', 'CORPORATE']);
export const userRoleEnum = pgEnum('user_role', ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE', 'VIEWER']);
export const recurringIntervalEnum = pgEnum('recurring_interval', ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export const expenseCategoryEnum = pgEnum('expense_category', ['RENT', 'UTILITIES', 'FUEL', 'MARKETING', 'SALARIES', 'OFFICE_SUPPLIES', 'OTHER']);

// ==========================================
// 2. TABLES
// ==========================================

// USERS TABLE (The Accounts)
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    isSuperAdmin: boolean('is_super_admin').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SHOPS TABLE (The Business Tenants)
export const shops = pgTable('shops', {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').references(() => users.id).notNull(), // The user who created/owns the shop
    name: text('name').notNull(),
    shortName: varchar('short_name', { length: 50 }), // Optional short trading alias e.g. Corban Tech
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    currency: varchar('currency', { length: 3 }).default('KES').notNull(),
    phone: varchar('phone', { length: 30 }), // Business phone contact e.g. +254 712 345 678
    website: varchar('website', { length: 255 }), // Business website URL e.g. https://corbantechnologies.org
    logoUrl: text('logo_url'),
    primaryColor: varchar('primary_color', { length: 20 }).default('#000000').notNull(), // Sleek Black default, custom hex, or palette
    taxPin: varchar('tax_pin', { length: 30 }), // e.g., KRA PIN (A... for personal/sole prop, P... for company)
    isVatRegistered: boolean('is_vat_registered').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SHOP MEMBERS TABLE (Future-proofs Multi-shop access & Employees)
export const shopMembers = pgTable('shop_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: userRoleEnum('role').default('OWNER').notNull(),
    customPermissions: text('custom_permissions').default('{}').notNull(), // JSON string for granular employee permissions
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
    itemType: varchar('item_type', { length: 20 }).default('PRODUCT').notNull(), // 'PRODUCT' | 'SERVICE'
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    costPrice: numeric('cost_price', { precision: 12, scale: 2 }).default('0.00').notNull(),
    defaultTaxType: taxTypeEnum('default_tax_type').default('V_16').notNull(),
    trackStock: boolean('track_stock').default(false).notNull(),
    stockQuantity: numeric('stock_quantity', { precision: 12, scale: 2 }).default('0.00').notNull(),
    reorderThreshold: numeric('reorder_threshold', { precision: 12, scale: 2 }).default('5.00').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// CLIENTS TABLE (Supports Corporate, Sole Proprietor A..., and Personal Tax PINs)
export const clients = pgTable('clients', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: varchar('phone', { length: 20 }),
    clientType: clientTypeEnum('client_type').default('WALK_IN').notNull(),
    taxPin: varchar('tax_pin', { length: 30 }), // Personal/Soleprop (A...) or Corporate (P...) tax PIN
    requiresEtims: boolean('requires_etims').default(false).notNull(), // Client-level eTIMS fiscal requirement flag
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SUPPLIERS / VENDORS TABLE (Payables & Inbound Procurement Entities)
export const suppliers = pgTable('suppliers', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: varchar('phone', { length: 20 }),
    supplierType: clientTypeEnum('supplier_type').default('CORPORATE').notNull(),
    taxPin: varchar('tax_pin', { length: 30 }), // Personal/Soleprop (A...) or Corporate (P...) tax PIN without restriction
    requiresEtims: boolean('requires_etims').default(false).notNull(),
    paymentTerms: varchar('payment_terms', { length: 50 }).default('NET_30'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// DOCUMENTS TABLE (Outbound Sales & Inbound Procurement Documents)
export const documents = pgTable('documents', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    clientId: uuid('client_id').references(() => clients.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    type: docTypeEnum('type').notNull(),
    docNumber: varchar('doc_number', { length: 50 }).notNull(), // e.g., INV-001, RCT-001, LPO-001, CN-001
    status: docStatusEnum('status').default('DRAFT').notNull(),

    // Statutory KRA eTIMS & Lineage Fields
    kraCuInvoiceNumber: varchar('kra_cu_invoice_number', { length: 100 }), // Optional eTIMS CU serial number
    parentDocumentId: uuid('parent_document_id'), // Self-reference link for conversions & credit notes
    requiresEtims: boolean('requires_etims').default(false).notNull(),
    notes: text('notes'),

    // Optional Settlement Confirmation Details
    paymentChannel: varchar('payment_channel', { length: 50 }), // e.g. BANK, MPESA, CASH, CHEQUE, OTHER
    paymentReference: varchar('payment_reference', { length: 100 }), // e.g. M-Pesa Code QAB71239X or Bank Ref FT261900123

    // Multi-currency and High-precision frozen metrics
    currency: varchar('currency', { length: 3 }), // Defaults to shop currency if null
    subTotal: numeric('sub_total', { precision: 12, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),

    // Recurring Invoicing & Reminders
    isRecurring: boolean('is_recurring').default(false).notNull(),
    recurringInterval: recurringIntervalEnum('recurring_interval'),
    nextRecurringDate: timestamp('next_recurring_date'),
    lastReminderSentAt: timestamp('last_reminder_sent_at'),

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
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
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

// EMPLOYEES TABLE
export const employees = pgTable('employees', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    nationalId: varchar('national_id', { length: 50 }),
    kraPin: varchar('kra_pin', { length: 13 }),
    baseSalary: numeric('base_salary', { precision: 12, scale: 2 }).default('0.00').notNull(),
    commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).default('0.00').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// EXPENSES TABLE (Feature 8)
export const expenses = pgTable('expenses', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('KES').notNull(),
    category: expenseCategoryEnum('category').default('OTHER').notNull(),
    expenseDate: timestamp('expense_date').notNull(),
    receiptUrl: text('receipt_url'), // Cloudinary URL for attached receipt
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 3. RELATIONS (For ORM Querying)
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
    suppliers: many(suppliers),
    documents: many(documents),
    expenses: many(expenses),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
    shop: one(shops, { fields: [clients.shopId], references: [shops.id] }),
    documents: many(documents),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
    shop: one(shops, { fields: [suppliers.shopId], references: [shops.id] }),
    documents: many(documents),
}));

export const shopMembersRelations = relations(shopMembers, ({ one }) => ({
    shop: one(shops, { fields: [shopMembers.shopId], references: [shops.id] }),
    user: one(users, { fields: [shopMembers.userId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
    shop: one(shops, { fields: [documents.shopId], references: [shops.id] }),
    client: one(clients, { fields: [documents.clientId], references: [clients.id] }),
    supplier: one(suppliers, { fields: [documents.supplierId], references: [suppliers.id] }),
    parentDocument: one(documents, { fields: [documents.parentDocumentId], references: [documents.id], relationName: 'document_lineage' }),
    items: many(documentItems),
    token: one(documentTokens, { fields: [documents.id], references: [documentTokens.documentId] }),
}));

export const documentItemsRelations = relations(documentItems, ({ one }) => ({
    document: one(documents, { fields: [documentItems.documentId], references: [documents.id] }),
    product: one(products, { fields: [documentItems.productId], references: [products.id] }),
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

// PASSWORD RESET TOKENS
export const passwordResetTokens = pgTable('password_reset_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expensesRelations = relations(expenses, ({ one }) => ({
    shop: one(shops, { fields: [expenses.shopId], references: [shops.id] }),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
    shop: one(shops, { fields: [employees.shopId], references: [shops.id] }),
}));