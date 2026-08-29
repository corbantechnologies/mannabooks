"use server";

import { db } from "@/db";
import { documents, documentItems, expenses, incomes, shops, clients, fixedAssets, productLocationStock, products } from "@/db/schema";
import { eq, and, gte, lte, desc, sum } from "drizzle-orm";
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

// ================================================================
// BALANCE SHEET (STATEMENT OF FINANCIAL POSITION)
// ================================================================

export interface BalanceSheetData {
    asOfDate: string;
    currency: string;
    // Current Assets
    cashAndBank: number;
    accountsReceivable: number;
    inventoryValuation: number;
    totalCurrentAssets: number;
    // Non-Current Assets
    fixedAssetsWdv: number;
    totalNonCurrentAssets: number;
    totalAssets: number;
    // Current Liabilities
    accountsPayable: number;
    taxPayable: number;
    totalCurrentLiabilities: number;
    totalLiabilities: number;
    // Equity
    openingBalanceEquity: number;
    retainedEarnings: number;
    currentPeriodNetProfit: number;
    totalEquity: number;
    // Validation
    isBalanced: boolean;
    difference: number;
}

export async function getBalanceSheet(
    shopId: string,
    asOfDate?: Date
): Promise<{ success: true; data: BalanceSheetData } | { success: false; error: string }> {
    try {
        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };

        const cutoff = asOfDate || new Date();
        const displayDate = cutoff.toLocaleDateString("en-KE", { dateStyle: "long" });

        // --- GL-based account balances ---
        const { journalEntries: je } = await import("@/db/schema");
        const allEntries = await db.query.journalEntries.findMany({
            where: and(
                eq(je.shopId, shopId),
                lte(je.entryDate, cutoff)
            ),
            with: { debitAccount: true, creditAccount: true },
        });

        // Build net balance map per account code: positive = net debit balance
        const netMap: Record<string, number> = {};
        for (const e of allEntries) {
            const amt = parseFloat(e.amount || "0");
            const dCode = e.debitAccount?.code;
            const cCode = e.creditAccount?.code;
            if (dCode) netMap[dCode] = (netMap[dCode] || 0) + amt;
            if (cCode) netMap[cCode] = (netMap[cCode] || 0) - amt;
        }

        const getBalance = (code: string) => netMap[code] || 0;

        // Assets
        const cashAndBank = getBalance("1200");
        const accountsReceivable = Math.max(0, getBalance("1100"));

        // Inventory valuation from junction table (qty × cost price)
        const locStocks = await db.query.productLocationStock.findMany({
            where: eq(productLocationStock.shopId, shopId),
            with: { product: true },
        });
        let inventoryValuation = 0;
        for (const row of locStocks) {
            if (!row.product) continue;
            const qty = parseFloat(row.quantity || "0");
            const cost = parseFloat(row.product.costPrice || "0");
            inventoryValuation += qty * cost;
        }
        // Also include products without junction table entries (defaultLocationId-based)
        const allTracked = await db.query.products.findMany({
            where: and(eq(products.shopId, shopId), eq(products.trackStock, true)),
        });
        const junctionProductIds = new Set(locStocks.map(s => s.productId));
        for (const p of allTracked) {
            if (!junctionProductIds.has(p.id)) {
                inventoryValuation += parseFloat(p.stockQuantity || "0") * parseFloat(p.costPrice || "0");
            }
        }

        // Fixed Assets Net WDV
        const fixedAssetRows = await db.query.fixedAssets.findMany({
            where: and(eq(fixedAssets.shopId, shopId), eq(fixedAssets.isDisposed, false)),
        });
        const fixedAssetsWdv = fixedAssetRows.reduce((s, a) => s + parseFloat(a.taxWdv || "0"), 0);

        const totalCurrentAssets = cashAndBank + accountsReceivable + inventoryValuation;
        const totalNonCurrentAssets = fixedAssetsWdv;
        const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

        // Liabilities
        const accountsPayable = Math.abs(Math.min(0, getBalance("2100")));
        const taxPayable = Math.abs(Math.min(0, getBalance("2200")));
        const totalCurrentLiabilities = accountsPayable + taxPayable;
        const totalLiabilities = totalCurrentLiabilities;

        // Equity
        const openingBalanceEquity = Math.abs(Math.min(0, getBalance("3100")));
        const retainedEarnings = Math.abs(Math.min(0, getBalance("3200")));

        // Current period net profit from P&L (same fiscal year)
        const { start: fyStart } = getFiscalYearRange(shop.fiscalYearStartMonth || 1);
        const plResult = await getPLStatement(shopId, "THIS_YEAR");
        const currentPeriodNetProfit = plResult.success ? plResult.data.netIncome : 0;

        const totalEquity = openingBalanceEquity + retainedEarnings + currentPeriodNetProfit;

        const difference = totalAssets - (totalLiabilities + totalEquity);
        const isBalanced = Math.abs(difference) < 1.00; // Allow <1 unit rounding tolerance

        return {
            success: true,
            data: {
                asOfDate: displayDate,
                currency: shop.currency || "KES",
                cashAndBank,
                accountsReceivable,
                inventoryValuation,
                totalCurrentAssets,
                fixedAssetsWdv,
                totalNonCurrentAssets,
                totalAssets,
                accountsPayable,
                taxPayable,
                totalCurrentLiabilities,
                totalLiabilities,
                openingBalanceEquity,
                retainedEarnings,
                currentPeriodNetProfit,
                totalEquity,
                isBalanced,
                difference,
            },
        };
    } catch (error: any) {
        console.error("Balance sheet error:", error);
        return { success: false, error: "Failed to generate balance sheet." };
    }
}

