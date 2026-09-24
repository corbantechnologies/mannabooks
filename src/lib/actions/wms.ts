"use server";

import { db } from "@/db";
import {
    storageBins,
    productBatches,
    stockLocations,
    products,
    stockLedger,
    shops,
    productLocationStock,
} from "@/db/schema";
import { eq, and, desc, asc, lte, gt, sql } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. STORAGE BINS (SHELF HIERARCHY)
// ==========================================

export async function getStorageBins(shopId: string, locationId?: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    let conditions: any[] = [
        eq(storageBins.shopId, shopId),
        eq(storageBins.isActive, true),
    ];

    if (locationId) {
        conditions.push(eq(storageBins.locationId, locationId));
    }

    return await db.query.storageBins.findMany({
        where: and(...conditions),
        orderBy: [asc(storageBins.zone), asc(storageBins.binCode)],
        with: {
            location: true,
        },
    });
}

export async function createStorageBinAction(params: {
    shopId: string;
    locationId: string;
    zone: string;
    rack?: string;
    shelf?: string;
    binCode: string;
    description?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    try {
        await enforcePermission(params.shopId, "manage_products");

        const cleanCode = params.binCode.trim().toUpperCase();

        // Check if bin already exists in this location
        const existing = await db.query.storageBins.findFirst({
            where: and(
                eq(storageBins.shopId, params.shopId),
                eq(storageBins.locationId, params.locationId),
                eq(storageBins.binCode, cleanCode)
            ),
        });

        if (existing) {
            return { success: false, error: `A bin with code "${cleanCode}" already exists in this location.` };
        }

        const [bin] = await db.insert(storageBins).values({
            shopId: params.shopId,
            locationId: params.locationId,
            zone: params.zone.trim(),
            rack: params.rack?.trim() || null,
            shelf: params.shelf?.trim() || null,
            binCode: cleanCode,
            description: params.description?.trim() || null,
            isActive: true,
        }).returning();

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, params.shopId) });
        if (shop) revalidatePath(`/workspaces/${shop.slug}/inventory/bins`);

        return { success: true, bin };
    } catch (err: any) {
        console.error("Failed to create storage bin:", err);
        return { success: false, error: err.message || "Failed to create bin." };
    }
}

export async function deleteStorageBinAction(shopId: string, binId: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await enforcePermission(shopId, "manage_products");

        await db.update(storageBins)
            .set({ isActive: false })
            .where(and(eq(storageBins.id, binId), eq(storageBins.shopId, shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) revalidatePath(`/workspaces/${shop.slug}/inventory/bins`);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to archive bin." };
    }
}

// ==========================================
// 2. PRODUCT BATCHES & FEFO ENGINE
// ==========================================

export async function getProductBatches(shopId: string, filter?: { productId?: string; locationId?: string }) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    let conditions: any[] = [eq(productBatches.shopId, shopId)];

    if (filter?.productId) {
        conditions.push(eq(productBatches.productId, filter.productId));
    }
    if (filter?.locationId) {
        conditions.push(eq(productBatches.locationId, filter.locationId));
    }

    return await db.query.productBatches.findMany({
        where: and(...conditions),
        orderBy: [asc(productBatches.expiryDate)],
        with: {
            product: true,
            location: true,
            bin: true,
            supplier: true,
        },
    });
}

/**
 * FEFO Query: Returns batches for an item ordered by earliest expiration date first (First Expired, First Out)
 */
export async function getFefoBatchesForProduct(productId: string, locationId?: string) {
    let conditions: any[] = [
        eq(productBatches.productId, productId),
        gt(sql<number>`CAST(${productBatches.currentQuantity} AS NUMERIC)`, 0),
    ];

    if (locationId) {
        conditions.push(eq(productBatches.locationId, locationId));
    }

    return await db.query.productBatches.findMany({
        where: and(...conditions),
        orderBy: [asc(productBatches.expiryDate)],
        with: {
            location: true,
            bin: true,
        },
    });
}

