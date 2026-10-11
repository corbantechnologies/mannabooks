// src/types/finance.ts
/**
 * Pure TypeScript domain definitions for General Ledger, Reconciliation, and Accounting.
 */

export interface CashGlEntry {
    id: string;
    entryDate: string;
    description: string;
    amount: number;
    direction: "DEBIT" | "CREDIT";
    sourceType: string;
    reference: string | null;
    isReconciled?: boolean;
}

export interface BankReconciliationPayload {
    shopId: string;
    currency: string;
    cashAccountId: string;
    cashAccountCode: string;
    cashAccountName: string;
    bookBalance: number;
    glEntries: CashGlEntry[];
    availablePaymentMethods: { id: string; name: string; details: string }[];
}

export interface CompoundJournalLine {
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    lineDescription?: string;
    costCenterId?: string;
}

export interface CreateVendorBillItemInput {
    accountId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    poItemId?: string;
    poUnitPrice?: number;
    grnQuantity?: number;
}

export interface CreateVendorBillInput {
    supplierId: string;
    reference?: string;
    billDate: string;
    dueDate?: string;
    whtRate: number;
    notes?: string;
    sourcePoId?: string;
    sourceGrnId?: string;
    varianceNotes?: string;
    allowVarianceOverride?: boolean;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentSize?: number;
    items: CreateVendorBillItemInput[];
}

export interface PayVendorBillInput {
    paymentAmount: number;
    paymentChannel: string;
    paymentReference: string;
    paymentDate: string;
}

export interface ConsolidatedPLEntityColumn {
    shopId: string;
    name: string;
    slug: string;
    code: string | null;
    entityType: string;
    ownershipPercentage: number;
    salesRevenue: number;
    nonOperatingIncome: number;
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    netOperatingProfit: number;
    netIncome: number;
}

export interface ConsolidatedPnLResult {
    group: {
        id: string;
        name: string;
        code: string;
        reportingCurrency: string;
    };
    period: string;
    entities: ConsolidatedPLEntityColumn[];
    eliminations: {
        salesRevenue: number;
        expenses: number;
        netElimination: number;
    };
    consolidated: {
        totalRevenue: number;
        cogs: number;
        grossProfit: number;
        grossProfitMargin: number;
        operatingExpenses: number;
        netOperatingProfit: number;
        minorityInterest: number;
        groupNetIncome: number;
    };
}

export interface ConsolidatedBSEntityColumn {
    shopId: string;
    name: string;
    slug: string;
    code: string | null;
    entityType: string;
    ownershipPercentage: number;
    cashAndBank: number;
    accountsReceivable: number;
    inventory: number;
    fixedAssetsWdv: number;
    totalAssets: number;
    accountsPayable: number;
    taxPayable: number;
    totalLiabilities: number;
    equity: number;
    retainedEarnings: number;
    totalEquity: number;
}

export interface ConsolidatedBalanceSheetResult {
    group: {
        id: string;
        name: string;
        code: string;
        reportingCurrency: string;
    };
    asOfDate: string;
    entities: ConsolidatedBSEntityColumn[];
    eliminations: {
        interCompanyReceivables: number;
        interCompanyPayables: number;
    };
    consolidated: {
        cashAndBank: number;
        accountsReceivable: number;
        inventory: number;
        fixedAssetsWdv: number;
        totalAssets: number;
        accountsPayable: number;
        taxPayable: number;
        totalLiabilities: number;
        shareCapital: number;
        retainedEarnings: number;
        nonControllingInterest: number;
        totalEquity: number;
        isBalanced: boolean;
        difference: number;
    };
}

