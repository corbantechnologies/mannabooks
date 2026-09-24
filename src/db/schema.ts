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
export const userRoleEnum = pgEnum('user_role', [
    'OWNER',
    'ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'STOREKEEPER',
    'CASHIER',
    'DISPATCHER',
    'SALES_REP',
    'EMPLOYEE',
    'VIEWER'
]);
export const recurringIntervalEnum = pgEnum('recurring_interval', ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export const expenseCategoryEnum = pgEnum('expense_category', ['RENT', 'UTILITIES', 'FUEL', 'MARKETING', 'SALARIES', 'OFFICE_SUPPLIES', 'OTHER']);
export const invitationStatusEnum = pgEnum('invitation_status', ['PENDING', 'ACCEPTED', 'REVOKED']);
export const accountTypeEnum = pgEnum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export const periodStatusEnum = pgEnum('period_status', ['OPEN', 'CLOSED']);
export const journalSourceEnum = pgEnum('journal_source', ['document', 'expense', 'income', 'payroll', 'manual', 'migrated']);
export const docStatusEnum = pgEnum('doc_status', ['DRAFT', 'ISSUED', 'OVERDUE', 'PAID', 'PARTIALLY_PAID', 'RECEIVED', 'CANCELLED', 'CONFIRMED']);
export const taxRegimeEnum = pgEnum('tax_regime', ['CIT', 'TOT', 'EXEMPT']);
export const assetClassEnum = pgEnum('asset_class', ['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'BUILDING']);
export const loyaltyEngineModeEnum = pgEnum('loyalty_engine_mode', ['OFF', 'POINTS_ONLY', 'TIERS_ONLY', 'HYBRID']);
export const loyaltyMovementTypeEnum = pgEnum('loyalty_movement_type', [
    'EARN',
    'REDEEM',
    'MANUAL_ADJUST',
    'EXPIRE',
    'WALLET_TOPUP',
    'WALLET_DEBIT',
    'VOID'
]);

export const employmentTypeEnum = pgEnum('employment_type', ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
export const expenseClaimStatusEnum = pgEnum('expense_claim_status', ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED']);

export const approvalRequestTypeEnum = pgEnum('approval_request_type', [
    'PURCHASE_REQUISITION',
    'EXPENSE_CLAIM',
    'CREDIT_NOTE',
    'STOCK_ADJUSTMENT',
    'BUDGET_OVERRUN'
]);
export const approvalStatusEnum = pgEnum('approval_status', [
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
]);
export const approvalPriorityEnum = pgEnum('approval_priority', [
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
]);
export const productionOrderStatusEnum = pgEnum('production_order_status', [
    'DRAFT',
    'COMPLETED',
    'CANCELLED'
]);
export const stocktakeStatusEnum = pgEnum('stocktake_status', [
    'DRAFT',
    'COUNTING',
    'COMPLETED',
    'CANCELLED'
]);

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
    subscriptionStatus: varchar('subscription_status', { length: 30 }).default('ACTIVE').notNull(), // 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'LIFETIME_FREE'
    subscriptionExpiresAt: timestamp('subscription_expires_at'),
    gracePeriodEndsAt: timestamp('grace_period_ends_at'),
    autoRenewEnabled: boolean('auto_renew_enabled').default(true).notNull(),
    autoRenewPhone: varchar('auto_renew_phone', { length: 30 }),
    lastRenewalPromptAt: timestamp('last_renewal_prompt_at'),
    isLifetimePro: boolean('is_lifetime_pro').default(false).notNull(), // When true, all workspaces owned by this user inherit Lifetime PRO
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SHOPS TABLE (The Business Tenants)
export const shops = pgTable('shops', {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').references(() => users.id).notNull(), // The user who created/owns the shop
    name: text('name').notNull(),
    shortName: varchar('short_name', { length: 50 }), // Optional short trading alias e.g. Manna Books
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    code: varchar('code', { length: 10 }).unique(),
    currency: varchar('currency', { length: 3 }).default('KES').notNull(),
    phone: varchar('phone', { length: 30 }), // Business phone contact e.g. +254 712 345 678
    website: varchar('website', { length: 255 }), // Business website URL e.g. https://mannabooks.co.ke
    email: varchar('email', { length: 255 }), // Business email contact e.g. billing@mannabooks.co.ke
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
    // Stock Automation & Inventory Governance
    autoStockDeductionEnabled: boolean('auto_stock_deduction_enabled').default(true).notNull(),
    // Workspace Business Operations Mode: 'SERVICES' | 'RETAIL' | 'HYBRID'
    businessMode: varchar('business_mode', { length: 30 }).default('HYBRID').notNull(),
    // Loyalty & Membership Engine
    loyaltyEngineMode: loyaltyEngineModeEnum('loyalty_engine_mode').default('OFF').notNull(),
    // Subscription & Plan Governance
    plan: varchar('plan', { length: 30 }).default('FREE').notNull(), // 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
    subscriptionStatus: varchar('subscription_status', { length: 30 }).default('ACTIVE').notNull(), // 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED' | 'LIFETIME_FREE'
    isLifetimePro: boolean('is_lifetime_pro').default(false).notNull(), // Exempt from billing / owner shop flag
    isSuspended: boolean('is_suspended').default(false).notNull(), // Administrative lockout flag
    suspendedReason: text('suspended_reason'),
    trialEndsAt: timestamp('trial_ends_at'),
    subscriptionExpiresAt: timestamp('subscription_expires_at'),
    gracePeriodEndsAt: timestamp('grace_period_ends_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SHOP MEMBERS TABLE (Future-proofs Multi-shop access & Employees)
export const shopMembers = pgTable('shop_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: userRoleEnum('role').default('OWNER').notNull(),
    customPermissions: text('custom_permissions').default('{}').notNull(), // JSON string for granular employee permissions
    assignedLocationIds: jsonb('assigned_location_ids').$type<string[]>().default([]).notNull(), // Scoped warehouse branches
    hideCostPrices: boolean('hide_cost_prices').default(false).notNull(), // Commercial privacy flag
    directApprovalLimit: numeric('direct_approval_limit', { precision: 12, scale: 2 }).default('0.00').notNull(), // Direct adjustment cap (KES)
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_user').on(table.shopId, table.userId), // Prevents duplicating a user in the same shop
]);

// PAYMENT METHODS TABLE
export const paymentMethods = pgTable('payment_methods', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 100 }).notNull(), // e.g., "M-Pesa Till", "Commercial Bank Account"
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

// SHOP CURRENCIES & EXCHANGE RATES TABLE (Predefined Multi-Currency Portfolio)
export const shopCurrencies = pgTable('shop_currencies', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    code: varchar('code', { length: 3 }).notNull(), // e.g., 'USD', 'EUR', 'GBP', 'UGX', 'TZS'
    name: varchar('name', { length: 50 }).notNull(), // e.g., 'US Dollar', 'Euro'
    symbol: varchar('symbol', { length: 10 }).default('$').notNull(),
    exchangeRate: numeric('exchange_rate', { precision: 12, scale: 4 }).default('1.0000').notNull(), // Multiplier to base currency
    isEnabled: boolean('is_enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_currency_code').on(table.shopId, table.code),
]);

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
    exchangeRate: numeric('exchange_rate', { precision: 12, scale: 4 }).default('1.0000').notNull(), // Exchange rate against base currency at doc creation
    baseCurrency: varchar('base_currency', { length: 3 }), // e.g. KES
    baseGrandTotal: numeric('base_grand_total', { precision: 12, scale: 2 }), // Grand total converted to base currency
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

    // Client Portal Interactive Responses (Quotes)
    clientPortalResponse: varchar('client_portal_response', { length: 50 }), // 'ACCEPTED' | 'AMENDMENT_REQUESTED'
    clientAmendmentNotes: text('client_amendment_notes'),

    // Email Delivery & Read Receipts Tracking
    emailDeliveryStatus: varchar('email_delivery_status', { length: 50 }).default('NOT_SENT').notNull(), // 'NOT_SENT' | 'SENT' | 'DELIVERED' | 'OPENED' | 'BOUNCED'
    resendEmailId: varchar('resend_email_id', { length: 100 }),
    lastEmailSentAt: timestamp('last_email_sent_at'),
    lastEmailOpenedAt: timestamp('last_email_opened_at'),

    // Inventory Location Fulfillment
    locationId: uuid('location_id').references((): any => stockLocations.id, { onDelete: 'set null' }),

    // Loyalty Rewards & Point Redemptions
    loyaltyPointsEarned: integer('loyalty_points_earned').default(0).notNull(),
    loyaltyPointsRedeemed: integer('loyalty_points_redeemed').default(0).notNull(),
    loyaltyDiscountAmount: numeric('loyalty_discount_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),

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

// DOCUMENT PAYMENTS TABLE (Installments & Partial Settlement Ledger)
export const documentPayments = pgTable('document_payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentDate: timestamp('payment_date').defaultNow().notNull(),
    paymentChannel: varchar('payment_channel', { length: 50 }).default('BANK').notNull(), // MPESA, BANK, CASH, CHEQUE, OTHER
    paymentReference: varchar('payment_reference', { length: 100 }),
    notes: text('notes'),
    recordedByUserId: uuid('recorded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// DOCUMENT INTERNAL NOTES TABLE (Private Operator Notes & Audit Trail)
export const documentNotes = pgTable('document_notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// EMPLOYEES TABLE
export const employees = pgTable('employees', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    department: varchar('department', { length: 100 }),
    designation: varchar('designation', { length: 100 }),
    employmentType: employmentTypeEnum('employment_type').default('FULL_TIME').notNull(),
    nationalId: varchar('national_id', { length: 50 }),
    kraPin: varchar('kra_pin', { length: 13 }),
    bankName: varchar('bank_name', { length: 100 }),
    bankAccountNumber: varchar('bank_account_number', { length: 50 }),
    bankBranch: varchar('bank_branch', { length: 100 }),
    mpesaPhone: varchar('mpesa_phone', { length: 30 }),
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

// EXPENSE CLAIMS TABLE (Staff Reimbursements & Petty Cash Claims)
export const expenseClaims = pgTable('expense_claims', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
    claimNumber: varchar('claim_number', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    claimDate: date('claim_date').notNull(),
    category: expenseCategoryEnum('category').default('OFFICE_SUPPLIES').notNull(),
    costCenterId: uuid('cost_center_id').references(() => costCenters.id, { onDelete: 'set null' }),
    receiptUrl: text('receipt_url'),
    status: expenseClaimStatusEnum('status').default('DRAFT').notNull(),
    approvedById: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at'),
    approvalNotes: text('approval_notes'),
    disbursedExpenseId: uuid('disbursed_expense_id').references(() => expenses.id, { onDelete: 'set null' }),
    disbursedAt: timestamp('disbursed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('idx_expense_claims_shop').on(table.shopId),
    index('idx_expense_claims_employee').on(table.employeeId),
    index('idx_expense_claims_status').on(table.status),
]);

// SHOP INVITATIONS TABLE (Pending Invites)
export const shopInvitations = pgTable('shop_invitations', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    email: text('email').notNull(),
    role: userRoleEnum('role').default('EMPLOYEE').notNull(),
    customPermissions: text('custom_permissions').default('{}').notNull(),
    assignedLocationIds: jsonb('assigned_location_ids').$type<string[]>().default([]).notNull(),
    hideCostPrices: boolean('hide_cost_prices').default(false).notNull(),
    directApprovalLimit: numeric('direct_approval_limit', { precision: 12, scale: 2 }).default('0.00').notNull(),
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
    referenceNumber: varchar('reference_number', { length: 100 }), // Batch / Journal Ref e.g. JRN-2026-001
    costCenterId: uuid('cost_center_id'), // Optional Department / Project Cost Center FK
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
    unique('unique_shop_account_budget').on(table.shopId, table.accountId, table.month, table.year),
]);

// COST CENTERS (Departmental & Project Cost Allocation)
export const costCenters = pgTable('cost_centers', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    code: varchar('code', { length: 20 }).notNull(), // e.g. "CC-HQ", "PROJ-NAIROBI"
    name: text('name').notNull(),
    department: varchar('department', { length: 100 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_cost_center_code').on(table.shopId, table.code),
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
// ACCOUNTS PAYABLE (VENDOR BILLS & ITEMS)
// ==========================================
export const vendorBills = pgTable('vendor_bills', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
    billNumber: varchar('bill_number', { length: 50 }).notNull(),
    reference: varchar('reference', { length: 100 }), // Vendor's external invoice/ref number
    billDate: timestamp('bill_date').defaultNow().notNull(),
    dueDate: timestamp('due_date'),
    subTotal: numeric('sub_total', { precision: 12, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    whtRate: numeric('wht_rate', { precision: 5, scale: 2 }).default('0.00').notNull(), // 0%, 5%, 10%
    whtAmount: numeric('wht_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    netPayable: numeric('net_payable', { precision: 12, scale: 2 }).notNull(),
    amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0.00').notNull(),
    status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // 'DRAFT' | 'AWAITING_APPROVAL' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'
    paymentChannel: varchar('payment_channel', { length: 50 }), // 'BANK' | 'MPESA' | 'CASH' | 'CHEQUE'
    paymentReference: varchar('payment_reference', { length: 100 }),
    paidAt: timestamp('paid_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('idx_vendor_bills_shop').on(table.shopId),
    index('idx_vendor_bills_supplier').on(table.supplierId),
    index('idx_vendor_bills_status').on(table.status),
]);

export const vendorBillItems = pgTable('vendor_bill_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    billId: uuid('bill_id').references(() => vendorBills.id, { onDelete: 'cascade' }).notNull(),
    accountId: uuid('account_id').references(() => chartOfAccounts.id).notNull(), // Expense/Asset GL account
    description: text('description').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 2 }).default('1.00').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0.00').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
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
    // Promotional / launch discount prices — null means no active promo
    discountedPriceMonthly: integer('discounted_price_monthly'),
    discountedPriceAnnually: integer('discounted_price_annually'),
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
// LOYALTY & MEMBERSHIP ENGINE TABLES
// ==========================================
export const loyaltyPrograms = pgTable('loyalty_programs', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull().unique(),
    isEnabled: boolean('is_enabled').default(false).notNull(),
    engineMode: loyaltyEngineModeEnum('engine_mode').default('HYBRID').notNull(),
    programName: varchar('program_name', { length: 100 }).default('Rewards Club').notNull(),
    earnRateKes: numeric('earn_rate_kes', { precision: 10, scale: 2 }).default('100.00').notNull(), // KES spent to earn 1 point
    pointValueKes: numeric('point_value_kes', { precision: 10, scale: 2 }).default('1.00').notNull(), // Discount value of 1 point (KES)
    minRedeemPoints: integer('min_redeem_points').default(50).notNull(),
    pointsExpiryDays: integer('points_expiry_days'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const membershipTiers = pgTable('membership_tiers', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 50 }).notNull(), // e.g. "Bronze", "Silver", "Gold", "VIP", "Wholesale Tier 1"
    minSpendKes: numeric('min_spend_kes', { precision: 12, scale: 2 }).default('0.00').notNull(),
    discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0.00').notNull(), // Auto discount on billing
    pointsMultiplier: numeric('points_multiplier', { precision: 4, scale: 2 }).default('1.00').notNull(), // e.g. 1.5x points
    badgeColor: varchar('badge_color', { length: 20 }).default('#71717a').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const clientLoyaltyAccounts = pgTable('client_loyalty_accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull().unique(),
    memberNumber: varchar('member_number', { length: 50 }).notNull().unique(),
    tierId: uuid('tier_id').references(() => membershipTiers.id, { onDelete: 'set null' }),
    currentPoints: integer('current_points').default(0).notNull(),
    lifetimePoints: integer('lifetime_points').default(0).notNull(),
    walletBalanceKes: numeric('wallet_balance_kes', { precision: 12, scale: 2 }).default('0.00').notNull(),
    membershipStatus: varchar('membership_status', { length: 20 }).default('ACTIVE').notNull(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const loyaltyLedger = pgTable('loyalty_ledger', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    accountId: uuid('account_id').references(() => clientLoyaltyAccounts.id, { onDelete: 'cascade' }).notNull(),
    movementType: loyaltyMovementTypeEnum('movement_type').notNull(),
    pointsDelta: integer('points_delta').default(0).notNull(),
    walletDeltaKes: numeric('wallet_delta_kes', { precision: 12, scale: 2 }).default('0.00').notNull(),
    runningPointsBalance: integer('running_points_balance').notNull(),
    runningWalletBalanceKes: numeric('running_wallet_balance_kes', { precision: 12, scale: 2 }).notNull(),
    sourceDocumentId: uuid('source_document_id').references(() => documents.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// CRM: DEALS PIPELINE & INTERACTIVE PROPOSALS
// ==========================================

export const dealStageEnum = pgEnum('deal_stage', [
    'LEAD',
    'QUALIFIED',
    'PROPOSAL_SENT',
    'NEGOTIATION',
    'WON',
    'LOST',
]);

export const dealActivityTypeEnum = pgEnum('deal_activity_type', [
    'NOTE',
    'CALL',
    'EMAIL',
    'MEETING',
    'STAGE_CHANGE',
    'PROPOSAL_SENT',
    'PROPOSAL_ACCEPTED',
    'WON',
    'LOST',
]);

export const proposalStatusEnum = pgEnum('proposal_status', [
    'DRAFT',
    'SENT',
    'VIEWED',
    'ACCEPTED',
    'AMENDMENT_REQUESTED',
    'EXPIRED',
    'DECLINED',
]);

// DEALS TABLE — CRM Pipeline Cards
export const deals = pgTable('deals', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    contactName: varchar('contact_name', { length: 255 }).notNull(),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    stage: dealStageEnum('stage').default('LEAD').notNull(),
    currency: varchar('currency', { length: 10 }).default('KES').notNull(),
    estimatedValue: numeric('estimated_value', { precision: 14, scale: 2 }).default('0').notNull(),
    winProbability: integer('win_probability').default(50).notNull(), // 0–100%
    expectedCloseDate: timestamp('expected_close_date'),
    lossReason: text('loss_reason'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('idx_deals_shop').on(table.shopId),
    index('idx_deals_stage').on(table.stage),
    index('idx_deals_client').on(table.clientId),
]);

// DEAL ACTIVITIES TABLE — Timeline / Audit Log per Deal
export const dealActivities = pgTable('deal_activities', {
    id: uuid('id').defaultRandom().primaryKey(),
    dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    activityType: dealActivityTypeEnum('activity_type').default('NOTE').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// PROPOSALS TABLE — Rich Interactive Proposal Documents
export const proposals = pgTable('proposals', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'set null' }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    proposalNumber: varchar('proposal_number', { length: 50 }).notNull(), // e.g. PRP-2026-001
    title: varchar('title', { length: 255 }).notNull(),
    executiveSummary: text('executive_summary'),
    scopeOfWork: text('scope_of_work'),         // Rich text / markdown
    termsAndConditions: text('terms_and_conditions'),
    validityDays: integer('validity_days').default(30).notNull(),
    currency: varchar('currency', { length: 10 }).default('KES').notNull(),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).default('0').notNull(),
    status: proposalStatusEnum('status').default('DRAFT').notNull(),
    // Client portal interaction
    viewedAt: timestamp('viewed_at'),
    viewCount: integer('view_count').default(0).notNull(),
    respondedAt: timestamp('responded_at'),
    signerName: varchar('signer_name', { length: 255 }),
    signatureDataUrl: text('signature_data_url'), // Touch/mouse e-signature PNG data URL
    amendmentNotes: text('amendment_notes'),
    // Conversion lineage
    convertedDocumentId: uuid('converted_document_id').references(() => documents.id, { onDelete: 'set null' }),
    sentAt: timestamp('sent_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_proposal_number').on(table.shopId, table.proposalNumber),
    index('idx_proposals_shop').on(table.shopId),
    index('idx_proposals_deal').on(table.dealId),
    index('idx_proposals_status').on(table.status),
]);

// PROPOSAL ITEMS TABLE — Tiered Packages / Line Items
export const proposalItems = pgTable('proposal_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'cascade' }).notNull(),
    packageLabel: varchar('package_label', { length: 100 }), // e.g. "Silver", "Gold", "Enterprise" — null = single tier
    description: text('description').notNull(),
    notes: text('notes'),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).default('1').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    itemTotal: numeric('item_total', { precision: 12, scale: 2 }).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
});

// PROPOSAL TOKENS TABLE — Secure 64-char public access links
export const proposalTokens = pgTable('proposal_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'cascade' }).notNull().unique(),
    token: varchar('token', { length: 64 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('idx_proposal_token').on(table.token),
]);

// ==========================================
// CONTRACTS, SLAs & RETAINER BURN-DOWN
// ==========================================

export const contractStatusEnum = pgEnum('contract_status', [
    'ACTIVE',
    'PAUSED',
    'EXPIRED',
    'CANCELLED',
]);

// CONTRACTS TABLE — Retainer & SLA Agreements
export const contracts = pgTable('contracts', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'set null' }),
    contractNumber: varchar('contract_number', { length: 50 }).notNull(), // e.g. CNT-2026-001
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    currency: varchar('currency', { length: 10 }).default('KES').notNull(),
    status: contractStatusEnum('status').default('ACTIVE').notNull(),
    // Billing
    monthlyFee: numeric('monthly_fee', { precision: 14, scale: 2 }).default('0').notNull(),
    isRetainerHours: boolean('is_retainer_hours').default(false).notNull(), // true = hours-based retainer
    monthlyHoursAllocated: numeric('monthly_hours_allocated', { precision: 8, scale: 2 }).default('0').notNull(),
    hourlyRate: numeric('hourly_rate', { precision: 12, scale: 2 }).default('0').notNull(),
    // Recurring auto-invoicing
    autoInvoiceEnabled: boolean('auto_invoice_enabled').default(false).notNull(),
    nextBillingDate: date('next_billing_date'),
    billingDayOfMonth: integer('billing_day_of_month').default(1).notNull(), // 1st of each month
    // Contract term
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    // Expiry alerts
    alert30DaySentAt: timestamp('alert_30_day_sent_at'),
    alert60DaySentAt: timestamp('alert_60_day_sent_at'),
    termsAndConditions: text('terms_and_conditions'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_contract_number').on(table.shopId, table.contractNumber),
    index('idx_contracts_shop').on(table.shopId),
    index('idx_contracts_status').on(table.status),
    index('idx_contracts_next_billing').on(table.nextBillingDate),
]);

// CONTRACT HOURS LOG TABLE — Retainer Burn-Down Ledger
export const contractHoursLog = pgTable('contract_hours_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    contractId: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }).notNull(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    loggedByUserId: uuid('logged_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    billingMonth: varchar('billing_month', { length: 7 }).notNull(), // e.g. "2026-09"
    hoursUsed: numeric('hours_used', { precision: 8, scale: 2 }).notNull(),
    description: text('description'),
    logDate: date('log_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// PROJECT WORKSPACES, TIMESHEETS & MILESTONE INVOICING
// ==========================================

export const projectStatusEnum = pgEnum('project_status', [
    'PLANNING',
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
]);

export const timesheetStatusEnum = pgEnum('timesheet_status', [
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
]);

export const milestoneStatusEnum = pgEnum('milestone_status', [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'INVOICED',
]);

// PROJECTS TABLE — Project Workspaces
export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'set null' }),
    contractId: uuid('contract_id').references(() => contracts.id, { onDelete: 'set null' }),
    projectCode: varchar('project_code', { length: 50 }).notNull(), // e.g. PROJ-2026-001
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: projectStatusEnum('status').default('PLANNING').notNull(),
    currency: varchar('currency', { length: 10 }).default('KES').notNull(),
    // Budget
    budgetType: varchar('budget_type', { length: 20 }).default('FIXED').notNull(), // 'FIXED' | 'TIME_AND_MATERIALS'
    budgetAmount: numeric('budget_amount', { precision: 14, scale: 2 }).default('0').notNull(),
    budgetHours: numeric('budget_hours', { precision: 10, scale: 2 }).default('0').notNull(),
    // Timeline
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_project_code').on(table.shopId, table.projectCode),
    index('idx_projects_shop').on(table.shopId),
    index('idx_projects_client').on(table.clientId),
    index('idx_projects_status').on(table.status),
]);

// PROJECT MEMBERS TABLE — Team with individual billable rates
export const projectMembers = pgTable('project_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: varchar('role', { length: 100 }).default('Team Member').notNull(), // e.g. "Senior Partner", "Associate"
    billableRatePerHour: numeric('billable_rate_per_hour', { precision: 12, scale: 2 }).default('0').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_project_member').on(table.projectId, table.userId),
]);

// TIMESHEETS TABLE — Individual Time Log Entries
export const timesheets = pgTable('timesheets', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    workDate: date('work_date').notNull(),
    hoursLogged: numeric('hours_logged', { precision: 8, scale: 2 }).notNull(),
    taskDescription: text('task_description').notNull(),
    isBillable: boolean('is_billable').default(true).notNull(),
    billableRate: numeric('billable_rate', { precision: 12, scale: 2 }).default('0').notNull(), // Snapshotted from projectMembers at submission time
    billableAmount: numeric('billable_amount', { precision: 12, scale: 2 }).default('0').notNull(),
    status: timesheetStatusEnum('status').default('DRAFT').notNull(),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    reviewNotes: text('review_notes'),
    invoicedDocumentId: uuid('invoiced_document_id').references(() => documents.id, { onDelete: 'set null' }), // Set when billed
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('idx_timesheets_project').on(table.projectId),
    index('idx_timesheets_user').on(table.userId),
    index('idx_timesheets_status').on(table.status),
]);

// PROJECT MILESTONES TABLE — Phased Billing Gates
export const projectMilestones = pgTable('project_milestones', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    title: varchar('title', { length: 255 }).notNull(), // e.g. "Milestone 1 — Mobilization Deposit (30%)"
    description: text('description'),
    percentageOfTotal: numeric('percentage_of_total', { precision: 5, scale: 2 }).default('0').notNull(), // e.g. 30.00
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('KES').notNull(),
    dueDate: date('due_date'),
    status: milestoneStatusEnum('status').default('PENDING').notNull(),
    completedAt: timestamp('completed_at'),
    invoicedDocumentId: uuid('invoiced_document_id').references(() => documents.id, { onDelete: 'set null' }),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// APPROVALS & REQUESTS TABLES
// ==========================================
export const approvalPolicies = pgTable('approval_policies', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    requestType: approvalRequestTypeEnum('request_type').notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    minAmount: numeric('min_amount', { precision: 14, scale: 2 }).default('0').notNull(),
    maxAmount: numeric('max_amount', { precision: 14, scale: 2 }),
    requiredRole: userRoleEnum('required_role').default('MANAGER').notNull(),
    autoApproveBelow: numeric('auto_approve_below', { precision: 14, scale: 2 }).default('0').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const approvalRequests = pgTable('approval_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    policyId: uuid('policy_id').references(() => approvalPolicies.id, { onDelete: 'set null' }),
    requestType: approvalRequestTypeEnum('request_type').notNull(),
    requestNumber: varchar('request_number', { length: 50 }).notNull(),
    requesterUserId: uuid('requester_user_id').references(() => users.id).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    amount: numeric('amount', { precision: 14, scale: 2 }).default('0').notNull(),
    currency: varchar('currency', { length: 10 }).default('KES').notNull(),
    priority: approvalPriorityEnum('priority').default('NORMAL').notNull(),
    status: approvalStatusEnum('status').default('PENDING').notNull(),
    targetEntityType: varchar('target_entity_type', { length: 50 }).notNull(),
    targetEntityId: uuid('target_entity_id').notNull(),
    payloadSnapshot: jsonb('payload_snapshot'),
    decisionByUserId: uuid('decision_by_user_id').references(() => users.id),
    decisionAt: timestamp('decision_at'),
    decisionReason: text('decision_reason'),
    approvalToken: varchar('approval_token', { length: 64 }).unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_request_number').on(table.shopId, table.requestNumber),
    index('idx_approvals_shop_status').on(table.shopId, table.status),
    index('idx_approvals_requester').on(table.requesterUserId),
]);

export const approvalTimeline = pgTable('approval_timeline', {
    id: uuid('id').defaultRandom().primaryKey(),
    requestId: uuid('request_id').references(() => approvalRequests.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 50 }).notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// ADVANCED WMS STORAGE BINS & BATCHES
// ==========================================
export const storageBins = pgTable('storage_bins', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    locationId: uuid('location_id').references(() => stockLocations.id, { onDelete: 'cascade' }).notNull(),
    zone: varchar('zone', { length: 50 }).notNull(),
    rack: varchar('rack', { length: 50 }),
    shelf: varchar('shelf', { length: 50 }),
    binCode: varchar('bin_code', { length: 50 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_location_bin').on(table.shopId, table.locationId, table.binCode),
    index('idx_storage_bins_location').on(table.locationId),
]);

export const productBatches = pgTable('product_batches', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    locationId: uuid('location_id').references(() => stockLocations.id).notNull(),
    binId: uuid('bin_id').references(() => storageBins.id, { onDelete: 'set null' }),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    manufactureDate: date('manufacture_date'),
    expiryDate: date('expiry_date').notNull(),
    initialQuantity: numeric('initial_quantity', { precision: 12, scale: 2 }).notNull(),
    currentQuantity: numeric('current_quantity', { precision: 12, scale: 2 }).notNull(),
    costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('idx_batches_product').on(table.productId),
    index('idx_batches_expiry').on(table.expiryDate),
    index('idx_batches_location').on(table.locationId),
]);

// ==========================================
// BILL OF MATERIALS (BOM) & PRODUCTION
// ==========================================
export const billOfMaterials = pgTable('bill_of_materials', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    finishedProductId: uuid('finished_product_id').references(() => products.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    laborCostEstimate: numeric('labor_cost_estimate', { precision: 14, scale: 2 }).default('0'),
    overheadCostEstimate: numeric('overhead_cost_estimate', { precision: 14, scale: 2 }).default('0'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('idx_bom_finished_product').on(table.finishedProductId),
]);

export const bomItems = pgTable('bom_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    bomId: uuid('bom_id').references(() => billOfMaterials.id, { onDelete: 'cascade' }).notNull(),
    rawMaterialProductId: uuid('raw_material_product_id').references(() => products.id).notNull(),
    quantityRequired: numeric('quantity_required', { precision: 12, scale: 4 }).notNull(),
    wastagePercentage: numeric('wastage_percentage', { precision: 5, scale: 2 }).default('0'),
}, (table) => [
    index('idx_bom_items_bom').on(table.bomId),
]);

export const productionOrders = pgTable('production_orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    bomId: uuid('bom_id').references(() => billOfMaterials.id).notNull(),
    orderNumber: varchar('order_number', { length: 50 }).notNull(),
    targetLocationId: uuid('target_location_id').references(() => stockLocations.id).notNull(),
    unitsToProduce: numeric('units_to_produce', { precision: 12, scale: 2 }).notNull(),
    totalCostKes: numeric('total_cost_kes', { precision: 14, scale: 2 }).default('0').notNull(),
    status: productionOrderStatusEnum('status').default('DRAFT').notNull(),
    completedAt: timestamp('completed_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_production_order_number').on(table.shopId, table.orderNumber),
    index('idx_production_orders_shop').on(table.shopId),
]);

// ==========================================
// STOCKTAKE RECONCILIATION
// ==========================================
export const stocktakes = pgTable('stocktakes', {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
    locationId: uuid('location_id').references(() => stockLocations.id).notNull(),
    stocktakeNumber: varchar('stocktake_number', { length: 50 }).notNull(),
    status: stocktakeStatusEnum('status').default('DRAFT').notNull(),
    conductedByUserId: uuid('conducted_by_user_id').references(() => users.id).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_shop_stocktake_number').on(table.shopId, table.stocktakeNumber),
    index('idx_stocktakes_shop').on(table.shopId),
]);

export const stocktakeItems = pgTable('stocktake_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    stocktakeId: uuid('stocktake_id').references(() => stocktakes.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    binId: uuid('bin_id').references(() => storageBins.id, { onDelete: 'set null' }),
    batchId: uuid('batch_id').references(() => productBatches.id, { onDelete: 'set null' }),
    bookQuantity: numeric('book_quantity', { precision: 12, scale: 2 }).notNull(),
    countedQuantity: numeric('counted_quantity', { precision: 12, scale: 2 }).notNull(),
    varianceQuantity: numeric('variance_quantity', { precision: 12, scale: 2 }).notNull(),
    varianceCostKes: numeric('variance_cost_kes', { precision: 14, scale: 2 }).notNull(),
    notes: text('notes'),
}, (table) => [
    index('idx_stocktake_items_stocktake').on(table.stocktakeId),
]);

// ==========================================
// 3. RELATIONS (For ORM Querying)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
    ownedShops: many(shops),
    memberships: many(shopMembers),
    sessions: many(sessions),
    employeeProfiles: many(employees),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
    owner: one(users, { fields: [shops.ownerId], references: [users.id] }),
    members: many(shopMembers),
    paymentMethods: many(paymentMethods),
    terms: many(shopTerms),
    currencies: many(shopCurrencies),
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
    loyaltyPrograms: many(loyaltyPrograms),
    membershipTiers: many(membershipTiers),
    clientLoyaltyAccounts: many(clientLoyaltyAccounts),
    loyaltyLedger: many(loyaltyLedger),
    vendorBills: many(vendorBills),
    costCenters: many(costCenters),
    deals: many(deals),
    proposals: many(proposals),
    contracts: many(contracts),
    projects: many(projects),
    approvalPolicies: many(approvalPolicies),
    approvalRequests: many(approvalRequests),
    storageBins: many(storageBins),
    productBatches: many(productBatches),
    billOfMaterials: many(billOfMaterials),
    productionOrders: many(productionOrders),
    stocktakes: many(stocktakes),
}));

export const shopCurrenciesRelations = relations(shopCurrencies, ({ one }) => ({
    shop: one(shops, { fields: [shopCurrencies.shopId], references: [shops.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
    shop: one(shops, { fields: [clients.shopId], references: [shops.id] }),
    documents: many(documents),
    loyaltyAccounts: many(clientLoyaltyAccounts),
    deals: many(deals),
    proposals: many(proposals),
    contracts: many(contracts),
    projects: many(projects),
    employees: many(employees),
    expenseClaims: many(expenseClaims),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
    shop: one(shops, { fields: [suppliers.shopId], references: [shops.id] }),
    documents: many(documents),
    vendorBills: many(vendorBills),
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
    location: one(stockLocations, { fields: [documents.locationId], references: [stockLocations.id] }),
    items: many(documentItems),
    payments: many(documentPayments),
    notesList: many(documentNotes),
    token: one(documentTokens, { fields: [documents.id], references: [documentTokens.documentId] }),
    loyaltyLedgerEntries: many(loyaltyLedger),
}));

export const documentPaymentsRelations = relations(documentPayments, ({ one }) => ({
    document: one(documents, { fields: [documentPayments.documentId], references: [documents.id] }),
    shop: one(shops, { fields: [documentPayments.shopId], references: [shops.id] }),
    recordedBy: one(users, { fields: [documentPayments.recordedByUserId], references: [users.id] }),
}));

export const documentNotesRelations = relations(documentNotes, ({ one }) => ({
    document: one(documents, { fields: [documentNotes.documentId], references: [documents.id] }),
    shop: one(shops, { fields: [documentNotes.shopId], references: [shops.id] }),
    user: one(users, { fields: [documentNotes.userId], references: [users.id] }),
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

export const employeesRelations = relations(employees, ({ one, many }) => ({
    shop: one(shops, { fields: [employees.shopId], references: [shops.id] }),
    user: one(users, { fields: [employees.userId], references: [users.id] }),
    expenseClaims: many(expenseClaims),
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
    vendorBillItems: many(vendorBillItems),
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
    costCenter: one(costCenters, { fields: [journalEntries.costCenterId], references: [costCenters.id] }),
    createdBy: one(users, { fields: [journalEntries.createdById], references: [users.id] }),
}));

export const costCentersRelations = relations(costCenters, ({ one, many }) => ({
    shop: one(shops, { fields: [costCenters.shopId], references: [shops.id] }),
    journalEntries: many(journalEntries),
    expenseClaims: many(expenseClaims),
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

export const vendorBillsRelations = relations(vendorBills, ({ one, many }) => ({
    shop: one(shops, { fields: [vendorBills.shopId], references: [shops.id] }),
    supplier: one(suppliers, { fields: [vendorBills.supplierId], references: [suppliers.id] }),
    items: many(vendorBillItems),
}));

export const vendorBillItemsRelations = relations(vendorBillItems, ({ one }) => ({
    bill: one(vendorBills, { fields: [vendorBillItems.billId], references: [vendorBills.id] }),
    account: one(chartOfAccounts, { fields: [vendorBillItems.accountId], references: [chartOfAccounts.id] }),
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
    storageBins: many(storageBins),
    productBatches: many(productBatches),
    productionOrders: many(productionOrders),
    stocktakes: many(stocktakes),
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
    batches: many(productBatches),
    bomAssemblies: many(billOfMaterials),
    bomRawMaterials: many(bomItems),
    stocktakeItems: many(stocktakeItems),
}));

// PRODUCT LOCATION STOCK RELATIONS
export const productLocationStockRelations = relations(productLocationStock, ({ one }) => ({
    shop: one(shops, { fields: [productLocationStock.shopId], references: [shops.id] }),
    product: one(products, { fields: [productLocationStock.productId], references: [products.id] }),
    location: one(stockLocations, { fields: [productLocationStock.locationId], references: [stockLocations.id] }),
}));

// ==========================================
// NOTIFICATIONS TABLE (In-App Activity Bell & System Alerts)
// ==========================================
export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }), // Nullable for global platform announcements
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 50 }).default('SYSTEM').notNull(), // 'INVOICE_OVERDUE' | 'SUBSCRIPTION_ALERT' | 'QUOTE_EXPIRED' | 'QUOTE_ACCEPTED' | 'PAYMENT_RECEIVED' | 'STOCK_LOW' | 'SYSTEM'
    link: text('link'), // Optional in-app route e.g. /workspaces/manna/documents/123
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('idx_notifications_user_unread').on(table.userId, table.isRead),
    index('idx_notifications_shop').on(table.shopId),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, { fields: [notifications.userId], references: [users.id] }),
    shop: one(shops, { fields: [notifications.shopId], references: [shops.id] }),
}));

export const loyaltyProgramsRelations = relations(loyaltyPrograms, ({ one }) => ({
    shop: one(shops, { fields: [loyaltyPrograms.shopId], references: [shops.id] }),
}));

export const membershipTiersRelations = relations(membershipTiers, ({ one, many }) => ({
    shop: one(shops, { fields: [membershipTiers.shopId], references: [shops.id] }),
    accounts: many(clientLoyaltyAccounts),
}));

export const clientLoyaltyAccountsRelations = relations(clientLoyaltyAccounts, ({ one, many }) => ({
    shop: one(shops, { fields: [clientLoyaltyAccounts.shopId], references: [shops.id] }),
    client: one(clients, { fields: [clientLoyaltyAccounts.clientId], references: [clients.id] }),
    tier: one(membershipTiers, { fields: [clientLoyaltyAccounts.tierId], references: [membershipTiers.id] }),
    ledgerEntries: many(loyaltyLedger),
}));

export const loyaltyLedgerRelations = relations(loyaltyLedger, ({ one }) => ({
    shop: one(shops, { fields: [loyaltyLedger.shopId], references: [shops.id] }),
    account: one(clientLoyaltyAccounts, { fields: [loyaltyLedger.accountId], references: [clientLoyaltyAccounts.id] }),
    document: one(documents, { fields: [loyaltyLedger.sourceDocumentId], references: [documents.id] }),
}));

// ==========================================
// CRM / CONTRACTS / PROJECTS — RELATIONS
// ==========================================

export const dealsRelations = relations(deals, ({ one, many }) => ({
    shop: one(shops, { fields: [deals.shopId], references: [shops.id] }),
    client: one(clients, { fields: [deals.clientId], references: [clients.id] }),
    assignedUser: one(users, { fields: [deals.assignedUserId], references: [users.id] }),
    activities: many(dealActivities),
    proposals: many(proposals),
    contracts: many(contracts),
    projects: many(projects),
}));

export const dealActivitiesRelations = relations(dealActivities, ({ one }) => ({
    deal: one(deals, { fields: [dealActivities.dealId], references: [deals.id] }),
    shop: one(shops, { fields: [dealActivities.shopId], references: [shops.id] }),
    user: one(users, { fields: [dealActivities.userId], references: [users.id] }),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
    shop: one(shops, { fields: [proposals.shopId], references: [shops.id] }),
    deal: one(deals, { fields: [proposals.dealId], references: [deals.id] }),
    client: one(clients, { fields: [proposals.clientId], references: [clients.id] }),
    convertedDocument: one(documents, { fields: [proposals.convertedDocumentId], references: [documents.id] }),
    items: many(proposalItems),
    token: one(proposalTokens, { fields: [proposals.id], references: [proposalTokens.proposalId] }),
}));

export const proposalItemsRelations = relations(proposalItems, ({ one }) => ({
    proposal: one(proposals, { fields: [proposalItems.proposalId], references: [proposals.id] }),
}));

export const proposalTokensRelations = relations(proposalTokens, ({ one }) => ({
    proposal: one(proposals, { fields: [proposalTokens.proposalId], references: [proposals.id] }),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
    shop: one(shops, { fields: [contracts.shopId], references: [shops.id] }),
    client: one(clients, { fields: [contracts.clientId], references: [clients.id] }),
    deal: one(deals, { fields: [contracts.dealId], references: [deals.id] }),
    hoursLog: many(contractHoursLog),
    projects: many(projects),
}));

export const contractHoursLogRelations = relations(contractHoursLog, ({ one }) => ({
    contract: one(contracts, { fields: [contractHoursLog.contractId], references: [contracts.id] }),
    shop: one(shops, { fields: [contractHoursLog.shopId], references: [shops.id] }),
    loggedBy: one(users, { fields: [contractHoursLog.loggedByUserId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    shop: one(shops, { fields: [projects.shopId], references: [shops.id] }),
    client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
    deal: one(deals, { fields: [projects.dealId], references: [deals.id] }),
    contract: one(contracts, { fields: [projects.contractId], references: [contracts.id] }),
    members: many(projectMembers),
    timesheets: many(timesheets),
    milestones: many(projectMilestones),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
    project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
    shop: one(shops, { fields: [projectMembers.shopId], references: [shops.id] }),
    user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
    project: one(projects, { fields: [timesheets.projectId], references: [projects.id] }),
    shop: one(shops, { fields: [timesheets.shopId], references: [shops.id] }),
    user: one(users, { fields: [timesheets.userId], references: [users.id] }),
    reviewedBy: one(users, { fields: [timesheets.reviewedByUserId], references: [users.id], relationName: 'timesheet_reviewer' }),
    invoicedDocument: one(documents, { fields: [timesheets.invoicedDocumentId], references: [documents.id] }),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({ one }) => ({
    project: one(projects, { fields: [projectMilestones.projectId], references: [projects.id] }),
    shop: one(shops, { fields: [projectMilestones.shopId], references: [shops.id] }),
    invoicedDocument: one(documents, { fields: [projectMilestones.invoicedDocumentId], references: [documents.id] }),
}));

export const expenseClaimsRelations = relations(expenseClaims, ({ one }) => ({
    shop: one(shops, { fields: [expenseClaims.shopId], references: [shops.id] }),
    employee: one(employees, { fields: [expenseClaims.employeeId], references: [employees.id] }),
    costCenter: one(costCenters, { fields: [expenseClaims.costCenterId], references: [costCenters.id] }),
    approvedBy: one(users, { fields: [expenseClaims.approvedById], references: [users.id] }),
    disbursedExpense: one(expenses, { fields: [expenseClaims.disbursedExpenseId], references: [expenses.id] }),
}));

export const approvalPoliciesRelations = relations(approvalPolicies, ({ one, many }) => ({
    shop: one(shops, { fields: [approvalPolicies.shopId], references: [shops.id] }),
    requests: many(approvalRequests),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
    shop: one(shops, { fields: [approvalRequests.shopId], references: [shops.id] }),
    policy: one(approvalPolicies, { fields: [approvalRequests.policyId], references: [approvalPolicies.id] }),
    requester: one(users, { fields: [approvalRequests.requesterUserId], references: [users.id], relationName: 'approval_requester' }),
    decisionBy: one(users, { fields: [approvalRequests.decisionByUserId], references: [users.id], relationName: 'approval_decider' }),
    timeline: many(approvalTimeline),
}));

export const approvalTimelineRelations = relations(approvalTimeline, ({ one }) => ({
    request: one(approvalRequests, { fields: [approvalTimeline.requestId], references: [approvalRequests.id] }),
    user: one(users, { fields: [approvalTimeline.userId], references: [users.id] }),
}));

export const storageBinsRelations = relations(storageBins, ({ one, many }) => ({
    shop: one(shops, { fields: [storageBins.shopId], references: [shops.id] }),
    location: one(stockLocations, { fields: [storageBins.locationId], references: [stockLocations.id] }),
    batches: many(productBatches),
}));

export const productBatchesRelations = relations(productBatches, ({ one }) => ({
    shop: one(shops, { fields: [productBatches.shopId], references: [shops.id] }),
    product: one(products, { fields: [productBatches.productId], references: [products.id] }),
    location: one(stockLocations, { fields: [productBatches.locationId], references: [stockLocations.id] }),
    bin: one(storageBins, { fields: [productBatches.binId], references: [storageBins.id] }),
    supplier: one(suppliers, { fields: [productBatches.supplierId], references: [suppliers.id] }),
}));

export const billOfMaterialsRelations = relations(billOfMaterials, ({ one, many }) => ({
    shop: one(shops, { fields: [billOfMaterials.shopId], references: [shops.id] }),
    finishedProduct: one(products, { fields: [billOfMaterials.finishedProductId], references: [products.id] }),
    items: many(bomItems),
    productionOrders: many(productionOrders),
}));

export const bomItemsRelations = relations(bomItems, ({ one }) => ({
    bom: one(billOfMaterials, { fields: [bomItems.bomId], references: [billOfMaterials.id] }),
    rawMaterialProduct: one(products, { fields: [bomItems.rawMaterialProductId], references: [products.id] }),
}));

export const productionOrdersRelations = relations(productionOrders, ({ one }) => ({
    shop: one(shops, { fields: [productionOrders.shopId], references: [shops.id] }),
    bom: one(billOfMaterials, { fields: [productionOrders.bomId], references: [billOfMaterials.id] }),
    targetLocation: one(stockLocations, { fields: [productionOrders.targetLocationId], references: [stockLocations.id] }),
}));

export const stocktakesRelations = relations(stocktakes, ({ one, many }) => ({
    shop: one(shops, { fields: [stocktakes.shopId], references: [shops.id] }),
    location: one(stockLocations, { fields: [stocktakes.locationId], references: [stockLocations.id] }),
    conductedBy: one(users, { fields: [stocktakes.conductedByUserId], references: [users.id] }),
    items: many(stocktakeItems),
}));

export const stocktakeItemsRelations = relations(stocktakeItems, ({ one }) => ({
    stocktake: one(stocktakes, { fields: [stocktakeItems.stocktakeId], references: [stocktakes.id] }),
    product: one(products, { fields: [stocktakeItems.productId], references: [products.id] }),
    bin: one(storageBins, { fields: [stocktakeItems.binId], references: [storageBins.id] }),
    batch: one(productBatches, { fields: [stocktakeItems.batchId], references: [productBatches.id] }),
}));
