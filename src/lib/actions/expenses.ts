"use server";

import { apiClient } from "@/lib/api/client";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

type ExpenseCategory = 'RENT' | 'UTILITIES' | 'FUEL' | 'MARKETING' | 'SALARIES' | 'OFFICE_SUPPLIES' | 'OTHER';

export async function createExpense(
    shopId: string, 
    data: { description: string, amount: number, category: ExpenseCategory, expenseDate: Date, receiptUrl?: string, currency?: string, paymentChannel?: string, paymentReference?: string, isNonDeductible?: boolean }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const res = await apiClient.post<{ success: boolean; expense: any; error?: string }>(
            "/v1/operations/expenses",
            {
                shop_id: shopId,
                description: data.description,
                amount: data.amount,
                category: data.category,
                expense_date: data.expenseDate.toISOString(),
                receipt_url: data.receiptUrl || null,
                currency: data.currency || "KES",
                payment_channel: data.paymentChannel || null,
                payment_reference: data.paymentReference || null,
                is_non_deductible: data.isNonDeductible || false,
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to create expense." };
        }

        return { success: true, expense: res.data.expense };
    } catch (error: any) {
        console.error("Failed to create expense via FastAPI:", error);
        return { success: false, error: error.message || "Failed to create expense." };
    }
}

export async function getExpenses(shopId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const res = await apiClient<any[]>(`/v1/operations/expenses?shop_id=${shopId}`);
        if (res.error) {
            return { success: false, error: res.error };
        }

        return { success: true, expenses: res.data || [] };
    } catch (error: any) {
        console.error("Failed to fetch expenses via FastAPI:", error);
        return { success: false, error: error.message || "Failed to fetch expenses." };
    }
}

export async function deleteExpense(shopId: string, expenseId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete expense:", error);
        return { success: false, error: error.message || "Failed to delete expense." };
    }
}
