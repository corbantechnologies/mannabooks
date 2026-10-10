"use server";

import { apiClient } from "@/lib/api/client";
import { revalidatePath } from "next/cache";

export interface PaymentMethodItem {
  id: string;
  shopId: string;
  type: string;
  name: string;
  details: string;
  isDefault: boolean;
  instructions?: string | null;
  createdAt?: string | null;
}

interface AddPaymentMethodInput {
  shopId: string;
  shopSlug: string;
  name: string;      // e.g., "M-Pesa Till" or "Commercial Bank"
  details: string;   // e.g., "Till Number: 552134" or "Acc No: 0110XXXXXX"
  isDefault: boolean;
  type?: string;
  instructions?: string;
}

/**
 * Creates a clear transactional text reference instruction block for client payments via FastAPI.
 */
export async function addPaymentMethod(input: AddPaymentMethodInput): Promise<{ success: true; methodId: string } | { success: false; error: string }> {
  try {
    const res = await apiClient.post<{ success: boolean; methodId: string; error?: string }>(
      `/v1/workspaces/${input.shopId}/payment-methods`,
      {
        name: input.name.trim(),
        details: input.details.trim(),
        is_default: input.isDefault,
        type: input.type || "BANK",
        instructions: input.instructions || null,
      }
    );

    if (res.error || !res.data?.success) {
      return { success: false, error: res.error || "Failed to save settlement parameters." };
    }

    revalidatePath(`/workspaces/${input.shopSlug}/settings`);
    return { success: true, methodId: res.data.methodId };
  } catch (error: any) {
    console.error("Failed to append payment configuration line:", error);
    return { success: false, error: error.message || "Failed to save settlement parameters." };
  }
}

/**
 * Retrieves active account configurations for dynamic document generation mapping via FastAPI.
 */
export async function getShopPaymentMethods(shopId: string): Promise<PaymentMethodItem[]> {
  try {
    const res = await apiClient.get<{ success: boolean; paymentMethods: PaymentMethodItem[] }>(
      `/v1/workspaces/${shopId}/payment-methods`
    );

    if (res.data?.success && Array.isArray(res.data.paymentMethods)) {
      return res.data.paymentMethods;
    }
    return [];
  } catch (error) {
    console.error("Failed to query payment definitions via FastAPI:", error);
    return [];
  }
}

/**
 * Removes a payment method configuration via FastAPI.
 */
export async function deletePaymentMethod(id: string, shopId: string, shopSlug: string) {
  try {
    const res = await apiClient.delete(`/v1/workspaces/${shopId}/payment-methods/${id}`);
    if (res.error) {
      return { success: false, error: res.error };
    }

    revalidatePath(`/workspaces/${shopSlug}/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to remove payment method via FastAPI:", error);
    return { success: false, error: error.message || "Failed to delete payment method." };
  }
}

/**
 * Sets a payment method as default for the shop via FastAPI.
 */
export async function setDefaultPaymentMethod(id: string, shopId: string, shopSlug: string) {
  try {
    const res = await apiClient.post(`/v1/workspaces/${shopId}/payment-methods/${id}/set-default`);
    if (res.error) {
      return { success: false, error: res.error };
    }

    revalidatePath(`/workspaces/${shopSlug}/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to set default payment method via FastAPI:", error);
    return { success: false, error: error.message || "Failed to update default payment method." };
  }
}

interface UpdatePaymentMethodInput {
  id: string;
  shopId: string;
  shopSlug: string;
  name: string;
  details: string;
  isDefault: boolean;
  type?: string;
  instructions?: string;
}

export async function updatePaymentMethod(input: UpdatePaymentMethodInput): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const res = await apiClient.patch(
      `/v1/workspaces/${input.shopId}/payment-methods/${input.id}`,
      {
        name: input.name.trim(),
        details: input.details.trim(),
        is_default: input.isDefault,
        type: input.type,
        instructions: input.instructions,
      }
    );

    if (res.error) {
      return { success: false, error: res.error };
    }

    revalidatePath(`/workspaces/${input.shopSlug}/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update payment method via FastAPI:", error);
    return { success: false, error: error.message || "Failed to update payment method." };
  }
}