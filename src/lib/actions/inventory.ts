// src/lib/actions/inventory.ts
"use server";

import { db } from "@/db";
import {
    stockLocations,
    stockLedger,
    products,
    shops,
    users,
} from "@/db/schema";
import { eq, and, desc, sql, sum, gt } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

// ================================================================
// STOCK LOCATIONS
// ================================================================

export async function getStockLocations(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    return await db.query.stockLocations.findMany({
        where: and(
            eq(stockLocations.shopId, shopId),
            eq(stockLocations.isActive, true)
        ),
        orderBy: [desc(stockLocations.isDefault), desc(stockLocations.createdAt)],
    });
}

export async function createStockLocation(formData: {
    shopId: string;
    shopSlug: string;
    name: string;
    code?: string;
    isDefault?: boolean;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // If this is the first location or isDefault requested, clear other defaults
        if (formData.isDefault) {
            await db
                .update(stockLocations)
                .set({ isDefault: false })
                .where(eq(stockLocations.shopId, formData.shopId));
        }

        // Check if this is the very first location — auto-set as default
        const existingCount = await db.$count(
            stockLocations,
            eq(stockLocations.shopId, formData.shopId)
        );
        const shouldBeDefault = formData.isDefault || existingCount === 0;

        const [location] = await db.insert(stockLocations).values({
            shopId: formData.shopId,
            name: formData.name.trim(),
            code: formData.code?.trim().toUpperCase() || null,
            isDefault: shouldBeDefault,
        }).returning();

        revalidatePath(`/workspaces/${formData.shopSlug}/inventory`);
        return { success: true, location };
    } catch (error: any) {
        console.error("Failed to create stock location:", error);
        return { success: false, error: error.message || "Failed to create location." };
    }
}

