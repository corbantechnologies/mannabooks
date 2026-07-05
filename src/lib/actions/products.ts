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
    itemType?: "PRODUCT" | "SERVICE";
    unitPrice: number;
    costPrice?: number;
    defaultTaxType: "V_16" | "V_0" | "EXEMPT";
    trackStock?: boolean;
    stockQuantity?: number;
    reorderThreshold?: number;
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
        const isService = input.itemType === "SERVICE";

        const [newProduct] = await db.insert(products).values({
            shopId: input.shopId,
            name: input.name.trim(),
            sku: finalSku,
            itemType: input.itemType || "PRODUCT",
            unitPrice: input.unitPrice.toString(), // Store as string to preserve precision with PostgreSQL numeric
            costPrice: (input.costPrice || 0).toString(),
            defaultTaxType: input.defaultTaxType,
            trackStock: isService ? false : (input.trackStock || false),
            stockQuantity: (input.stockQuantity || 0).toString(),
            reorderThreshold: (input.reorderThreshold ?? 5).toString(),
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

        const isService = updates.itemType === "SERVICE";

        await db.update(products)
            .set({
                name: updates.name?.trim(),
                sku: updates.sku?.trim(),
                itemType: updates.itemType,
                unitPrice: updates.unitPrice !== undefined ? updates.unitPrice.toString() : undefined,
                costPrice: updates.costPrice !== undefined ? updates.costPrice.toString() : undefined,
                defaultTaxType: updates.defaultTaxType,
                trackStock: isService ? false : (updates.trackStock !== undefined ? updates.trackStock : undefined),
                stockQuantity: updates.stockQuantity !== undefined ? updates.stockQuantity.toString() : undefined,
                reorderThreshold: updates.reorderThreshold !== undefined ? updates.reorderThreshold.toString() : undefined,
            })
            .where(and(eq(products.id, id), eq(products.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/products`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update product entry:", error);
        return { success: false, error: "Failed to persist product alterations." };
    }
}

/**
 * Removes a product entry from the catalog repository.
 */
export async function deleteProductItem(id: string, shopId: string, shopSlug: string) {
    try {
        await db.delete(products)
            .where(and(eq(products.id, id), eq(products.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/products`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete product entry:", error);
        return { success: false, error: "Failed to delete product item." };
    }
}

interface BulkCreateProductInput {
    shopId: string;
    shopSlug: string;
    items: {
        name: string;
        sku?: string;
        itemType?: "PRODUCT" | "SERVICE";
        unitPrice: number;
        costPrice?: number;
        defaultTaxType: "V_16" | "V_0" | "EXEMPT";
        trackStock?: boolean;
        stockQuantity?: number;
        reorderThreshold?: number;
    }[];
}

/**
 * Bulk insert catalog items for rapid provisioning
 */
export async function createBulkProducts(input: BulkCreateProductInput) {
    try {
        if (!input.items || input.items.length === 0) {
             return { success: false, error: "No items provided for bulk insert." };
        }

        const compiledPayload = input.items.map(item => {
            const finalSku = item.sku?.trim() || generateAutoSku(item.name);
            const isService = item.itemType === "SERVICE";
            
            return {
                shopId: input.shopId,
                name: item.name.trim(),
                sku: finalSku,
                itemType: item.itemType || "PRODUCT",
                unitPrice: item.unitPrice.toString(),
                costPrice: (item.costPrice || 0).toString(),
                defaultTaxType: item.defaultTaxType,
                trackStock: isService ? false : (item.trackStock || false),
                stockQuantity: (item.stockQuantity || 0).toString(),
                reorderThreshold: (item.reorderThreshold ?? 5).toString(),
            };
        });

        await db.insert(products).values(compiledPayload);

        revalidatePath(`/workspaces/${input.shopSlug}/products`);
        return { success: true, count: compiledPayload.length };
    } catch (error) {
        console.error("Failed to execute bulk catalog insert:", error);
        return { success: false, error: "Failed to process bulk import. Check data formatting." };
    }
}