export async function createProductBatchAction(params: {
    shopId: string;
    productId: string;
    locationId: string;
    binId?: string;
    batchNumber: string;
    manufactureDate?: string;
    expiryDate: string;
    quantity: number;
    costPrice: number;
    supplierId?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await enforcePermission(params.shopId, "manage_products");

        if (params.quantity <= 0) {
            return { success: false, error: "Batch quantity must be greater than zero." };
        }

        const [batch] = await db.insert(productBatches).values({
            shopId: params.shopId,
            productId: params.productId,
            locationId: params.locationId,
            binId: params.binId || null,
            batchNumber: params.batchNumber.trim().toUpperCase(),
            manufactureDate: params.manufactureDate || null,
            expiryDate: params.expiryDate,
            initialQuantity: String(params.quantity),
            currentQuantity: String(params.quantity),
            costPrice: String(params.costPrice),
            supplierId: params.supplierId || null,
        }).returning();

        // Atomically record in stock ledger and update product stock
        await db.insert(stockLedger).values({
            shopId: params.shopId,
            productId: params.productId,
            locationId: params.locationId,
            movementType: "OPENING_BALANCE",
            quantity: String(params.quantity),
            unitCost: String(params.costPrice),
            notes: `Batch ${batch.batchNumber} created (Exp: ${params.expiryDate}) [Batch ID: ${batch.id}]`,
            createdById: session.userId,
        });

        // Update product denormalized stockQuantity
        await db.update(products).set({
            stockQuantity: sql`CAST(COALESCE(${products.stockQuantity}, 0) AS NUMERIC) + ${params.quantity}`,
        }).where(eq(products.id, params.productId));

        // Upsert productLocationStock
        const existingLocStock = await db.query.productLocationStock.findFirst({
            where: and(
                eq(productLocationStock.productId, params.productId),
                eq(productLocationStock.locationId, params.locationId)
            )
        });
        if (existingLocStock) {
            await db.update(productLocationStock).set({
                quantity: sql`CAST(COALESCE(${productLocationStock.quantity}, 0) AS NUMERIC) + ${params.quantity}`,
                updatedAt: new Date(),
            }).where(eq(productLocationStock.id, existingLocStock.id));
        } else {
            await db.insert(productLocationStock).values({
                shopId: params.shopId,
                productId: params.productId,
                locationId: params.locationId,
                quantity: String(params.quantity),
            });
        }

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, params.shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/inventory`);
            revalidatePath(`/workspaces/${shop.slug}/inventory/reports/expiry`);
        }

        return { success: true, batch };
    } catch (err: any) {
        console.error("Failed to create product batch:", err);
        return { success: false, error: err.message || "Failed to create batch." };
    }
}

/**
 * Expiry Risk Report: Segregates inventory into <30d, 31-60d, 61-90d risk tiers
 */
export async function getExpiryRiskReport(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return { critical: [], warning: [], notice: [], totalAtRiskKes: 0 };

    const batches = await db.query.productBatches.findMany({
        where: and(
            eq(productBatches.shopId, shopId),
            gt(sql<number>`CAST(${productBatches.currentQuantity} AS NUMERIC)`, 0)
        ),
        orderBy: [asc(productBatches.expiryDate)],
        with: {
            product: true,
            location: true,
            bin: true,
        },
    });

    const now = new Date();
    const d30 = new Date();
    d30.setDate(now.getDate() + 30);
    const d60 = new Date();
    d60.setDate(now.getDate() + 60);
    const d90 = new Date();
    d90.setDate(now.getDate() + 90);

    const critical: any[] = [];
    const warning: any[] = [];
    const notice: any[] = [];
    let totalAtRiskKes = 0;

    for (const b of batches) {
        const exp = new Date(b.expiryDate);
        const qty = parseFloat(b.currentQuantity || "0");
        const cost = parseFloat(b.costPrice || "0");
        const val = qty * cost;

        const row = {
            ...b,
            quantityNum: qty,
            totalValueKes: val,
            daysUntilExpiry: Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        };

        if (exp <= d30) {
            critical.push(row);
            totalAtRiskKes += val;
        } else if (exp <= d60) {
            warning.push(row);
            totalAtRiskKes += val;
        } else if (exp <= d90) {
            notice.push(row);
            totalAtRiskKes += val;
        }
    }

    return {
        critical,
        warning,
        notice,
        totalAtRiskKes,
    };
}
