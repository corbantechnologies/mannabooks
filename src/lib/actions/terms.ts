// src/lib/actions/terms.ts
"use server";

import { db } from "@/db";
import { shopTerms } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ShopTermItem {
    id: string;
    shopId: string;
    title: string;
    content: string;
    isDefaultInvoice: boolean;
    isDefaultCatalog: boolean;
    displayOrder: number;
    createdAt: Date;
}

/**
 * Fetches all saved Terms & Conditions for a specific shop.
 */
export async function getShopTerms(shopId: string): Promise<ShopTermItem[]> {
    try {
        const terms = await db.query.shopTerms.findMany({
            where: eq(shopTerms.shopId, shopId),
            orderBy: [asc(shopTerms.displayOrder), asc(shopTerms.createdAt)],
        });
        return terms;
    } catch (error) {
        console.error("Failed to fetch shop terms:", error);
        return [];
    }
}

/**
 * Creates a new commercial term in the shop's library.
 */
export async function createShopTerm(input: {
    shopId: string;
    shopSlug?: string;
    title: string;
    content: string;
    isDefaultInvoice?: boolean;
    isDefaultCatalog?: boolean;
}) {
    try {
        if (!input.title || input.title.trim() === "") {
            return { success: false, error: "Term title is required." };
        }
        if (!input.content || input.content.trim() === "") {
            return { success: false, error: "Term clause text is required." };
        }

        const [created] = await db
            .insert(shopTerms)
            .values({
                shopId: input.shopId,
                title: input.title.trim(),
                content: input.content.trim(),
                isDefaultInvoice: input.isDefaultInvoice ?? false,
                isDefaultCatalog: input.isDefaultCatalog ?? false,
            })
            .returning();

        if (input.shopSlug) {
            revalidatePath(`/workspaces/${input.shopSlug}/settings`);
            revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
        }

        return { success: true, term: created };
    } catch (error: any) {
        console.error("Create shop term error:", error);
        return { success: false, error: error.message || "Failed to create term." };
    }
}

/**
 * Updates an existing term in the shop's library.
 */
export async function updateShopTerm(input: {
    id: string;
    shopId: string;
    shopSlug?: string;
    title: string;
    content: string;
    isDefaultInvoice?: boolean;
    isDefaultCatalog?: boolean;
}) {
    try {
        if (!input.title || input.title.trim() === "") {
            return { success: false, error: "Term title is required." };
        }
        if (!input.content || input.content.trim() === "") {
            return { success: false, error: "Term clause text is required." };
        }

        const [updated] = await db
            .update(shopTerms)
            .set({
                title: input.title.trim(),
                content: input.content.trim(),
                isDefaultInvoice: input.isDefaultInvoice ?? false,
                isDefaultCatalog: input.isDefaultCatalog ?? false,
            })
            .where(and(eq(shopTerms.id, input.id), eq(shopTerms.shopId, input.shopId)))
            .returning();

        if (input.shopSlug) {
            revalidatePath(`/workspaces/${input.shopSlug}/settings`);
            revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
        }

        return { success: true, term: updated };
    } catch (error: any) {
        console.error("Update shop term error:", error);
        return { success: false, error: error.message || "Failed to update term." };
    }
}

/**
 * Deletes a term from the shop's library.
 */
export async function deleteShopTerm(input: { id: string; shopId: string; shopSlug?: string }) {
    try {
        await db
            .delete(shopTerms)
            .where(and(eq(shopTerms.id, input.id), eq(shopTerms.shopId, input.shopId)));

        if (input.shopSlug) {
            revalidatePath(`/workspaces/${input.shopSlug}/settings`);
            revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Delete shop term error:", error);
        return { success: false, error: error.message || "Failed to delete term." };
    }
}

/**
 * Seeds standard Kenyan SME commercial preset terms into a shop.
 */
export async function seedDefaultShopTerms(shopId: string, shopSlug?: string) {
    try {
        const presets = [
            {
                title: "100% Upfront Payment",
                content: "100% advance payment is required before order processing, fabrication, and dispatch.",
                isDefaultInvoice: false,
                isDefaultCatalog: true, // Ideal for public catalog & unknown leads
                displayOrder: 1,
            },
            {
                title: "Payment on Delivery (COD)",
                content: "Full payment is due immediately upon physical delivery and inspection of goods.",
                isDefaultInvoice: true,
                isDefaultCatalog: false,
                displayOrder: 2,
            },
            {
                title: "50% Advance / 50% Balance on Delivery",
                content: "50% non-refundable commitment deposit upon order confirmation; remaining 50% balance payable upon delivery.",
                isDefaultInvoice: false,
                isDefaultCatalog: false,
                displayOrder: 3,
            },
            {
                title: "Quotation 14-Day Price Validity",
                content: "This quotation is strictly valid for 14 calendar days from the date of issue. Prices may be subject to revision thereafter.",
                isDefaultInvoice: true,
                isDefaultCatalog: true,
                displayOrder: 4,
            },
            {
                title: "Net 30 Days Credit Settlement",
                content: "Payment is due within 30 calendar days from the invoice issue date. A 2% monthly financing surcharge applies to overdue accounts.",
                isDefaultInvoice: false,
                isDefaultCatalog: false,
                displayOrder: 5,
            },
            {
                title: "Return & Defective Goods Policy",
                content: "Goods once sold are non-refundable unless damaged or defective upon arrival and reported in writing within 48 hours.",
                isDefaultInvoice: false,
                isDefaultCatalog: false,
                displayOrder: 6,
            },
        ];

        for (const p of presets) {
            await db.insert(shopTerms).values({
                shopId,
                title: p.title,
                content: p.content,
                isDefaultInvoice: p.isDefaultInvoice,
                isDefaultCatalog: p.isDefaultCatalog,
                displayOrder: p.displayOrder,
            });
        }

        if (shopSlug) {
            revalidatePath(`/workspaces/${shopSlug}/settings`);
            revalidatePath(`/workspaces/${shopSlug}/documents/new`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Seed shop terms error:", error);
        return { success: false, error: error.message || "Failed to seed preset terms." };
    }
}
