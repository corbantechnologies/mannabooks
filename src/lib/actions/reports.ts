"use server";

import { db } from "@/db";
import { documents, expenses, incomes, shops } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getFiscalYearRange } from "@/lib/fiscalYear";

export type ReportPeriod = "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "CUSTOM";

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

function getDateRange(period: ReportPeriod, customRange?: DateRange, fyStartMonth = 1): DateRange {
    const now = new Date();
    if (period === "CUSTOM" && customRange) return customRange;
    if (period === "THIS_MONTH") return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
    if (period === "LAST_MONTH") return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
    if (period === "THIS_QUARTER") {
        // Simple calendar quarter
        const quarter = Math.floor(now.getMonth() / 3);
        return {
            startDate: new Date(now.getFullYear(), quarter * 3, 1),
            endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59),
        };
    }
    // THIS_YEAR = fiscal year
    const { start, end } = getFiscalYearRange(fyStartMonth);
    return { startDate: start, endDate: end };
}

// ================================================================
// P&L STATEMENT
// ================================================================

export interface PLLineItem {
    label: string;
    amount: number;
    accountCode?: string;
}

export interface PLStatement {
    period: string;
    currency: string;
    // Revenue
    salesRevenue: number;
    nonOperatingIncome: number;
    totalRevenue: number;
    // COGS
    cogs: number;
    grossProfit: number;
    grossProfitMargin: number;
    // Operating Expenses (broken down by category)
    expenseLines: PLLineItem[];
    totalOperatingExpenses: number;
    // Bottom Lines
    netOperatingProfit: number;
    netIncome: number;
}

export async function getPLStatement(
    shopId: string,
    period: ReportPeriod = "THIS_MONTH",
    customRange?: DateRange
): Promise<{ success: true; data: PLStatement } | { success: false; error: string }> {
    try {
        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };

        const { startDate, endDate } = getDateRange(period, customRange, shop.fiscalYearStartMonth);

        const periodLabel = period === "CUSTOM"
            ? `${startDate.toLocaleDateString("en-KE")} – ${endDate.toLocaleDateString("en-KE")}`
            : startDate.toLocaleDateString("en-KE", { month: "long", year: "numeric" });

        // Fetch all documents and expenses/incomes in range
        const allDocs = await db.query.documents.findMany({
            where: eq(documents.shopId, shopId),
            with: { items: { with: { product: true } } },
        });

        const filteredDocs = allDocs.filter(d => {
            const issue = new Date(d.issueDate);
            return issue >= startDate && issue <= endDate;
        });

        const allExpenses = await db.query.expenses.findMany({
            where: and(eq(expenses.shopId, shopId), gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)),
        });

        const allIncomes = await db.query.incomes.findMany({
            where: and(eq(incomes.shopId, shopId), gte(incomes.incomeDate, startDate), lte(incomes.incomeDate, endDate)),
        });

        // Calculate Sales Revenue (no double-counting)
        let salesRevenue = 0;
        let cogs = 0;
        filteredDocs.forEach(d => {
            const isReceiptFromInvoice = d.type === "RECEIPT" && d.parentDocumentId;
            const isSalesDoc = d.type === "RECEIPT" || (d.type === "INVOICE" && d.status === "PAID") || (d.type === "CREDIT_NOTE" && d.status === "PAID");
            if (!isReceiptFromInvoice && isSalesDoc) {
                const factor = d.type === "CREDIT_NOTE" ? -1 : 1;
                salesRevenue += parseFloat(d.grandTotal || "0") * factor;
                d.items.forEach(item => {
                    cogs += parseFloat(item.quantity || "1") * parseFloat(item.product?.costPrice || "0") * factor;
                });
            }
        });

        // Non-Operating Income
        const nonOperatingIncome = allIncomes.reduce((sum, i) => sum + parseFloat(i.amount || "0"), 0);

        const totalRevenue = salesRevenue + nonOperatingIncome;
        const grossProfit = salesRevenue - cogs;
        const grossProfitMargin = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;

        // Expenses broken down by category
        const expenseByCategoryMap: Record<string, number> = {};
        allExpenses.forEach(exp => {
            const cat = exp.category;
            expenseByCategoryMap[cat] = (expenseByCategoryMap[cat] || 0) + parseFloat(exp.amount || "0");
        });

        const categoryLabels: Record<string, string> = {
            RENT: "Rent & Lease",
            UTILITIES: "Utilities",
            SALARIES: "Salaries & Wages",
            FUEL: "Fuel & Travel",
            MARKETING: "Marketing & Ads",
            OFFICE_SUPPLIES: "Office Supplies",
            OTHER: "Other Expenses",
        };

        const expenseLines: PLLineItem[] = Object.entries(expenseByCategoryMap)
            .filter(([, amt]) => amt > 0)
            .map(([cat, amount]) => ({ label: categoryLabels[cat] || cat, amount }))
            .sort((a, b) => b.amount - a.amount);

        const totalOperatingExpenses = expenseLines.reduce((s, l) => s + l.amount, 0);
        const netOperatingProfit = grossProfit - totalOperatingExpenses;
        const netIncome = netOperatingProfit + nonOperatingIncome;

        return {
            success: true,
            data: {
                period: periodLabel,
                currency: shop.currency || "KES",
                salesRevenue,
                nonOperatingIncome,
                totalRevenue,
                cogs,
                grossProfit,
                grossProfitMargin,
                expenseLines,
                totalOperatingExpenses,
                netOperatingProfit,
                netIncome,
            },
        };
    } catch (error: any) {
        console.error("P&L error:", error);
        return { success: false, error: "Failed to generate P&L statement." };
    }
}