export async function updateStockLocation(formData: {
    locationId: string;
    shopId: string;
    shopSlug: string;
    name: string;
    code?: string;
    isDefault?: boolean;
    isActive?: boolean;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        if (formData.isDefault) {
            await db
                .update(stockLocations)
                .set({ isDefault: false })
                .where(eq(stockLocations.shopId, formData.shopId));
        }

        await db
            .update(stockLocations)
            .set({
                name: formData.name.trim(),
                code: formData.code?.trim().toUpperCase() || null,
                isDefault: formData.isDefault ?? false,
                isActive: formData.isActive ?? true,
            })
            .where(eq(stockLocations.id, formData.locationId));

        revalidatePath(`/workspaces/${formData.shopSlug}/inventory/locations`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update location." };
    }
}

export async function deleteStockLocation(locationId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // Check for existing ledger entries
        const hasEntries = await db.query.stockLedger.findFirst({
            where: eq(stockLedger.locationId, locationId),
        });
        if (hasEntries) {
            return { success: false, error: "Cannot delete a location that has stock ledger history. Archive it instead." };
        }

        await db.delete(stockLocations).where(eq(stockLocations.id, locationId));
        revalidatePath(`/workspaces/${shopSlug}/inventory/locations`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete location." };
    }
}

// ================================================================
// STOCK ADJUSTMENTS
// ================================================================

export type AdjustmentDirection = "IN" | "OUT";

export async function recordStockAdjustment(formData: {
    shopId: string;
    shopSlug: string;
    productId: string;
    locationId: string;
    direction: AdjustmentDirection;
    quantity: number;
    unitCost?: number;
    reason: "DAMAGED" | "EXPIRED" | "THEFT" | "COUNT_CORRECTION" | "PROMOTION" | "OTHER";
    notes?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const product = await db.query.products.findFirst({
            where: and(
                eq(products.id, formData.productId),
                eq(products.shopId, formData.shopId)
            ),
        });
        if (!product) return { success: false, error: "Product not found." };

        const movementType = formData.direction === "IN" ? "ADJUSTMENT_IN" as const : "ADJUSTMENT_OUT" as const;

        // Compute new stockQuantity
        const currentStock = parseFloat(product.stockQuantity || "0");
        const qty = Math.abs(formData.quantity);
        const newStock = formData.direction === "IN"
            ? currentStock + qty
            : Math.max(0, currentStock - qty);

        await db.transaction(async (tx) => {
            // 1. Write immutable ledger entry
            await tx.insert(stockLedger).values({
                shopId: formData.shopId,
                productId: formData.productId,
                locationId: formData.locationId,
                movementType,
                quantity: qty.toString(),
                unitCost: (formData.unitCost ?? 0).toString(),
                runningBalance: newStock.toString(),
                adjustmentReason: formData.reason,
                notes: formData.notes || null,
                createdById: session.userId,
            });

            // 2. Update cached stock quantity on products table
            await tx
                .update(products)
                .set({ stockQuantity: newStock.toString() })
                .where(eq(products.id, formData.productId));
        });

        revalidatePath(`/workspaces/${formData.shopSlug}/inventory`);
        revalidatePath(`/workspaces/${formData.shopSlug}/products`);
        return { success: true, newStock };
    } catch (error: any) {
        console.error("Stock adjustment failed:", error);
        return { success: false, error: error.message || "Adjustment failed." };
    }
}

export async function recordOpeningBalance(formData: {
    shopId: string;
    shopSlug: string;
    productId: string;
    locationId: string;
    quantity: number;
    unitCost: number;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.transaction(async (tx) => {
            await tx.insert(stockLedger).values({
                shopId: formData.shopId,
                productId: formData.productId,
                locationId: formData.locationId,
                movementType: "OPENING_BALANCE",
                quantity: formData.quantity.toString(),
                unitCost: formData.unitCost.toString(),
                runningBalance: formData.quantity.toString(),
                createdById: session.userId,
            });

            await tx
                .update(products)
                .set({ stockQuantity: formData.quantity.toString() })
                .where(eq(products.id, formData.productId));
        });

        revalidatePath(`/workspaces/${formData.shopSlug}/inventory`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to record opening balance." };
    }
}

// ================================================================
// STOCK LEDGER QUERIES
// ================================================================

export async function getStockLedger(
    shopId: string,
    options?: {
        productId?: string;
        locationId?: string;
        limit?: number;
    }
) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    const conditions = [eq(stockLedger.shopId, shopId)];
    if (options?.productId) conditions.push(eq(stockLedger.productId, options.productId));
    if (options?.locationId) conditions.push(eq(stockLedger.locationId, options.locationId));

    return await db.query.stockLedger.findMany({
        where: and(...conditions),
        with: {
            product: true,
            location: true,
            createdBy: true,
            sourceDocument: true,
        },
        orderBy: [desc(stockLedger.createdAt)],
        limit: options?.limit || 200,
    });
}

// ================================================================
// STOCK VALUATION (FIFO)
// ================================================================

export interface StockValuationRow {
    productId: string;
    productName: string;
    sku: string | null;
    locationName: string;
    locationId: string;
    currentQty: number;
    avgUnitCost: number;
    totalValue: number;
    reorderThreshold: number;
    isLowStock: boolean;
}

export async function getStockValuation(shopId: string): Promise<StockValuationRow[]> {
    const session = await verifyAndGetSession();
    if (!session) return [];

    // Get all tracked products
    const trackedProducts = await db.query.products.findMany({
        where: and(
            eq(products.shopId, shopId),
            eq(products.trackStock, true)
        ),
        with: {
            defaultLocation: true,
        },
    });

    const locations = await db.query.stockLocations.findMany({
        where: eq(stockLocations.shopId, shopId),
    });

    const defaultLoc = locations.find(l => l.isDefault) || locations[0];

    const rows: StockValuationRow[] = [];

    for (const product of trackedProducts) {
        // FIFO: get all INFLOW entries in chronological order
        const ledgerEntries = await db.query.stockLedger.findMany({
            where: and(
                eq(stockLedger.shopId, shopId),
                eq(stockLedger.productId, product.id),
            ),
            orderBy: [desc(stockLedger.createdAt)],
        });

        const currentQty = parseFloat(product.stockQuantity || "0");

        // Weighted average cost from recent purchase/opening entries for display
        const costEntries = ledgerEntries.filter(e =>
            e.movementType === "PURCHASE_RECEIPT" ||
            e.movementType === "OPENING_BALANCE" ||
            e.movementType === "ADJUSTMENT_IN"
        );
        const totalCostQty = costEntries.reduce((sum, e) => sum + parseFloat(e.quantity), 0);
        const totalCostValue = costEntries.reduce((sum, e) => sum + parseFloat(e.quantity) * parseFloat(e.unitCost), 0);
        const avgUnitCost = totalCostQty > 0 ? totalCostValue / totalCostQty : parseFloat(product.costPrice || "0");
        const totalValue = currentQty * avgUnitCost;
        const reorderThreshold = parseFloat(product.reorderThreshold || "5");

        // Group by location (simplified: use default location or product's default)
        const locationForProduct = product.defaultLocation || defaultLoc;
        const locationName = locationForProduct?.name || "Default";
        const locationId = locationForProduct?.id || "";

        rows.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            locationName,
            locationId,
            currentQty,
            avgUnitCost,
            totalValue,
            reorderThreshold,
            isLowStock: currentQty <= reorderThreshold,
        });
    }

    return rows.sort((a, b) => b.totalValue - a.totalValue);
}

