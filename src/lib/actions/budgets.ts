"use server";

import { db } from "@/db";
import { budgets, chartOfAccounts, expenses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";
import { EXPENSE_CATEGORY_ACCOUNT_MAP } from "../gl-constants";

export async function getBudgetsWithActuals(shopId: string, month: number, year: number) {
    // Get all expense accounts with their budgets for the period
    const accounts = await db.query.chartOfAccounts.findMany({
        where: and(eq(chartOfAccounts.shopId, shopId), eq(chartOfAccounts.accountType, "EXPENSE")),
        with: { budgets: true },
        orderBy: (a, { asc }) => [asc(a.code)],
    });

    // Get actual expenses for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const allExpenses = await db.query.expenses.findMany({
        where: and(
            eq(expenses.shopId, shopId),
            // We'll filter in JS to avoid import complexity
        ),
    });

    const filteredExpenses = allExpenses.filter(e => {
        const d = new Date(e.expenseDate);
        return d >= startDate && d <= endDate;
    });

    // Aggregate actuals by account code
    const actualsByCode: Record<string, number> = {};
    filteredExpenses.forEach(e => {
        const code = EXPENSE_CATEGORY_ACCOUNT_MAP[e.category] || "6900";
        actualsByCode[code] = (actualsByCode[code] || 0) + parseFloat(e.amount || "0");
    });

    return accounts.map(account => {
        const budget = account.budgets.find(b => b.month === month && b.year === year);
        const actual = actualsByCode[account.code] || 0;
        const limit = budget ? parseFloat(budget.monthlyLimit) : null;
        const pct = limit && limit > 0 ? Math.min((actual / limit) * 100, 100) : null;
        return {
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            budgetId: budget?.id || null,
            monthlyLimit: limit,
            actual,
            percentUsed: pct,
            isOverBudget: limit !== null && actual > limit,
            isWarning: pct !== null && pct >= 80 && pct < 100,
        };
    });
}

export async function upsertBudget(shopId: string, shopSlug: string, data: {
    accountId: string;
    month: number;
    year: number;
    monthlyLimit: number;
}) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        // Check if budget already exists
        const existing = await db.query.budgets.findFirst({
            where: and(
                eq(budgets.shopId, shopId),
                eq(budgets.accountId, data.accountId),
                eq(budgets.month, data.month),
                eq(budgets.year, data.year),
            ),
        });

        if (existing) {
            await db.update(budgets).set({ monthlyLimit: data.monthlyLimit.toFixed(2) })
                .where(eq(budgets.id, existing.id));
        } else {
            await db.insert(budgets).values({
                shopId,
                accountId: data.accountId,
                month: data.month,
                year: data.year,
                monthlyLimit: data.monthlyLimit.toFixed(2),
            });
        }

        revalidatePath(`/workspaces/${shopSlug}/finance/budgets`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to save budget." };
    }
}

export async function deleteBudget(shopId: string, shopSlug: string, budgetId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        await db.delete(budgets).where(and(eq(budgets.id, budgetId), eq(budgets.shopId, shopId)));
        revalidatePath(`/workspaces/${shopSlug}/finance/budgets`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
