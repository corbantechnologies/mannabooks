"use server";

import { db } from "@/db";
import {
    shops,
    documents,
    documentItems,
    documentTokens,
    expenses,
    incomes,
    products,
    clients,
    suppliers,
    employees,
    stockLocations,
    stockTransfers,
    stockTransferItems,
    stockLedger,
    paymentMethods,
    chartOfAccounts,
    fiscalYears,
    accountingPeriods,
    journalEntries,
    budgets,
    fixedAssets,
    taxInstalments,
    whtPayments,
    ledgerSnapshots,
    shopInvitations,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

export type CleanSlateMode = "ACCOUNTING_ONLY" | "FULL_FACTORY";

/**
 * 1. Exports all workspace data into a structured JSON backup archive
 *    before any destructive purge action can proceed.
 */
export async function exportWorkspaceDataAction(shopId: string) {
    try {
        await enforcePermission(shopId, "manage_settings");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const shop = await db.query.shops.findFirst({
            where: eq(shops.id, shopId),
        });
        if (!shop) return { success: false, error: "Workspace not found." };

        // Fetch all workspace collections
        const [
            allDocs,
            allClients,
            allSuppliers,
            allProducts,
            allEmployees,
            allExpenses,
            allIncomes,
            allStockTransfers,
            allStockLedger,
            allPaymentMethods,
            allAccounts,
            allFiscalYears,
            allPeriods,
            allJournals,
            allBudgets,
            allAssets,
            allTaxInstalments,
            allWhtPayments,
        ] = await Promise.all([
            db.query.documents.findMany({
                where: eq(documents.shopId, shopId),
                with: { items: true, client: true },
            }),
            db.query.clients.findMany({ where: eq(clients.shopId, shopId) }),
            db.query.suppliers.findMany({ where: eq(suppliers.shopId, shopId) }),
            db.query.products.findMany({ where: eq(products.shopId, shopId) }),
            db.query.employees.findMany({ where: eq(employees.shopId, shopId) }),
            db.query.expenses.findMany({ where: eq(expenses.shopId, shopId) }),
            db.query.incomes.findMany({ where: eq(incomes.shopId, shopId) }),
            db.query.stockTransfers.findMany({
                where: eq(stockTransfers.shopId, shopId),
                with: { items: true },
            }),
            db.query.stockLedger.findMany({ where: eq(stockLedger.shopId, shopId) }),
            db.query.paymentMethods.findMany({ where: eq(paymentMethods.shopId, shopId) }),
            db.query.chartOfAccounts.findMany({ where: eq(chartOfAccounts.shopId, shopId) }),
            db.query.fiscalYears.findMany({ where: eq(fiscalYears.shopId, shopId) }),
            db.query.accountingPeriods.findMany({ where: eq(accountingPeriods.shopId, shopId) }),
            db.query.journalEntries.findMany({ where: eq(journalEntries.shopId, shopId) }),
            db.query.budgets.findMany({ where: eq(budgets.shopId, shopId) }),
            db.query.fixedAssets.findMany({ where: eq(fixedAssets.shopId, shopId) }),
            db.query.taxInstalments.findMany({ where: eq(taxInstalments.shopId, shopId) }),
            db.query.whtPayments.findMany({ where: eq(whtPayments.shopId, shopId) }),
        ]);

        const backupArchive = {
            exportVersion: "2026.4",
            exportedAt: new Date().toISOString(),
            exportedBy: session.user?.name || "Workspace Operator",
            shop: {
                id: shop.id,
                name: shop.name,
                slug: shop.slug,
                code: shop.code,
                currency: shop.currency,
                phone: shop.phone,
                email: shop.email,
                taxPin: shop.taxPin,
            },
            dataSummary: {
                documentsCount: allDocs.length,
                clientsCount: allClients.length,
                suppliersCount: allSuppliers.length,
                productsCount: allProducts.length,
                employeesCount: allEmployees.length,
                expensesCount: allExpenses.length,
                incomesCount: allIncomes.length,
                journalEntriesCount: allJournals.length,
            },
            data: {
                documents: allDocs,
                clients: allClients,
                suppliers: allSuppliers,
                products: allProducts,
                employees: allEmployees,
                expenses: allExpenses,
                incomes: allIncomes,
                stockTransfers: allStockTransfers,
                stockLedger: allStockLedger,
                paymentMethods: allPaymentMethods,
                chartOfAccounts: allAccounts,
                fiscalYears: allFiscalYears,
                accountingPeriods: allPeriods,
                journalEntries: allJournals,
                budgets: allBudgets,
                fixedAssets: allAssets,
                taxInstalments: allTaxInstalments,
                whtPayments: allWhtPayments,
            },
        };

        const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `manna_backup_${shop.slug}_${timestampStr}.json`;

        return {
            success: true,
            filename,
            exportData: backupArchive,
        };
    } catch (error: any) {
        console.error("Export workspace data error:", error);
        return { success: false, error: error.message || "Failed to generate workspace export." };
    }
}

/**
 * 2. Executes the Clean Slate reset inside a single atomic database transaction.
 */
export async function cleanSlateWorkspaceAction(
    shopId: string,
    shopSlug: string,
    mode: CleanSlateMode,
    confirmationCode: string
) {
    try {
        await enforcePermission(shopId, "manage_settings");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const shop = await db.query.shops.findFirst({
            where: eq(shops.id, shopId),
        });
        if (!shop) return { success: false, error: "Workspace not found." };

        // Verify confirmation code matches workspace code or short name
        const expectedCode = (shop.code || shop.slug).trim().toUpperCase();
        const inputCode = (confirmationCode || "").trim().toUpperCase();
        if (inputCode !== expectedCode && inputCode !== "CONFIRM RESET") {
            return {
                success: false,
                error: `Confirmation code incorrect. Please type "${expectedCode}" to confirm.`,
            };
        }

        await db.transaction(async (tx) => {
            // A. Wipe General Ledger & Financial Period tables
            await tx.delete(journalEntries).where(eq(journalEntries.shopId, shopId));
            await tx.delete(budgets).where(eq(budgets.shopId, shopId));
            await tx.delete(fixedAssets).where(eq(fixedAssets.shopId, shopId));
            await tx.delete(taxInstalments).where(eq(taxInstalments.shopId, shopId));
            await tx.delete(whtPayments).where(eq(whtPayments.shopId, shopId));
            await tx.delete(accountingPeriods).where(eq(accountingPeriods.shopId, shopId));
            await tx.delete(fiscalYears).where(eq(fiscalYears.shopId, shopId));
            await tx.delete(ledgerSnapshots).where(eq(ledgerSnapshots.shopId, shopId));


            // C. Wipe Expenses and Incomes
            await tx.delete(expenses).where(eq(expenses.shopId, shopId));
            await tx.delete(incomes).where(eq(incomes.shopId, shopId));

            // D. Wipe Stock Transfers and Stock Ledger
            const transfers = await tx.query.stockTransfers.findMany({ where: eq(stockTransfers.shopId, shopId) });
            const transferIds = transfers.map(t => t.id);
            if (transferIds.length > 0) {
                await tx.delete(stockTransferItems).where(inArray(stockTransferItems.transferId, transferIds));
            }
            await tx.delete(stockTransfers).where(eq(stockTransfers.shopId, shopId));
            await tx.delete(stockLedger).where(eq(stockLedger.shopId, shopId));

            // E. Wipe Documents, Items, and Tokens
            const docs = await tx.query.documents.findMany({ where: eq(documents.shopId, shopId) });
            const docIds = docs.map(d => d.id);
            if (docIds.length > 0) {
                await tx.delete(documentTokens).where(inArray(documentTokens.documentId, docIds));
                await tx.delete(documentItems).where(inArray(documentItems.documentId, docIds));
            }
            await tx.delete(documents).where(eq(documents.shopId, shopId));

            // F. Option B: Full Factory Reset (wipes master catalogs, clients, suppliers, employees)
            if (mode === "FULL_FACTORY") {
                await tx.delete(employees).where(eq(employees.shopId, shopId));
                await tx.delete(products).where(eq(products.shopId, shopId));
                await tx.delete(clients).where(eq(clients.shopId, shopId));
                await tx.delete(suppliers).where(eq(suppliers.shopId, shopId));
                await tx.delete(chartOfAccounts).where(eq(chartOfAccounts.shopId, shopId));
                await tx.delete(shopInvitations).where(eq(shopInvitations.shopId, shopId));
            }

            // G. Reset Shop GL status
            await tx.update(shops).set({
                isGlEnabled: false,
                glOnboardingMode: false,
            }).where(eq(shops.id, shopId));
        });

        // Revalidate core routes
        revalidatePath(`/workspaces/${shopSlug}`);
        revalidatePath(`/workspaces/${shopSlug}/finance`);
        revalidatePath(`/workspaces/${shopSlug}/documents`);
        revalidatePath(`/workspaces/${shopSlug}/inventory`);
        revalidatePath(`/workspaces/${shopSlug}/payroll`);
        revalidatePath(`/workspaces/${shopSlug}/settings`);
        revalidatePath(`/workspaces/${shopSlug}/settings/diagnostics`);

        return { success: true };
    } catch (error: any) {
        console.error("Clean slate factory reset failed:", error);
        return { success: false, error: error.message || "Failed to reset workspace." };
    }
}
