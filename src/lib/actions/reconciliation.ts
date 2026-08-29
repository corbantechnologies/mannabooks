"use server";

import { db } from "@/db";
import { chartOfAccounts, journalEntries, shops, paymentMethods, documents, expenses, incomes } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";

export interface CashGlEntry {
    id: string;
    entryDate: string;
    description: string;
    amount: number;
    direction: "DEBIT" | "CREDIT"; // DEBIT = Cash IN (Asset +), CREDIT = Cash OUT (Asset -)
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

export async function getBankReconciliationData(
    shopId: string
): Promise<{ success: true; data: BankReconciliationPayload } | { success: false; error: string }> {
    try {
        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };

        // Find primary Cash & Bank account (1200) or first Asset account
        const cashAcc = await db.query.chartOfAccounts.findFirst({
            where: and(eq(chartOfAccounts.shopId, shopId), eq(chartOfAccounts.code, "1200")),
        }) || await db.query.chartOfAccounts.findFirst({
            where: and(eq(chartOfAccounts.shopId, shopId), eq(chartOfAccounts.accountType, "ASSET")),
        });

        if (!cashAcc) {
            return { success: false, error: "No Cash & Bank asset account (1200) found in Chart of Accounts." };
        }

        // Fetch journal entries where debitAccountId = cashAcc.id or creditAccountId = cashAcc.id
        const entries = await db.query.journalEntries.findMany({
            where: and(
                eq(journalEntries.shopId, shopId),
                or(
                    eq(journalEntries.debitAccountId, cashAcc.id),
                    eq(journalEntries.creditAccountId, cashAcc.id)
                )
            ),
            orderBy: [desc(journalEntries.entryDate)],
            with: {
                debitAccount: true,
                creditAccount: true,
            },
        });

        let bookBalance = 0;
        const glEntries: CashGlEntry[] = entries.map((e) => {
            const amt = parseFloat(e.amount || "0");
            const isDebit = e.debitAccountId === cashAcc.id;

            if (isDebit) {
                bookBalance += amt;
            } else {
                bookBalance -= amt;
            }

            return {
                id: e.id,
                entryDate: new Date(e.entryDate).toISOString(),
                description: e.description,
                amount: amt,
                direction: isDebit ? "DEBIT" : "CREDIT",
                sourceType: e.sourceType,
                reference: e.description.match(/(INV-[A-Z0-9-]+|REC-[A-Z0-9-]+|EXP-[A-Z0-9-]+|MPESA-[A-Z0-9]+|[A-Z0-9]{8,12})/i)?.[0] || null,
            };
        });

        const pMethods = await db.query.paymentMethods.findMany({
            where: eq(paymentMethods.shopId, shopId),
        });

        return {
            success: true,
            data: {
                shopId: shop.id,
                currency: shop.currency || "KES",
                cashAccountId: cashAcc.id,
                cashAccountCode: cashAcc.code,
                cashAccountName: cashAcc.name,
                bookBalance,
                glEntries,
                availablePaymentMethods: pMethods.map((p) => ({
                    id: p.id,
                    name: p.name,
                    details: p.details,
                })),
            },
        };
    } catch (error: any) {
        console.error("Bank reconciliation data error:", error);
        return { success: false, error: "Failed to load bank reconciliation data." };
    }
}