// ================================================================
// INVENTORY OVERVIEW / DASHBOARD SUMMARY
// ================================================================

export interface InventoryOverviewData {
    totalProducts: number;
    totalTrackedProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalLocations: number;
    recentMovements: any[];
}

export async function getInventoryOverview(shopId: string): Promise<InventoryOverviewData> {
    const session = await verifyAndGetSession();
    if (!session) return {
        totalProducts: 0, totalTrackedProducts: 0, totalStockValue: 0,
        lowStockCount: 0, outOfStockCount: 0, totalLocations: 0, recentMovements: []
    };

    const [allProducts, locationCount, recentMovements] = await Promise.all([
        db.query.products.findMany({
            where: eq(products.shopId, shopId),
        }),
        db.$count(stockLocations, and(
            eq(stockLocations.shopId, shopId),
            eq(stockLocations.isActive, true)
        )),
        db.query.stockLedger.findMany({
            where: eq(stockLedger.shopId, shopId),
            with: { product: true, location: true, createdBy: true },
            orderBy: [desc(stockLedger.createdAt)],
            limit: 10,
        }),
    ]);

    const trackedProducts = allProducts.filter(p => p.trackStock);
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of trackedProducts) {
        const qty = parseFloat(p.stockQuantity || "0");
        const cost = parseFloat(p.costPrice || "0");
        totalStockValue += qty * cost;

        const threshold = parseFloat(p.reorderThreshold || "5");
        if (qty <= 0) outOfStockCount++;
        else if (qty <= threshold) lowStockCount++;
    }

    return {
        totalProducts: allProducts.length,
        totalTrackedProducts: trackedProducts.length,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
        totalLocations: locationCount,
        recentMovements,
    };
}

// ================================================================
// LOW STOCK ALERTS
// ================================================================

export async function getLowStockProducts(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    const trackedProducts = await db.query.products.findMany({
        where: and(
            eq(products.shopId, shopId),
            eq(products.trackStock, true)
        ),
    });

    return trackedProducts
        .filter(p => parseFloat(p.stockQuantity || "0") <= parseFloat(p.reorderThreshold || "5"))
        .sort((a, b) => parseFloat(a.stockQuantity) - parseFloat(b.stockQuantity));
}

// ================================================================
// ABC ANALYSIS
// ================================================================

export interface AbcProduct {
    productId: string;
    name: string;
    sku: string | null;
    totalRevenue: number;
    revenueShare: number;
    cumulativeShare: number;
    tier: "A" | "B" | "C";
}

export async function getAbcAnalysis(shopId: string): Promise<AbcProduct[]> {
    const session = await verifyAndGetSession();
    if (!session) return [];

    // Get all SALE ledger entries for revenue calculation
    const salesEntries = await db.query.stockLedger.findMany({
        where: and(
            eq(stockLedger.shopId, shopId),
            eq(stockLedger.movementType, "SALE")
        ),
        with: { product: true },
    });

    // Group by product
    const revenueMap = new Map<string, { name: string; sku: string | null; revenue: number }>();
    for (const entry of salesEntries) {
        if (!entry.product) continue;
        const existing = revenueMap.get(entry.productId) || { name: entry.product.name, sku: entry.product.sku, revenue: 0 };
        // Revenue = qty * unit price from product (or use unitCost as proxy for sales entries)
        existing.revenue += parseFloat(entry.quantity) * parseFloat(entry.unitCost || "0");
        revenueMap.set(entry.productId, existing);
    }

    const totalRevenue = Array.from(revenueMap.values()).reduce((s, p) => s + p.revenue, 0);
    if (totalRevenue === 0) return [];

    const sorted = Array.from(revenueMap.entries())
        .map(([id, data]) => ({
            productId: id,
            name: data.name,
            sku: data.sku,
            totalRevenue: data.revenue,
            revenueShare: (data.revenue / totalRevenue) * 100,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

    let cumulative = 0;
    return sorted.map(p => {
        cumulative += p.revenueShare;
        return {
            ...p,
            cumulativeShare: cumulative,
            tier: cumulative <= 70 ? "A" : cumulative <= 90 ? "B" : "C",
        };
    });
}