// ================================================================
// CLIENT STATEMENT OF ACCOUNT (A/R LEDGER)
// ================================================================

export interface StatementLine {
    date: string;
    reference: string;
    docType: string;
    description: string;
    debit: number;
    credit: number;
    runningBalance: number;
    status: string;
    docId: string;
}

export interface ClientStatementData {
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    taxPin: string | null;
    currency: string;
    shopName: string;
    periodLabel: string;
    lines: StatementLine[];
    totalDebits: number;
    totalCredits: number;
    closingBalance: number;
}

export async function getClientStatement(
    shopId: string,
    clientId: string,
    startDate?: Date,
    endDate?: Date
): Promise<{ success: true; data: ClientStatementData } | { success: false; error: string }> {
    try {
        const [shop, client] = await Promise.all([
            db.query.shops.findFirst({ where: eq(shops.id, shopId) }),
            db.query.clients.findFirst({
                where: and(eq(clients.id, clientId), eq(clients.shopId, shopId)),
            }),
        ]);

        if (!shop) return { success: false, error: "Workspace not found." };
        if (!client) return { success: false, error: "Client not found." };

        const start = startDate || new Date(new Date().getFullYear(), 0, 1);
        const end = endDate || new Date();

        const periodLabel = `${start.toLocaleDateString("en-KE", { dateStyle: "medium" })} – ${end.toLocaleDateString("en-KE", { dateStyle: "medium" })}`;

        // Fetch all documents for this client in the period
        const clientDocs = await db.query.documents.findMany({
            where: and(
                eq(documents.shopId, shopId),
                eq(documents.clientId, clientId),
                gte(documents.issueDate, start),
                lte(documents.issueDate, end)
            ),
            orderBy: [desc(documents.issueDate)],
        });

        // Sort ascending for running balance calculation
        const sorted = [...clientDocs].sort(
            (a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
        );

        let runningBalance = 0;
        let totalDebits = 0;
        let totalCredits = 0;

        const lines: StatementLine[] = sorted.map(doc => {
            const amount = parseFloat(doc.grandTotal || "0");
            let debit = 0;
            let credit = 0;

            if (doc.type === "INVOICE" || doc.type === "DEBIT_NOTE") {
                // Invoice billed = amount owed by client (debit their account)
                if (doc.status !== "CANCELLED") {
                    debit = amount;
                    runningBalance += amount;
                    totalDebits += amount;
                }
            } else if (doc.type === "RECEIPT") {
                // Payment received = credits client account
                if (!doc.parentDocumentId) {
                    // Standalone receipt (POS)
                    debit = amount;
                    runningBalance += amount;
                    totalDebits += amount;
                } else {
                    // Receipt settling an invoice
                    credit = amount;
                    runningBalance -= amount;
                    totalCredits += amount;
                }
            } else if (doc.type === "CREDIT_NOTE") {
                credit = amount;
                runningBalance -= amount;
                totalCredits += amount;
            } else if (doc.type === "QUOTATION" || doc.type === "DELIVERY_NOTE") {
                // Informational only — no financial impact
                debit = 0;
                credit = 0;
            }

            const docTypeLabel: Record<string, string> = {
                INVOICE: "Invoice",
                RECEIPT: "Payment Receipt",
                CREDIT_NOTE: "Credit Note",
                DEBIT_NOTE: "Debit Note",
                QUOTATION: "Quotation",
                DELIVERY_NOTE: "Delivery Note",
            };

            return {
                date: new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" }),
                reference: doc.docNumber,
                docType: doc.type,
                description: docTypeLabel[doc.type] || doc.type,
                debit,
                credit,
                runningBalance,
                status: doc.status,
                docId: doc.id,
            };
        });

        return {
            success: true,
            data: {
                clientName: client.name,
                clientEmail: client.email,
                clientPhone: client.phone,
                taxPin: client.taxPin,
                currency: shop.currency || "KES",
                shopName: shop.name,
                periodLabel,
                lines,
                totalDebits,
                totalCredits,
                closingBalance: runningBalance,
            },
        };
    } catch (error: any) {
        console.error("Client statement error:", error);
        return { success: false, error: "Failed to generate client statement." };
    }
}