// ================================================================
// TRIAL BALANCE
// ================================================================

export interface TrialBalanceRow {
    code: string;
    name: string;
    accountType: string;
    totalDebits: number;
    totalCredits: number;
    balance: number;
}

export async function getTrialBalance(
    shopId: string,
    periodId?: string
): Promise<{ success: true; data: TrialBalanceRow[]; totalDebits: number; totalCredits: number; isBalanced: boolean } | { success: false; error: string }> {
    try {
        const accounts = await db.query.chartOfAccounts.findMany({
            where: eq(shops.id, shopId), // shopId guard
            with: {
                debitEntries: true,
                creditEntries: true,
            },
        });

        // This query needs to be done via journalEntries for proper filtering
        const { journalEntries: je } = await import("@/db/schema");
        const entries = await db.query.journalEntries.findMany({
            where: eq(je.shopId, shopId),
            with: { debitAccount: true, creditAccount: true },
        });

        const balanceMap: Record<string, { code: string; name: string; accountType: string; debits: number; credits: number }> = {};

        // Initialize all accounts
        const allAccounts = await db.query.chartOfAccounts.findMany({
            where: eq(require("@/db/schema").chartOfAccounts.shopId, shopId),
        });
        allAccounts.forEach(acc => {
            balanceMap[acc.id] = { code: acc.code, name: acc.name, accountType: acc.accountType, debits: 0, credits: 0 };
        });

        entries.forEach(entry => {
            const amt = parseFloat(entry.amount || "0");
            if (balanceMap[entry.debitAccountId]) balanceMap[entry.debitAccountId].debits += amt;
            if (balanceMap[entry.creditAccountId]) balanceMap[entry.creditAccountId].credits += amt;
        });

        const rows: TrialBalanceRow[] = Object.values(balanceMap)
            .filter(r => r.debits > 0 || r.credits > 0)
            .map(r => ({
                code: r.code,
                name: r.name,
                accountType: r.accountType,
                totalDebits: r.debits,
                totalCredits: r.credits,
                balance: r.debits - r.credits,
            }))
            .sort((a, b) => a.code.localeCompare(b.code));

        const totalDebits = rows.reduce((s, r) => s + r.totalDebits, 0);
        const totalCredits = rows.reduce((s, r) => s + r.totalCredits, 0);
        const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

        return { success: true, data: rows, totalDebits, totalCredits, isBalanced };
    } catch (error: any) {
        console.error("Trial balance error:", error);
        return { success: false, error: "Failed to generate trial balance." };
    }
}

// ================================================================
// CASH FLOW STATEMENT
// ================================================================

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

export async function getCashFlowStatement(
    shopId: string,
    period: ReportPeriod = "THIS_MONTH",
    customRange?: DateRange
): Promise<{ success: true; data: CashFlowStatement } | { success: false; error: string }> {
    try {
        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };

        const { startDate, endDate } = getDateRange(period, customRange, shop.fiscalYearStartMonth);
        const periodLabel = startDate.toLocaleDateString("en-KE", { month: "long", year: "numeric" });

        const allDocs = await db.query.documents.findMany({
            where: and(eq(documents.shopId, shopId), gte(documents.issueDate, startDate), lte(documents.issueDate, endDate)),
        });

        const allExpenses = await db.query.expenses.findMany({
            where: and(eq(expenses.shopId, shopId), gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)),
        });

        const allIncomes = await db.query.incomes.findMany({
            where: and(eq(incomes.shopId, shopId), gte(incomes.incomeDate, startDate), lte(incomes.incomeDate, endDate)),
        });

        let receiptsFromClients = 0;
        let paymentsToSuppliers = 0;
        let payrollPaid = 0;

        allDocs.forEach(d => {
            const val = parseFloat(d.grandTotal || "0");
            const isReceiptFromInvoice = d.type === "RECEIPT" && d.parentDocumentId;
            const isSalesDoc = d.type === "RECEIPT" || (d.type === "INVOICE" && d.status === "PAID") || (d.type === "CREDIT_NOTE" && d.status === "PAID");
            if (!isReceiptFromInvoice && isSalesDoc) {
                const factor = d.type === "CREDIT_NOTE" ? -1 : 1;
                receiptsFromClients += val * factor;
            }
            if ((d.type === "LPO" || d.type === "PO" || d.type === "PAYMENT_VOUCHER") && d.status === "PAID") {
                paymentsToSuppliers += val;
            }
            if (d.type === "PAYROLL_VOUCHER" && d.status === "PAID") {
                payrollPaid += val;
            }
        });

        const operatingExpensesPaid = allExpenses.reduce((s, e) => s + parseFloat(e.amount || "0"), 0);
        const netOperating = receiptsFromClients - paymentsToSuppliers - payrollPaid - operatingExpensesPaid;

        // Investing — asset sale income
        const assetSales = allIncomes
            .filter(i => i.category === "ASSET_SALE")
            .reduce((s, i) => s + parseFloat(i.amount || "0"), 0);

        return {
            success: true,
            data: {
                period: periodLabel,
                currency: shop.currency || "KES",
                operating: { receiptsFromClients, paymentsToSuppliers, payrollPaid, operatingExpensesPaid, netOperating },
                investing: { assetSales, netInvesting: assetSales },
                netCashFlow: netOperating + assetSales,
            },
        };
    } catch (error: any) {
        console.error("Cash flow error:", error);
        return { success: false, error: "Failed to generate cash flow statement." };
    }
}
