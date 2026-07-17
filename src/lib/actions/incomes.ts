"use server";

import { db } from "@/db";
import { incomes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";
import { createJournalEntry } from "./gl";

export type IncomeCategory = 'INTEREST' | 'DIVIDENDS' | 'ASSET_SALE' | 'REFUNDS' | 'COMMISSION' | 'RENTAL_INCOME' | 'GRANTS_SUBSIDIES' | 'OTHER';

export async function createIncome(
    shopId: string, 
    data: { description: string, amount: number, category: IncomeCategory, incomeDate: Date, attachmentUrl?: string, currency?: string, paymentChannel?: string, paymentReference?: string }
) {
    try {
        await enforcePermission(shopId, "manage_expenses"); // Using manage_expenses as a proxy for managing financial ledgers

        const newIncome = await db.insert(incomes).values({
            shopId,
            description: data.description,
            amount: data.amount.toString(),
            category: data.category,
            incomeDate: data.incomeDate,
            attachmentUrl: data.attachmentUrl || null,
            currency: data.currency || "KES",
            paymentChannel: data.paymentChannel || null,
            paymentReference: data.paymentReference || null
        }).returning();

        revalidatePath(`/workspaces/${shopId}/incomes`);
        revalidatePath(`/workspaces/${shopId}/analytics`);

        // Auto-journal: DR Cash & Bank / CR Non-Operating Income (if GL is active)
        await createJournalEntry({
            shopId,
            entryDate: data.incomeDate,
            description: `Income: ${data.description} (${data.category})`,
            debitAccountCode: "1200",  // Cash & Bank
            creditAccountCode: "4200", // Non-Operating Income
            amount: data.amount,
            sourceType: "income",
            sourceId: newIncome[0].id,
        });

        return { success: true, income: newIncome[0] };
    } catch (error: any) {
        console.error("Failed to log income:", error);
        return { success: false, error: error.message || "Failed to log income." };
    }
}

export async function getIncomes(shopId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const records = await db.query.incomes.findMany({
            where: eq(incomes.shopId, shopId),
            orderBy: [desc(incomes.incomeDate), desc(incomes.createdAt)]
        });

        return { success: true, incomes: records };
    } catch (error: any) {
        console.error("Failed to fetch incomes:", error);
        return { success: false, error: error.message || "Failed to fetch incomes." };
    }
}

export async function deleteIncome(shopId: string, incomeId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        await db.delete(incomes).where(
            and(
                eq(incomes.id, incomeId),
                eq(incomes.shopId, shopId)
            )
        );

        revalidatePath(`/workspaces/${shopId}/incomes`);
        revalidatePath(`/workspaces/${shopId}/analytics`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete income:", error);
        return { success: false, error: error.message || "Failed to delete income." };
    }
}
