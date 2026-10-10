// src/lib/actions/terms.ts
"use server";

import { apiClient } from "@/lib/api/client";
import { revalidatePath } from "next/cache";

export interface ShopTermItem {
    id: string;
    shopId: string;
    title: string;
    content: string;
    isDefaultInvoice: boolean;
    isDefaultCatalog: boolean;
    displayOrder: number;
    createdAt?: string | Date;
}

/**
 * Fetches all saved Terms & Conditions for a specific shop via FastAPI.
 */
export async function getShopTerms(shopId: string): Promise<ShopTermItem[]> {
    try {
        const res = await apiClient.get<{ success: boolean; terms: ShopTermItem[] }>(
            `/v1/workspaces/${shopId}/terms`
        );
        if (res.data?.success && Array.isArray(res.data.terms)) {
            return res.data.terms;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch shop terms via FastAPI:", error);
        return [];
    }
}

/**
 * Creates a new commercial term in the shop's library via FastAPI.
 */
export async function createShopTerm(input: {
    shopId: string;
    shopSlug?: string;
    title: string;
    content: string;
    isDefaultInvoice?: boolean;
    isDefaultCatalog?: boolean;
    displayOrder?: number;
}) {
    try {
        if (!input.title || input.title.trim() === "") {
            return { success: false, error: "Term title is required." };
        }
        if (!input.content || input.content.trim() === "") {
            return { success: false, error: "Term clause text is required." };
        }

        const res = await apiClient.post<{ success: boolean; termId: string; error?: string }>(
            `/v1/workspaces/${input.shopId}/terms`,
            {
                title: input.title.trim(),
                content: input.content.trim(),
                display_order: input.displayOrder ?? 0,
                is_default_invoice: input.isDefaultInvoice ?? false,
                is_default_catalog: input.isDefaultCatalog ?? false,
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to create term." };
        }

        if (input.shopSlug) {
            revalidatePath(`/workspaces/${input.shopSlug}/settings`);
            revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
        }

        return { success: true, term: { id: res.data.termId, ...input } };
    } catch (error: any) {
        console.error("Create shop term error via FastAPI:", error);
        return { success: false, error: error.message || "Failed to create term." };
    }
}

/**
 * Updates an existing term in the shop's library via FastAPI.
 */
export async function updateShopTerm(input: {
    id: string;
    shopId: string;
    shopSlug?: string;
    title: string;
    content: string;
    isDefaultInvoice?: boolean;
    isDefaultCatalog?: boolean;
    displayOrder?: number;
}) {
    try {
        if (!input.title || input.title.trim() === "") {
            return { success: false, error: "Term title is required." };
        }
        if (!input.content || input.content.trim() === "") {
            return { success: false, error: "Term clause text is required." };
        }

        const res = await apiClient.patch(
            `/v1/workspaces/${input.shopId}/terms/${input.id}`,
            {
                title: input.title.trim(),
                content: input.content.trim(),
                display_order: input.displayOrder,
                is_default_invoice: input.isDefaultInvoice,
                is_default_catalog: input.isDefaultCatalog,
            }
        );

        if (res.error) {
            return { success: false, error: res.error };
        }

        if (input.shopSlug) {
            revalidatePath(`/workspaces/${input.shopSlug}/settings`);
            revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Update shop term error via FastAPI:", error);
        return { success: false, error: error.message || "Failed to update term." };
    }
}

/**
 * Deletes a term from the shop's library via FastAPI.
 */
export async function deleteShopTerm(input: { id: string; shopId: string; shopSlug?: string }) {
    try {
        const res = await apiClient.delete(`/v1/workspaces/${input.shopId}/terms/${input.id}`);
        if (res.error) {
            return { success: false, error: res.error };
        }

        if (input.shopSlug) {
            revalidatePath(`/workspaces/${input.shopSlug}/settings`);
            revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Delete shop term error via FastAPI:", error);
        return { success: false, error: error.message || "Failed to delete term." };
    }
}

/**
 * Seeds standard Kenyan SME commercial preset terms into a shop via FastAPI.
 */
export async function seedDefaultShopTerms(shopId: string, shopSlug?: string) {
    try {
        const res = await apiClient.post(`/v1/workspaces/${shopId}/terms/seed-defaults`);
        if (res.error) {
            return { success: false, error: res.error };
        }

        if (shopSlug) {
            revalidatePath(`/workspaces/${shopSlug}/settings`);
            revalidatePath(`/workspaces/${shopSlug}/documents/new`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Seed default terms error via FastAPI:", error);
        return { success: false, error: error.message || "Failed to seed default terms." };
    }
}
