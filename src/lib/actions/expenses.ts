"use server";

import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";
import { createJournalEntry, EXPENSE_CATEGORY_ACCOUNT_MAP } from "./gl";

type ExpenseCategory = 'RENT' | 'UTILITIES' | 'FUEL' | 'MARKETING' | 'SALARIES' | 'OFFICE_SUPPLIES' | 'OTHER';

export async function createExpense(
    shopId: string, 
    data: { description: string, amount: number, category: ExpenseCategory, expenseDate: Date, receiptUrl?: string, currency?: string, paymentChannel?: string, paymentReference?: string }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const newExpense = await db.insert(expenses).values({
            shopId,
            description: data.description,
            amount: data.amount.toString(),
            category: data.category,
            expenseDate: data.expenseDate,
            receiptUrl: data.receiptUrl || null,
            currency: data.currency || "KES",
            paymentChannel: data.paymentChannel || null,
            paymentReference: data.paymentReference || null
        }).returning();

        revalidatePath(`/workspaces/${shopId}/expenses`);
        revalidatePath(`/workspaces/${shopId}/analytics`);

        // Auto-journal: DR Expense Account / CR Cash & Bank (if GL is active)
        const expenseAccountCode = EXPENSE_CATEGORY_ACCOUNT_MAP[data.category] || "6900";
        await createJournalEntry({
            shopId,
            entryDate: data.expenseDate,
            description: `Expense: ${data.description}`,
            debitAccountCode: expenseAccountCode,
            creditAccountCode: "1200", // Cash & Bank
            amount: data.amount,
            sourceType: "expense",
            sourceId: newExpense[0].id,
        });

        return { success: true, expense: newExpense[0] };
    } catch (error: any) {
        console.error("Failed to create expense:", error);
        return { success: false, error: error.message || "Failed to create expense." };
    }
}

export async function getExpenses(shopId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const records = await db.query.expenses.findMany({
            where: eq(expenses.shopId, shopId),
            orderBy: [desc(expenses.expenseDate), desc(expenses.createdAt)]
        });

        return { success: true, expenses: records };
    } catch (error: any) {
        console.error("Failed to fetch expenses:", error);
        return { success: false, error: error.message || "Failed to fetch expenses." };
    }
}

export async function deleteExpense(shopId: string, expenseId: string) {
    try {
        // Deleting financial records usually requires a high privilege, but manage_expenses covers it.
        await enforcePermission(shopId, "manage_expenses");

        await db.delete(expenses).where(
            and(
                eq(expenses.id, expenseId),
                eq(expenses.shopId, shopId)
            )
        );

        revalidatePath(`/workspaces/${shopId}/expenses`);
        revalidatePath(`/workspaces/${shopId}/analytics`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete expense:", error);
        return { success: false, error: error.message || "Failed to delete expense." };
    }
}
