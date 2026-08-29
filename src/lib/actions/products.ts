"use server";

import { db } from "@/db";
import { products, stockLocations, stockLedger, productLocationStock } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";

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
    /** The location to post the opening balance to. Omit to auto-resolve/create. */
    locationId?: string;
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
 * Resolves the target stock location for a shop:
 * 1. Uses the provided locationId if given.
 * 2. Falls back to the shop's default location.
 * 3. Falls back to any active location.
 * 4. Auto-creates a "General Store" location if none exist.
 */
async function resolveOrCreateLocation(shopId: string, locationId?: string) {
    if (locationId) {
        const loc = await db.query.stockLocations.findFirst({
            where: and(eq(stockLocations.id, locationId), eq(stockLocations.shopId, shopId)),
        });
        if (loc) return loc;
    }

    // Try default
    const defaultLoc = await db.query.stockLocations.findFirst({
        where: and(eq(stockLocations.shopId, shopId), eq(stockLocations.isDefault, true)),
    });
    if (defaultLoc) return defaultLoc;

    // Try any active
    const anyLoc = await db.query.stockLocations.findFirst({
        where: and(eq(stockLocations.shopId, shopId), eq(stockLocations.isActive, true)),
    });
    if (anyLoc) return anyLoc;

    // Auto-create "General Store"
    const [newLoc] = await db.insert(stockLocations).values({
        shopId,
        name: "General Store",
        code: "MAIN",
        isDefault: true,
    }).returning();
    return newLoc;
}

/**
 * Persists a new item profile inside the shop's lookup catalog.
 * If trackStock is enabled and openingStock > 0, writes an OPENING_BALANCE
 * ledger entry and sets defaultLocationId on the product.
 */
export async function createProductItem(input: CreateProductInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const finalSku = input.sku?.trim() || generateAutoSku(input.name);
        const isService = input.itemType === "SERVICE";
        const shouldTrack = isService ? false : (input.trackStock || false);
        const openingQty = shouldTrack ? (input.stockQuantity || 0) : 0;

        return await db.transaction(async (tx) => {
            // Resolve location before product insert (may auto-create General Store)
            let resolvedLocationId: string | undefined;
            if (shouldTrack) {
                const loc = await resolveOrCreateLocation(input.shopId, input.locationId);
                resolvedLocationId = loc.id;
            }

            const [newProduct] = await tx.insert(products).values({
                shopId: input.shopId,
                name: input.name.trim(),
                sku: finalSku,
                itemType: input.itemType || "PRODUCT",
                unitPrice: input.unitPrice.toString(),
                costPrice: (input.costPrice || 0).toString(),
                defaultTaxType: input.defaultTaxType,
                trackStock: shouldTrack,
                stockQuantity: openingQty.toString(),
                reorderThreshold: (input.reorderThreshold ?? 5).toString(),
                defaultLocationId: resolvedLocationId || null,
            }).returning();

            // Write OPENING_BALANCE ledger entry + upsert junction table if tracking
            if (shouldTrack && resolvedLocationId && openingQty > 0) {
                await tx.insert(stockLedger).values({
                    shopId: input.shopId,
                    productId: newProduct.id,
                    locationId: resolvedLocationId,
                    movementType: "OPENING_BALANCE",
                    quantity: openingQty.toString(),
                    unitCost: (input.costPrice || 0).toString(),
                    runningBalance: openingQty.toString(),
                    notes: "Opening balance set on product creation",
                    createdById: session.userId,
                });

                await tx.insert(productLocationStock).values({
                    shopId: input.shopId,
                    productId: newProduct.id,
                    locationId: resolvedLocationId,
                    quantity: openingQty.toString(),
                }).onConflictDoUpdate({
                    target: [productLocationStock.productId, productLocationStock.locationId],
                    set: { quantity: openingQty.toString(), updatedAt: new Date() },
                });
            }

            return { success: true, productId: newProduct.id };
        });
    } catch (error) {
        console.error("Failed to register catalog item:", error);
        return { success: false, error: "Failed to save product information to the database." };
    } finally {
        revalidatePath(`/workspaces/${input.shopSlug}/products`);
        revalidatePath(`/workspaces/${input.shopSlug}/inventory`);
    }
}

interface UpdateProductInput extends Partial<CreateProductInput> {
    id: string;
    shopId: string;
    shopSlug: string;
}

/**
 * Modifies product criteria while respecting multi-tenant borders.
 * If trackStock is being enabled for the first time, writes an OPENING_BALANCE
 * ledger entry to activate the product in the ledger system.
 */
