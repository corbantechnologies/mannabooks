"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateProductInput {
    shopId: string;
    shopSlug: string;
    name: string;
    sku?: string;
    unitPrice: number;
    defaultTaxType: "V_16" | "V_0" | "EXEMPT";
}

function generateAutoSku(name: string): string {
    const words = name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    let prefix = "";
    if (words.length >= 2) {
        prefix = `${words[0].slice(0, 3)}-${words[1].slice(0, 3)}`;
    } else if (words[0]) {
        prefix = words[0].slice(0, 4);
    } else {
        prefix = "ITEM";
    }
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomSuffix}`;
}

/**
 * Persists a new item profile inside the shop's lookup catalog.
 */
export async function createProductItem(input: CreateProductInput) {
    try {
        const finalSku = input.sku?.trim() || generateAutoSku(input.name);

        const [newProduct] = await db.insert(products).values({
            shopId: input.shopId,
            name: input.name.trim(),
            sku: finalSku,
            unitPrice: input.unitPrice.toString(), // Store as string to preserve precision with PostgreSQL numeric
            defaultTaxType: input.defaultTaxType,
        }).returning();

        revalidatePath(`/workspaces/${input.shopSlug}/products`);
        return { success: true, productId: newProduct.id };
    } catch (error) {
        console.error("Failed to register catalog item:", error);
        return { success: false, error: "Failed to save product information to the database." };
    }
}

interface UpdateProductInput extends Partial<CreateProductInput> {
    id: string;
    shopId: string;
    shopSlug: string;
}

/**
 * Modifies product criteria while respecting multi-tenant borders.
 */
export async function updateProductItem({ id, shopId, shopSlug, ...updates }: UpdateProductInput) {
    try {
        const existing = await db.query.products.findFirst({
            where: and(eq(products.id, id), eq(products.shopId, shopId)),
        });

        if (!existing) {
            return { success: false, error: "Catalog item not found or unauthorized access." };
        }

        await db.update(products)
            .set({
                name: updates.name?.trim(),
                sku: updates.sku?.trim(),
                unitPrice: updates.unitPrice !== undefined ? updates.unitPrice.toString() : undefined,
                defaultTaxType: updates.defaultTaxType,
            })
            .where(and(eq(products.id, id), eq(products.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/products`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update product entry:", error);
        return { success: false, error: "Failed to persist product alterations." };
    }
}