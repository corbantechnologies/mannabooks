"use server";

import { db } from "@/db";
import { documents, expenses, incomes, shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createJournalEntry, EXPENSE_CATEGORY_ACCOUNT_MAP } from "./gl";
import { enforcePermission } from "./rbac";

/**
 * One-time backfill migration to create GL journal entries for all
 * existing transactions (documents, expenses, incomes) in a workspace.
 * 
 * Run once when GL is activated. Each entry is tagged sourceType='migrated'.
 * Safe to call from a server action — all existing data is preserved.
 */
export async function runGlMigration(shopId: string, shopSlug: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };
        if (!shop.isGlEnabled) return { success: false, error: "Please activate the General Ledger first." };

        const results = { documents: 0, expenses: 0, incomes: 0, errors: 0 };

        // 1. Backfill Documents
        const allDocs = await db.query.documents.findMany({ where: eq(documents.shopId, shopId) });

        for (const doc of allDocs) {
            try {
                const amount = parseFloat(doc.grandTotal || "0");
                if (amount <= 0) continue;
                const isReceiptFromInvoice = doc.type === "RECEIPT" && doc.parentDocumentId;

                if (!isReceiptFromInvoice && doc.type === "INVOICE") {
                    if (doc.status === "PAID") {
                        // PAID Invoice: DR Cash & Bank / CR Sales Revenue
                        await createJournalEntry({
                            shopId, entryDate: new Date(doc.issueDate),
                            description: `[Migrated] Invoice ${doc.docNumber} — Settled`,
                            debitAccountCode: "1200", creditAccountCode: "4100",
                            amount, sourceType: "migrated", sourceId: doc.id, isBackdated: true,
                            backdatedReason: "GL onboarding backfill"
                        });
                    } else if (doc.status === "ISSUED" || doc.status === "OVERDUE") {
                        // Outstanding Invoice: DR AR / CR Sales Revenue
                        await createJournalEntry({
                            shopId, entryDate: new Date(doc.issueDate),
                            description: `[Migrated] Invoice ${doc.docNumber} — Outstanding`,
                            debitAccountCode: "1100", creditAccountCode: "4100",
                            amount, sourceType: "migrated", sourceId: doc.id, isBackdated: true,
                            backdatedReason: "GL onboarding backfill"
                        });
                    }
                    results.documents++;
                }

                if (!isReceiptFromInvoice && doc.type === "RECEIPT") {
                    // Standalone Receipt: DR Cash & Bank / CR Sales Revenue
                    await createJournalEntry({
                        shopId, entryDate: new Date(doc.issueDate),
                        description: `[Migrated] Receipt ${doc.docNumber}`,
                        debitAccountCode: "1200", creditAccountCode: "4100",
                        amount, sourceType: "migrated", sourceId: doc.id, isBackdated: true,
                        backdatedReason: "GL onboarding backfill"
                    });
                    results.documents++;
                }

                if ((doc.type === "LPO" || doc.type === "PO" || doc.type === "PAYMENT_VOUCHER") && doc.status === "PAID") {
                    // Supplier Payment: DR Accounts Payable / CR Cash & Bank
                    await createJournalEntry({
                        shopId, entryDate: new Date(doc.issueDate),
                        description: `[Migrated] ${doc.type} ${doc.docNumber} — Paid`,
                        debitAccountCode: "2100", creditAccountCode: "1200",
                        amount, sourceType: "migrated", sourceId: doc.id, isBackdated: true,
                        backdatedReason: "GL onboarding backfill"
                    });
                    results.documents++;
                }
            } catch (e) {
                console.error(`GL migration error for document ${doc.id}:`, e);
                results.errors++;
            }
        }

        // 2. Backfill Expenses
        const allExpenses = await db.query.expenses.findMany({ where: eq(expenses.shopId, shopId) });

        for (const exp of allExpenses) {
            try {
                const amount = parseFloat(exp.amount || "0");
                if (amount <= 0) continue;
                const expenseAccountCode = EXPENSE_CATEGORY_ACCOUNT_MAP[exp.category] || "6900";

                await createJournalEntry({
                    shopId, entryDate: new Date(exp.expenseDate),
                    description: `[Migrated] Expense: ${exp.description}`,
                    debitAccountCode: expenseAccountCode, creditAccountCode: "1200",
                    amount, sourceType: "migrated", sourceId: exp.id, isBackdated: true,
                    backdatedReason: "GL onboarding backfill"
                });
                results.expenses++;
            } catch (e) {
                console.error(`GL migration error for expense ${exp.id}:`, e);
                results.errors++;
            }
        }

        // 3. Backfill Non-Operating Incomes
        const allIncomes = await db.query.incomes.findMany({ where: eq(incomes.shopId, shopId) });

        for (const inc of allIncomes) {
            try {
                const amount = parseFloat(inc.amount || "0");
                if (amount <= 0) continue;

                await createJournalEntry({
                    shopId, entryDate: new Date(inc.incomeDate),
                    description: `[Migrated] Income: ${inc.description} (${inc.category})`,
                    debitAccountCode: "1200", creditAccountCode: "4200",
                    amount, sourceType: "migrated", sourceId: inc.id, isBackdated: true,
                    backdatedReason: "GL onboarding backfill"
                });
                results.incomes++;
            } catch (e) {
                console.error(`GL migration error for income ${inc.id}:`, e);
                results.errors++;
            }
        }

        return {
            success: true,
            summary: `Migration complete. Processed: ${results.documents} documents, ${results.expenses} expenses, ${results.incomes} incomes. Errors: ${results.errors}.`
        };
    } catch (error: any) {
        console.error("GL migration failed:", error);
        return { success: false, error: error.message || "GL migration failed." };
    }
}