export async function updateProductItem({ id, shopId, shopSlug, ...updates }: UpdateProductInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const existing = await db.query.products.findFirst({
            where: and(eq(products.id, id), eq(products.shopId, shopId)),
        });

        if (!existing) {
            return { success: false, error: "Catalog item not found or unauthorized access." };
        }

        const isService = updates.itemType === "SERVICE";
        const newTrackStock = isService ? false : (updates.trackStock !== undefined ? updates.trackStock : existing.trackStock);
        const wasAlreadyTracking = existing.trackStock;

        return await db.transaction(async (tx) => {
            let resolvedLocationId: string | undefined = existing.defaultLocationId || undefined;

            // If trackStock is being switched ON for the first time, wire it to a location
            const trackingJustEnabled = newTrackStock && !wasAlreadyTracking;
            if (trackingJustEnabled) {
                const loc = await resolveOrCreateLocation(shopId, updates.locationId);
                resolvedLocationId = loc.id;
            }

            await tx.update(products)
                .set({
                    name: updates.name?.trim(),
                    sku: updates.sku?.trim(),
                    itemType: updates.itemType,
                    unitPrice: updates.unitPrice !== undefined ? updates.unitPrice.toString() : undefined,
                    costPrice: updates.costPrice !== undefined ? updates.costPrice.toString() : undefined,
                    defaultTaxType: updates.defaultTaxType,
                    trackStock: newTrackStock,
                    stockQuantity: updates.stockQuantity !== undefined ? updates.stockQuantity.toString() : undefined,
                    reorderThreshold: updates.reorderThreshold !== undefined ? updates.reorderThreshold.toString() : undefined,
                    defaultLocationId: resolvedLocationId || existing.defaultLocationId,
                })
                .where(and(eq(products.id, id), eq(products.shopId, shopId)));

            // Write OPENING_BALANCE if tracking was just enabled and there's stock to record
            if (trackingJustEnabled && resolvedLocationId) {
                const openingQty = updates.stockQuantity ?? parseFloat(existing.stockQuantity || "0");
                if (openingQty > 0) {
                    const costPrice = updates.costPrice ?? parseFloat(existing.costPrice || "0");
                    await tx.insert(stockLedger).values({
                        shopId,
                        productId: id,
                        locationId: resolvedLocationId,
                        movementType: "OPENING_BALANCE",
                        quantity: openingQty.toString(),
                        unitCost: costPrice.toString(),
                        runningBalance: openingQty.toString(),
                        notes: "Opening balance set when inventory tracking was enabled",
                        createdById: session.userId,
                    });

                    await tx.insert(productLocationStock).values({
                        shopId,
                        productId: id,
                        locationId: resolvedLocationId,
                        quantity: openingQty.toString(),
                    }).onConflictDoUpdate({
                        target: [productLocationStock.productId, productLocationStock.locationId],
                        set: { quantity: openingQty.toString(), updatedAt: new Date() },
                    });
                }
            }

            return { success: true };
        });
    } catch (error) {
        console.error("Failed to update product entry:", error);
        return { success: false, error: "Failed to persist product alterations." };
    } finally {
        revalidatePath(`/workspaces/${shopSlug}/products`);
        revalidatePath(`/workspaces/${shopSlug}/inventory`);
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
 * Bulk insert catalog items for rapid provisioning.
 * For tracked items, resolves/creates a default location and writes opening balances.
 */
export async function createBulkProducts(input: BulkCreateProductInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        if (!input.items || input.items.length === 0) {
            return { success: false, error: "No items provided for bulk insert." };
        }

        // Pre-resolve default location once for all tracked items
        const hasTrackedItems = input.items.some(i => i.itemType !== "SERVICE" && i.trackStock);
        let defaultLocation: { id: string } | undefined;
        if (hasTrackedItems) {
            defaultLocation = await resolveOrCreateLocation(input.shopId);
        }

        return await db.transaction(async (tx) => {
            let count = 0;
            for (const item of input.items) {
                const finalSku = item.sku?.trim() || generateAutoSku(item.name);
                const isService = item.itemType === "SERVICE";
                const shouldTrack = isService ? false : (item.trackStock || false);
                const openingQty = shouldTrack ? (item.stockQuantity || 0) : 0;

                const [newProduct] = await tx.insert(products).values({
                    shopId: input.shopId,
                    name: item.name.trim(),
                    sku: finalSku,
                    itemType: item.itemType || "PRODUCT",
                    unitPrice: item.unitPrice.toString(),
                    costPrice: (item.costPrice || 0).toString(),
                    defaultTaxType: item.defaultTaxType,
                    trackStock: shouldTrack,
                    stockQuantity: openingQty.toString(),
                    reorderThreshold: (item.reorderThreshold ?? 5).toString(),
                    defaultLocationId: (shouldTrack && defaultLocation) ? defaultLocation.id : null,
                }).returning();

                if (shouldTrack && defaultLocation && openingQty > 0) {
                    await tx.insert(stockLedger).values({
                        shopId: input.shopId,
                        productId: newProduct.id,
                        locationId: defaultLocation.id,
                        movementType: "OPENING_BALANCE",
                        quantity: openingQty.toString(),
                        unitCost: (item.costPrice || 0).toString(),
                        runningBalance: openingQty.toString(),
                        notes: "Opening balance set via bulk import",
                        createdById: session.userId,
                    });

                    await tx.insert(productLocationStock).values({
                        shopId: input.shopId,
                        productId: newProduct.id,
                        locationId: defaultLocation.id,
                        quantity: openingQty.toString(),
                    }).onConflictDoUpdate({
                        target: [productLocationStock.productId, productLocationStock.locationId],
                        set: { quantity: openingQty.toString(), updatedAt: new Date() },
                    });
                }
                count++;
            }
            return { success: true, count };
        });
    } catch (error) {
        console.error("Failed to execute bulk catalog insert:", error);
        return { success: false, error: "Failed to process bulk import. Check data formatting." };
    } finally {
        revalidatePath(`/workspaces/${input.shopSlug}/products`);
        revalidatePath(`/workspaces/${input.shopSlug}/inventory`);
    }
}