// src/types/reports.ts
/**
 * Pure TypeScript domain definitions for financial reports and tax statements.
 * Completely free of Node/database runtime dependencies.
 */

export type ReportPeriod = "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "CUSTOM";

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface PLLineItem {
    label: string;
    amount: number;
    accountCode?: string;
}

export interface PLStatement {
    period: string;
    currency: string;
    salesRevenue: number;
    nonOperatingIncome: number;
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    grossProfitMargin: number;
    expenseLines: PLLineItem[];
    totalOperatingExpenses: number;
    netOperatingProfit: number;
    netIncome: number;
}

export interface CashFlowStatement {
    period: string;
    currency: string;
    operating: {
        receiptsFromClients: number;
        paymentsToSuppliers: number;
        payrollPaid: number;
        operatingExpensesPaid: number;
        netOperating: number;
    };
    investing: {
        assetSales: number;
        netInvesting: number;
    };
    netCashFlow: number;
}

export interface BalanceSheetData {
    asOfDate: string;
    currency: string;
    cashAndBank: number;
    accountsReceivable: number;
    inventoryValuation: number;
    totalCurrentAssets: number;
    fixedAssetsWdv: number;
    totalNonCurrentAssets: number;
    totalAssets: number;
    accountsPayable: number;
    taxPayable: number;
    totalCurrentLiabilities: number;
    totalLiabilities: number;
    openingBalanceEquity: number;
    retainedEarnings: number;
    currentPeriodNetProfit: number;
    totalEquity: number;
    isBalanced: boolean;
    difference: number;
}

export interface TrialBalanceRow {
    code: string;
    name: string;
    accountType: string;
    totalDebits: number;
    totalCredits: number;
    balance: number;
}

export interface TaxComputationData {
    netIncome: number;
    nonDeductibleExpenses: number;
    capitalAllowances: number;
    taxableIncome: number;
    citRate: number;
    grossTaxLiability: number;
    instalmentsPaid: number;
    netTaxDue: number;
}

export interface TurnoverTaxQuarter {
    quarter: number;
    startDate: string;
    endDate: string;
    grossSales: number;
    taxRate: number;
    taxLiability: number;
}
