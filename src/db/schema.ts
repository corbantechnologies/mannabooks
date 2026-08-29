import { pgTable, uuid, text, varchar, timestamp, numeric, pgEnum, unique, boolean, index, integer, jsonb, date } from 'drizzle-orm/pg-core';
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
// docStatusEnum is defined below after GL enums
export const taxTypeEnum = pgEnum('tax_type', ['V_16', 'V_0', 'EXEMPT']); // 16% VAT, 0% VAT, Tax Exempt
export const clientTypeEnum = pgEnum('client_type', ['WALK_IN', 'INDIVIDUAL', 'CORPORATE']);
export const userRoleEnum = pgEnum('user_role', ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE', 'VIEWER']);
export const recurringIntervalEnum = pgEnum('recurring_interval', ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export const expenseCategoryEnum = pgEnum('expense_category', ['RENT', 'UTILITIES', 'FUEL', 'MARKETING', 'SALARIES', 'OFFICE_SUPPLIES', 'OTHER']);
export const invitationStatusEnum = pgEnum('invitation_status', ['PENDING', 'ACCEPTED', 'REVOKED']);
export const accountTypeEnum = pgEnum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export const periodStatusEnum = pgEnum('period_status', ['OPEN', 'CLOSED']);
export const journalSourceEnum = pgEnum('journal_source', ['document', 'expense', 'income', 'payroll', 'manual', 'migrated']);
export const docStatusEnum = pgEnum('doc_status', ['DRAFT', 'ISSUED', 'OVERDUE', 'PAID', 'PARTIALLY_PAID', 'RECEIVED', 'CANCELLED']);
export const taxRegimeEnum = pgEnum('tax_regime', ['CIT', 'TOT', 'EXEMPT']);
export const assetClassEnum = pgEnum('asset_class', ['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'BUILDING']);

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
    plan: varchar('plan', { length: 30 }).default('FREE').notNull(), // 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
    subscriptionStatus: varchar('subscription_status', { length: 30 }).default('ACTIVE').notNull(), // 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'LIFETIME_FREE'
    subscriptionExpiresAt: timestamp('subscription_expires_at'),
    isLifetimePro: boolean('is_lifetime_pro').default(false).notNull(), // When true, all workspaces owned by this user inherit Lifetime PRO
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SHOPS TABLE (The Business Tenants)
export const shops = pgTable('shops', {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').references(() => users.id).notNull(), // The user who created/owns the shop
    name: text('name').notNull(),
    shortName: varchar('short_name', { length: 50 }), // Optional short trading alias e.g. Corban Tech
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    code: varchar('code', { length: 10 }).unique(),
    currency: varchar('currency', { length: 3 }).default('KES').notNull(),
    phone: varchar('phone', { length: 30 }), // Business phone contact e.g. +254 712 345 678
    website: varchar('website', { length: 255 }), // Business website URL e.g. https://corbantechnologies.org
    email: varchar('email', { length: 255 }), // Business email contact e.g. billing@corbantechnologies.org
    logoUrl: text('logo_url'),
    primaryColor: varchar('primary_color', { length: 20 }).default('#000000').notNull(), // Sleek Black default, custom hex, or palette
    taxPin: varchar('tax_pin', { length: 30 }), // e.g., KRA PIN (A... for personal/sole prop, P... for company)
    isVatRegistered: boolean('is_vat_registered').default(false).notNull(),
    vatNumber: varchar('vat_number', { length: 50 }), // Optional/Required VAT Registration Number
    fiscalYearStartMonth: integer('fiscal_year_start_month').default(1).notNull(), // 1 = January, 7 = July etc.
    hideOnboarding: boolean('hide_onboarding').default(false).notNull(),
    // General Ledger
    isGlEnabled: boolean('is_gl_enabled').default(false).notNull(),
    glOnboardingMode: boolean('gl_onboarding_mode').default(false).notNull(), // When true, allows backdating past closed periods
    // Income Tax settings
    taxRegime: taxRegimeEnum('tax_regime').default('EXEMPT').notNull(),
    isCitActive: boolean('is_cit_active').default(true).notNull(),
    isTotActive: boolean('is_tot_active').default(false).notNull(),
    citRate: numeric('cit_rate', { precision: 5, scale: 2 }).default('30.00').notNull(),
    estimatedAnnualProfit: numeric('estimated_annual_profit', { precision: 15, scale: 2 }).default('0.00').notNull(),
    // Subscription & Plan Governance
    plan: varchar('plan', { length: 30 }).default('FREE').notNull(), // 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
    subscriptionStatus: varchar('subscription_status', { length: 30 }).default('ACTIVE').notNull(), // 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | 'LIFETIME_FREE'
    isLifetimePro: boolean('is_lifetime_pro').default(false).notNull(), // Exempt from billing / owner shop flag
    isSuspended: boolean('is_suspended').default(false).notNull(), // Administrative lockout flag
    suspendedReason: text('suspended_reason'),
    trialEndsAt: timestamp('trial_ends_at'),
    subscriptionExpiresAt: timestamp('subscription_expires_at'),
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

// SHOP TERMS & CONDITIONS TABLE (Commercial payment, validity & delivery terms library)
export const shopTerms = pgTable('shop_terms', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    title: varchar('title', { length: 100 }).notNull(), // e.g., "100% Upfront Payment", "Payment on Delivery (COD)"
    content: text('content').notNull(), // Clause details
    isDefaultInvoice: boolean('is_default_invoice').default(false).notNull(), // Auto-attached to manual invoices/quotes
    isDefaultCatalog: boolean('is_default_catalog').default(false).notNull(), // Auto-attached to catalog/online inquiries
    displayOrder: integer('display_order').default(0).notNull(),
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
    defaultLocationId: uuid('default_location_id'), // FK set after stock_locations is defined
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
    termsAndConditions: text('terms_and_conditions'), // Serialized JSON array or formatted string of applied commercial terms

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
    isReadByRecipient: boolean('is_read_by_recipient').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_doc_number').on(table.shopId, table.docNumber, table.type),
]);

// DOCUMENT ITEMS TABLE (Individual Line Items)
export const documentItems = pgTable('document_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    description: text('description').notNull(), // The main product/service catalog name
    notes: text('notes'),                        // Optional sub-description/specification
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
    email: varchar('email', { length: 255 }),
    nationalId: varchar('national_id', { length: 50 }),
    kraPin: varchar('kra_pin', { length: 13 }),
    baseSalary: numeric('base_salary', { precision: 12, scale: 2 }).default('0.00').notNull(),
    commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).default('0.00').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// INCOME CATEGORIES
export const incomeCategoryEnum = pgEnum('income_category', [
    'INTEREST',
    'DIVIDENDS',
    'ASSET_SALE',
    'REFUNDS',
    'COMMISSION',
    'RENTAL_INCOME',
    'GRANTS_SUBSIDIES',
    'OTHER'
]);

// INCOMES TABLE
export const incomes = pgTable('incomes', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('KES').notNull(),
    category: incomeCategoryEnum('category').default('OTHER').notNull(),
    incomeDate: timestamp('income_date').notNull(),
    paymentChannel: varchar('payment_channel', { length: 50 }), // BANK, MPESA, CASH, CHEQUE, OTHER
    paymentReference: varchar('payment_reference', { length: 100 }),
    attachmentUrl: text('attachment_url'), 
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
    paymentChannel: varchar('payment_channel', { length: 50 }), // e.g. BANK, MPESA, CASH, CHEQUE, OTHER
    paymentReference: varchar('payment_reference', { length: 100 }),
    receiptUrl: text('receipt_url'), // Cloudinary URL for attached receipt
    isNonDeductible: boolean('is_non_deductible').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SHOP INVITATIONS TABLE (Pending Invites)
export const shopInvitations = pgTable('shop_invitations', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    email: text('email').notNull(),
    role: userRoleEnum('role').default('EMPLOYEE').notNull(),
    customPermissions: text('custom_permissions').default('{}').notNull(),
    token: varchar('token', { length: 64 }).notNull().unique(),
    status: invitationStatusEnum('status').default('PENDING').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
});

// ==========================================
// GENERAL LEDGER TABLES
// ==========================================

// CHART OF ACCOUNTS
export const chartOfAccounts = pgTable('chart_of_accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    code: varchar('code', { length: 10 }).notNull(),   // e.g. '4100', '6200'
    name: text('name').notNull(),                       // e.g. 'Sales Revenue', 'Rent Expense'
    accountType: accountTypeEnum('account_type').notNull(),
    isSystem: boolean('is_system').default(false).notNull(), // System accounts cannot be deleted
    parentCode: varchar('parent_code', { length: 10 }), // For sub-accounts
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_account_code').on(table.shopId, table.code),
]);

// FISCAL YEARS
export const fiscalYears = pgTable('fiscal_years', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    label: varchar('label', { length: 100 }).notNull(), // e.g. "Fiscal Year 2025/2026"
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    isClosed: boolean('is_closed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_fy_label').on(table.shopId, table.label),
]);

// ACCOUNTING PERIODS (Monthly)
export const accountingPeriods = pgTable('accounting_periods', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    fiscalYearId: uuid('fiscal_year_id').references(() => fiscalYears.id, { onDelete: 'cascade' }),
    periodName: varchar('period_name', { length: 50 }).notNull(), // e.g. 'July 2026'
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: periodStatusEnum('status').default('OPEN').notNull(),
    closedAt: timestamp('closed_at'),
    closedById: uuid('closed_by_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_period').on(table.shopId, table.startDate),
]);

// JOURNAL ENTRIES (Double-Entry)
export const journalEntries = pgTable('journal_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    periodId: uuid('period_id').references(() => accountingPeriods.id),
    entryDate: timestamp('entry_date').notNull(),
    description: text('description').notNull(),
    debitAccountId: uuid('debit_account_id').references(() => chartOfAccounts.id).notNull(),
    creditAccountId: uuid('credit_account_id').references(() => chartOfAccounts.id).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    sourceType: journalSourceEnum('source_type').default('manual').notNull(),
    sourceId: uuid('source_id'),               // FK to originating record (document, expense, etc.)
    createdById: uuid('created_by_id').references(() => users.id),
    isBackdated: boolean('is_backdated').default(false).notNull(),
    backdatedReason: text('backdated_reason'),  // Required when isBackdated = true
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// BUDGETS (Monthly per expense account)
export const budgets = pgTable('budgets', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    accountId: uuid('account_id').references(() => chartOfAccounts.id, { onDelete: 'cascade' }).notNull(),
    month: integer('month').notNull(),   // 1–12
    year: integer('year').notNull(),
    monthlyLimit: numeric('monthly_limit', { precision: 15, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_budget_account_period').on(table.shopId, table.accountId, table.month, table.year),
]);

// FIXED ASSETS REGISTER
export const fixedAssets = pgTable('fixed_assets', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    assetClass: assetClassEnum('asset_class').notNull(),
    purchaseDate: date('purchase_date').notNull(),
    purchaseCost: numeric('purchase_cost', { precision: 15, scale: 2 }).notNull(),
    taxWdv: numeric('tax_wdv', { precision: 15, scale: 2 }).notNull(), // Written Down Value for KRA
    scrapValue: numeric('scrap_value', { precision: 15, scale: 2 }).default('0.00').notNull(),
    isDisposed: boolean('is_disposed').default(false).notNull(),
    disposalDate: date('disposal_date'),
    disposalProceeds: numeric('disposal_proceeds', { precision: 15, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TAX INSTALMENTS SCHEDULE & PAYMENTS
export const taxInstalments = pgTable('tax_instalments', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    year: integer('year').notNull(),
    instalmentNumber: integer('instalment_number').notNull(), // 1, 2, 3, 4
    dueDate: date('due_date').notNull(),
    estimatedAmount: numeric('estimated_amount', { precision: 15, scale: 2 }).notNull(),
    paidAmount: numeric('paid_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
    paidAt: timestamp('paid_at'),
    paymentReference: text('payment_reference'),
    status: text('status').default('PENDING').notNull(), // PENDING, PAID, OVERDUE
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_instalment').on(table.shopId, table.year, table.instalmentNumber),
]);

// WITHHOLDING TAX (WHT) ACCUMULATED RECORDS
export const whtPayments = pgTable('wht_payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    grossAmount: numeric('gross_amount', { precision: 15, scale: 2 }).notNull(),
    whtRate: numeric('wht_rate', { precision: 5, scale: 2 }).notNull(), // e.g. 5.00, 10.00
    whtAmount: numeric('wht_amount', { precision: 15, scale: 2 }).notNull(),
    sourceDocumentId: uuid('source_document_id').references(() => documents.id, { onDelete: 'set null' }),
    status: text('status').default('PENDING').notNull(), // PENDING, PAID/REMITTED
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// INVENTORY MANAGEMENT TABLES
// ==========================================

// STOCK LOCATIONS TABLE (Physical storage nodes per workspace)
export const stockLocations = pgTable('stock_locations', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),          // e.g. "Main Warehouse", "Nairobi Branch"
    code: varchar('code', { length: 50 }),                      // e.g. "WH-01", "BRANCH-NBI"
    isDefault: boolean('is_default').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
    'PURCHASE_RECEIPT',
    'SALE',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'TRANSFER_OUT',
    'TRANSFER_IN',
    'OPENING_BALANCE',
    'RETURN',
    'VOID',
]);

export const stockAdjustmentReasonEnum = pgEnum('stock_adjustment_reason', [
    'DAMAGED',
    'EXPIRED',
    'THEFT',
    'COUNT_CORRECTION',
    'PROMOTION',
    'OTHER',
]);

// STOCK LEDGER TABLE (Immutable audit trail of every stock movement)
export const stockLedger = pgTable('stock_ledger', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    locationId: uuid('location_id').references(() => stockLocations.id, { onDelete: 'set null' }),
    movementType: stockMovementTypeEnum('movement_type').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(), // Always positive; type indicates direction
    unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).default('0.00').notNull(), // Cost at movement time (FIFO)
    runningBalance: numeric('running_balance', { precision: 12, scale: 2 }), // Qty on-hand after this entry
    sourceDocumentId: uuid('source_document_id').references(() => documents.id, { onDelete: 'set null' }),
    transferId: uuid('transfer_id'),  // Links paired TRANSFER_OUT + TRANSFER_IN rows
    adjustmentReason: stockAdjustmentReasonEnum('adjustment_reason'),
    notes: text('notes'),
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stockTransferStatusEnum = pgEnum('stock_transfer_status', ['DRAFT', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']);

// STOCK TRANSFERS TABLE (Inter-location stock movement requests)
export const stockTransfers = pgTable('stock_transfers', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    fromLocationId: uuid('from_location_id').references(() => stockLocations.id).notNull(),
    toLocationId: uuid('to_location_id').references(() => stockLocations.id).notNull(),
    status: stockTransferStatusEnum('status').default('DRAFT').notNull(),
    notes: text('notes'),
    requestedById: uuid('requested_by_id').references(() => users.id),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// STOCK TRANSFER ITEMS TABLE (Line items per transfer)
export const stockTransferItems = pgTable('stock_transfer_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    transferId: uuid('transfer_id').references(() => stockTransfers.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    quantityRequested: numeric('quantity_requested', { precision: 12, scale: 2 }).notNull(),
    quantityReceived: numeric('quantity_received', { precision: 12, scale: 2 }).default('0.00').notNull(),
    notes: text('notes'),
});

// PRODUCT LOCATION STOCK TABLE
// Authoritative per-location quantity for each tracked product.
// Replaces the need to SUM the full ledger for current stock at a given location.
// products.stockQuantity is a denormalized total (SUM of all location quantities).
export const productLocationStock = pgTable('product_location_stock', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    locationId: uuid('location_id').references(() => stockLocations.id, { onDelete: 'cascade' }).notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 2 }).default('0.00').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_product_location').on(table.productId, table.locationId),
]);

// SUBSCRIPTIONS TABLE (Tenancy Subscription Ledger)
export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    plan: varchar('plan', { length: 30 }).notNull(), // 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
    status: varchar('status', { length: 30 }).default('ACTIVE').notNull(), // 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | 'LIFETIME_FREE'
    amount: numeric('amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    currency: varchar('currency', { length: 3 }).default('KES').notNull(),
    billingInterval: varchar('billing_interval', { length: 20 }).default('MONTHLY').notNull(), // 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
    startDate: timestamp('start_date').defaultNow().notNull(),
    endDate: timestamp('end_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// BILLING TRANSACTIONS TABLE (M-Pesa STK Push Audit Trail)
export const billingTransactions = pgTable('billing_transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    checkoutRequestId: varchar('checkout_request_id', { length: 100 }).notNull().unique(),
    merchantRequestId: varchar('merchant_request_id', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    mpesaReceiptNumber: varchar('mpesa_receipt_number', { length: 50 }),
    status: varchar('status', { length: 30 }).default('PENDING').notNull(), // 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    resultCode: integer('result_code'),
    resultDesc: text('result_desc'),
    targetPlan: varchar('target_plan', { length: 30 }).notNull(), // Plan upgraded to
    billingMonths: integer('billing_months').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
});

// PLATFORM PLANS TABLE (Dynamic Pricing & Quota Management)
export const platformPlans = pgTable('platform_plans', {
    id: varchar('id', { length: 30 }).primaryKey(), // 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
    name: varchar('name', { length: 100 }).notNull(),
    tagline: text('tagline').notNull(),
    priceKesMonthly: integer('price_kes_monthly').default(0).notNull(),
    priceKesAnnually: integer('price_kes_annually').default(0).notNull(),
    annualDiscountPercent: integer('annual_discount_percent').default(20).notNull(),
    maxMembers: integer('max_members').default(1).notNull(), // -1 = Unlimited
    maxLocations: integer('max_locations').default(1).notNull(), // -1 = Unlimited
    canTransferStock: boolean('can_transfer_stock').default(false).notNull(),
    hasGeneralLedger: boolean('has_general_ledger').default(false).notNull(),
    hasReconciliation: boolean('has_reconciliation').default(false).notNull(),
    hasStatutoryPayroll: boolean('has_statutory_payroll').default(false).notNull(),
    hasApiAccess: boolean('has_api_access').default(false).notNull(),
    badge: varchar('badge', { length: 50 }), // e.g. 'Most Popular', 'Best Value'
    isHighlighted: boolean('is_highlighted').default(false).notNull(),
    featuresJson: text('features_json').notNull(), // JSON stringified array of feature bullets
    isActive: boolean('is_active').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 3. RELATIONS (For ORM Querying)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
    ownedShops: many(shops),
    memberships: many(shopMembers),
    sessions: many(sessions),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
    owner: one(users, { fields: [shops.ownerId], references: [users.id] }),
    members: many(shopMembers),
    paymentMethods: many(paymentMethods),
    terms: many(shopTerms),
    products: many(products),
    clients: many(clients),
    suppliers: many(suppliers),
    documents: many(documents),
    expenses: many(expenses),
    incomes: many(incomes),
    invitations: many(shopInvitations),
    chartOfAccounts: many(chartOfAccounts),
    fiscalYears: many(fiscalYears),
    accountingPeriods: many(accountingPeriods),
    journalEntries: many(journalEntries),
    budgets: many(budgets),
    fixedAssets: many(fixedAssets),
    taxInstalments: many(taxInstalments),
    whtPayments: many(whtPayments),
    stockLocations: many(stockLocations),
    stockTransfers: many(stockTransfers),
    stockLedger: many(stockLedger),
    subscriptions: many(subscriptions),
    billingTransactions: many(billingTransactions),
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

export const incomesRelations = relations(incomes, ({ one }) => ({
    shop: one(shops, { fields: [incomes.shopId], references: [shops.id] }),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
    shop: one(shops, { fields: [employees.shopId], references: [shops.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
    shop: one(shops, { fields: [paymentMethods.shopId], references: [shops.id] }),
}));

export const shopTermsRelations = relations(shopTerms, ({ one }) => ({
    shop: one(shops, { fields: [shopTerms.shopId], references: [shops.id] }),
}));

export const shopInvitationsRelations = relations(shopInvitations, ({ one }) => ({
    shop: one(shops, { fields: [shopInvitations.shopId], references: [shops.id] }),
}));

// GL Relations
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
    shop: one(shops, { fields: [chartOfAccounts.shopId], references: [shops.id] }),
    debitEntries: many(journalEntries, { relationName: 'debit_account' }),
    creditEntries: many(journalEntries, { relationName: 'credit_account' }),
    budgets: many(budgets),
}));

export const fiscalYearsRelations = relations(fiscalYears, ({ one, many }) => ({
    shop: one(shops, { fields: [fiscalYears.shopId], references: [shops.id] }),
    periods: many(accountingPeriods),
}));

export const accountingPeriodsRelations = relations(accountingPeriods, ({ one, many }) => ({
    shop: one(shops, { fields: [accountingPeriods.shopId], references: [shops.id] }),
    closedBy: one(users, { fields: [accountingPeriods.closedById], references: [users.id] }),
    fiscalYear: one(fiscalYears, { fields: [accountingPeriods.fiscalYearId], references: [fiscalYears.id] }),
    journalEntries: many(journalEntries),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
    shop: one(shops, { fields: [journalEntries.shopId], references: [shops.id] }),
    period: one(accountingPeriods, { fields: [journalEntries.periodId], references: [accountingPeriods.id] }),
    debitAccount: one(chartOfAccounts, { fields: [journalEntries.debitAccountId], references: [chartOfAccounts.id], relationName: 'debit_account' }),
    creditAccount: one(chartOfAccounts, { fields: [journalEntries.creditAccountId], references: [chartOfAccounts.id], relationName: 'credit_account' }),
    createdBy: one(users, { fields: [journalEntries.createdById], references: [users.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
    shop: one(shops, { fields: [budgets.shopId], references: [shops.id] }),
    account: one(chartOfAccounts, { fields: [budgets.accountId], references: [chartOfAccounts.id] }),
}));

// Tax Relations
export const fixedAssetsRelations = relations(fixedAssets, ({ one }) => ({
    shop: one(shops, { fields: [fixedAssets.shopId], references: [shops.id] }),
}));

export const taxInstalmentsRelations = relations(taxInstalments, ({ one }) => ({
    shop: one(shops, { fields: [taxInstalments.shopId], references: [shops.id] }),
}));

export const whtPaymentsRelations = relations(whtPayments, ({ one }) => ({
    shop: one(shops, { fields: [whtPayments.shopId], references: [shops.id] }),
    sourceDocument: one(documents, { fields: [whtPayments.sourceDocumentId], references: [documents.id] }),
}));

// Ledger Snapshots (GL Backups before resets)
export const ledgerSnapshots = pgTable('ledger_snapshots', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    entryCount: integer('entry_count').default(0).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    data: jsonb('data').notNull(),
});

export const ledgerSnapshotsRelations = relations(ledgerSnapshots, ({ one }) => ({
    shop: one(shops, { fields: [ledgerSnapshots.shopId], references: [shops.id] }),
}));

// ==========================================
// INVENTORY RELATIONS
// ==========================================

export const stockLocationsRelations = relations(stockLocations, ({ one, many }) => ({
    shop: one(shops, { fields: [stockLocations.shopId], references: [shops.id] }),
    ledgerEntries: many(stockLedger),
    transfersFrom: many(stockTransfers, { relationName: 'from_location' }),
    transfersTo: many(stockTransfers, { relationName: 'to_location' }),
    locationStock: many(productLocationStock),
}));

export const stockLedgerRelations = relations(stockLedger, ({ one }) => ({
    shop: one(shops, { fields: [stockLedger.shopId], references: [shops.id] }),
    product: one(products, { fields: [stockLedger.productId], references: [products.id] }),
    location: one(stockLocations, { fields: [stockLedger.locationId], references: [stockLocations.id] }),
    sourceDocument: one(documents, { fields: [stockLedger.sourceDocumentId], references: [documents.id] }),
    createdBy: one(users, { fields: [stockLedger.createdById], references: [users.id] }),
}));

export const stockTransfersRelations = relations(stockTransfers, ({ one, many }) => ({
    shop: one(shops, { fields: [stockTransfers.shopId], references: [shops.id] }),
    fromLocation: one(stockLocations, { fields: [stockTransfers.fromLocationId], references: [stockLocations.id], relationName: 'from_location' }),
    toLocation: one(stockLocations, { fields: [stockTransfers.toLocationId], references: [stockLocations.id], relationName: 'to_location' }),
    requestedBy: one(users, { fields: [stockTransfers.requestedById], references: [users.id] }),
    items: many(stockTransferItems),
}));

export const stockTransferItemsRelations = relations(stockTransferItems, ({ one }) => ({
    transfer: one(stockTransfers, { fields: [stockTransferItems.transferId], references: [stockTransfers.id] }),
    product: one(products, { fields: [stockTransferItems.productId], references: [products.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    shop: one(shops, { fields: [products.shopId], references: [shops.id] }),
    documentItems: many(documentItems),
    defaultLocation: one(stockLocations, { fields: [products.defaultLocationId], references: [stockLocations.id] }),
    stockLedger: many(stockLedger),
    transferItems: many(stockTransferItems),
    locationStock: many(productLocationStock),
}));

// PRODUCT LOCATION STOCK RELATIONS
export const productLocationStockRelations = relations(productLocationStock, ({ one }) => ({
    shop: one(shops, { fields: [productLocationStock.shopId], references: [shops.id] }),
    product: one(products, { fields: [productLocationStock.productId], references: [products.id] }),
    location: one(stockLocations, { fields: [productLocationStock.locationId], references: [stockLocations.id] }),
}));