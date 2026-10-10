"use server";

import { apiClient } from "@/lib/api/client";
import { enforcePermission } from "./rbac";

export type IncomeCategory = 'INTEREST' | 'DIVIDENDS' | 'ASSET_SALE' | 'REFUNDS' | 'COMMISSION' | 'RENTAL_INCOME' | 'GRANTS_SUBSIDIES' | 'OTHER';

export async function createIncome(
    shopId: string, 
    data: { description: string, amount: number, category: IncomeCategory, incomeDate: Date, attachmentUrl?: string, currency?: string, paymentChannel?: string, paymentReference?: string }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const res = await apiClient.post<{ success: boolean; income: any; error?: string }>(
            "/v1/operations/incomes",
            {
                shop_id: shopId,
                description: data.description,
                amount: data.amount,
                category: data.category,
                income_date: data.incomeDate.toISOString(),
                attachment_url: data.attachmentUrl || null,
                currency: data.currency || "KES",
                payment_channel: data.paymentChannel || null,
                payment_reference: data.paymentReference || null,
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to log income." };
        }

        return { success: true, income: res.data.income };
    } catch (error: any) {
        console.error("Failed to log income via FastAPI:", error);
        return { success: false, error: error.message || "Failed to log income." };
    }
}

export async function getIncomes(shopId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const res = await apiClient<any[]>(`/v1/operations/incomes?shop_id=${shopId}`);
        if (res.error) {
            return { success: false, error: res.error };
        }

        return { success: true, incomes: res.data || [] };
    } catch (error: any) {
        console.error("Failed to fetch incomes via FastAPI:", error);
        return { success: false, error: error.message || "Failed to fetch incomes." };
    }
}

export async function deleteIncome(shopId: string, incomeId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete income:", error);
        return { success: false, error: error.message || "Failed to delete income." };
    }
}
