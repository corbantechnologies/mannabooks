// src/lib/actions/inventory.ts
"use server";

import { db } from "@/db";
import {
    stockLocations,
    stockLedger,
    products,
    shops,
    productLocationStock,
    stockTransfers,
} from "@/db/schema";
import { eq, and, or, desc, sql, sum, gt, isNull } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { assertCanAddLocation } from "@/lib/paywall";
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

export async function getStockLocationsWithStats(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    const locations = await db.query.stockLocations.findMany({
        where: and(
            eq(stockLocations.shopId, shopId),
            eq(stockLocations.isActive, true)
        ),
        orderBy: [desc(stockLocations.isDefault), desc(stockLocations.createdAt)],
    });

    const [locStocks, allProducts] = await Promise.all([
        db.query.productLocationStock.findMany({
            where: eq(productLocationStock.shopId, shopId),
            with: { product: true },
        }),
        db.query.products.findMany({
            where: and(eq(products.shopId, shopId), eq(products.trackStock, true)),
        }),
    ]);

    return locations.map((loc) => {
        const rows = locStocks.filter((s) => s.locationId === loc.id && s.product);
        const productIdsWithJunction = new Set(rows.map((r) => r.productId));

        const legacyProducts = allProducts.filter(
            (p) => p.defaultLocationId === loc.id && !productIdsWithJunction.has(p.id)
        );

        let totalProducts = rows.length + legacyProducts.length;
        let totalUnits = 0;
        let totalValuation = 0;
        let lowStockCount = 0;

        for (const row of rows) {
            const qty = parseFloat(row.quantity || "0");
            const cost = parseFloat(row.product.costPrice || "0");
            const threshold = parseFloat(row.product.reorderThreshold || "5");
            totalUnits += qty;
            totalValuation += qty * cost;
            if (qty <= threshold) lowStockCount++;
        }

        for (const lp of legacyProducts) {
            const qty = parseFloat(lp.stockQuantity || "0");
            const cost = parseFloat(lp.costPrice || "0");
            const threshold = parseFloat(lp.reorderThreshold || "5");
            totalUnits += qty;
            totalValuation += qty * cost;
            if (qty <= threshold) lowStockCount++;
        }

        return {
            ...loc,
            totalProducts,
            totalUnits,
            totalValuation,
            lowStockCount,
        };
    });
}

export async function getStockLocationDetail(shopId: string, locationId: string) {
    const session = await verifyAndGetSession();
    if (!session) return null;

    const location = await db.query.stockLocations.findFirst({
        where: and(
            eq(stockLocations.id, locationId),
            eq(stockLocations.shopId, shopId)
        ),
    });

    if (!location) return null;

    const [locStocks, allTrackedProducts, recentMovements, transfers] = await Promise.all([
        db.query.productLocationStock.findMany({
            where: and(
                eq(productLocationStock.shopId, shopId),
                eq(productLocationStock.locationId, locationId)
            ),
            with: { product: true },
        }),
        db.query.products.findMany({
            where: and(eq(products.shopId, shopId), eq(products.trackStock, true)),
        }),
        db.query.stockLedger.findMany({
            where: and(
                eq(stockLedger.shopId, shopId),
                eq(stockLedger.locationId, locationId)
            ),
            with: { product: true, createdBy: true, sourceDocument: true },
            orderBy: [desc(stockLedger.createdAt)],
            limit: 100,
        }),
        db.query.stockTransfers.findMany({
            where: and(
                eq(stockTransfers.shopId, shopId),
                or(
                    eq(stockTransfers.fromLocationId, locationId),
                    eq(stockTransfers.toLocationId, locationId)
                )
            ),
            with: {
                fromLocation: true,
                toLocation: true,
                requestedBy: true,
                items: { with: { product: true } },
            },
            orderBy: [desc(stockTransfers.createdAt)],
            limit: 30,
        }),
    ]);

    const productIdsInJunction = new Set(locStocks.map(s => s.productId));
    const items: Array<{
        productId: string;
        name: string;
        sku: string | null;
        unitPrice: number;
        costPrice: number;
        quantity: number;
        reorderThreshold: number;
        totalValue: number;
        isLowStock: boolean;
        isOutOfStock: boolean;
    }> = [];

    for (const row of locStocks) {
        if (!row.product) continue;
        const qty = parseFloat(row.quantity || "0");
        const cost = parseFloat(row.product.costPrice || "0");
        const threshold = parseFloat(row.product.reorderThreshold || "5");
        items.push({
            productId: row.productId,
            name: row.product.name,
            sku: row.product.sku,
            unitPrice: parseFloat(row.product.unitPrice || "0"),
            costPrice: cost,
            quantity: qty,
            reorderThreshold: threshold,
            totalValue: qty * cost,
            isLowStock: qty > 0 && qty <= threshold,
            isOutOfStock: qty <= 0,
        });
    }

    for (const p of allTrackedProducts) {
        if (p.defaultLocationId === locationId && !productIdsInJunction.has(p.id)) {
            const qty = parseFloat(p.stockQuantity || "0");
            const cost = parseFloat(p.costPrice || "0");
            const threshold = parseFloat(p.reorderThreshold || "5");
            items.push({
                productId: p.id,
                name: p.name,
                sku: p.sku,
                unitPrice: parseFloat(p.unitPrice || "0"),
                costPrice: cost,
                quantity: qty,
                reorderThreshold: threshold,
                totalValue: qty * cost,
                isLowStock: qty > 0 && qty <= threshold,
                isOutOfStock: qty <= 0,
            });
        }
    }

    items.sort((a, b) => b.totalValue - a.totalValue);

    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValuation = items.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockCount = items.filter(item => item.isLowStock).length;
    const outOfStockCount = items.filter(item => item.isOutOfStock).length;

    return {
        location,
        metrics: {
            totalProducts: items.length,
            totalUnits,
            totalValuation,
            lowStockCount,
            outOfStockCount,
            movementsCount: recentMovements.length,
            transfersCount: transfers.length,
        },
        items,
        recentMovements,
        transfers,
    };
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
        await assertCanAddLocation(formData.shopId);

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

            // 3. Upsert per-location quantity in junction table
            const locationQtyDelta = formData.direction === "IN" ? qty : -qty;
            await tx
                .insert(productLocationStock)
                .values({
                    shopId: formData.shopId,
                    productId: formData.productId,
                    locationId: formData.locationId,
                    quantity: Math.max(0, locationQtyDelta).toString(),
                })
                .onConflictDoUpdate({
                    target: [productLocationStock.productId, productLocationStock.locationId],
                    set: {
                        quantity: sql`GREATEST(0, ${productLocationStock.quantity} + ${locationQtyDelta})`,
                        updatedAt: new Date(),
                    },
                });
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

            // Upsert per-location quantity
            await tx
                .insert(productLocationStock)
                .values({
                    shopId: formData.shopId,
                    productId: formData.productId,
                    locationId: formData.locationId,
                    quantity: formData.quantity.toString(),
                })
                .onConflictDoUpdate({
                    target: [productLocationStock.productId, productLocationStock.locationId],
                    set: {
                        quantity: formData.quantity.toString(),
                        updatedAt: new Date(),
                    },
                });
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

// ================================================================
// CATALOG TO LEDGER OPENING BALANCE MIGRATION
// ================================================================

export async function migrateCatalogToStockLedger(shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // 1. Get or create a default stock location
        let defaultLocation = await db.query.stockLocations.findFirst({
            where: and(
                eq(stockLocations.shopId, shopId),
                eq(stockLocations.isDefault, true)
            )
        });

        if (!defaultLocation) {
            defaultLocation = await db.query.stockLocations.findFirst({
                where: eq(stockLocations.shopId, shopId)
            });
            
            if (!defaultLocation) {
                const [newLoc] = await db.insert(stockLocations).values({
                    shopId,
                    name: "Main Store",
                    code: "MAIN",
                    isDefault: true,
                }).returning();
                defaultLocation = newLoc;
            }
        }

        // 2. Fetch all products tracking stock
        const trackedProducts = await db.query.products.findMany({
            where: and(
                eq(products.shopId, shopId),
                eq(products.trackStock, true)
            )
        });

        let migratedCount = 0;

        await db.transaction(async (tx) => {
            for (const p of trackedProducts) {
                const existing = await tx.query.stockLedger.findFirst({
                    where: eq(stockLedger.productId, p.id)
                });

                if (!existing) {
                    const qty = parseFloat(p.stockQuantity || "0");
                    const cost = parseFloat(p.costPrice || "0");
                    
                    await tx.insert(stockLedger).values({
                        shopId,
                        productId: p.id,
                        locationId: defaultLocation.id,
                        movementType: "OPENING_BALANCE",
                        quantity: qty.toString(),
                        unitCost: cost.toString(),
                        runningBalance: qty.toString(),
                        notes: "Auto-migrated from product catalog opening stock",
                        createdById: session.userId,
                    });

                    // Upsert junction table
                    await tx
                        .insert(productLocationStock)
                        .values({
                            shopId,
                            productId: p.id,
                            locationId: defaultLocation.id,
                            quantity: qty.toString(),
                        })
                        .onConflictDoUpdate({
                            target: [productLocationStock.productId, productLocationStock.locationId],
                            set: { quantity: qty.toString(), updatedAt: new Date() },
                        });

                    // Ensure product has defaultLocationId set
                    if (!p.defaultLocationId) {
                        await tx
                            .update(products)
                            .set({ defaultLocationId: defaultLocation.id })
                            .where(eq(products.id, p.id));
                    }

                    migratedCount++;
                }
            }
        });

        revalidatePath(`/workspaces/${shopSlug}/inventory`);
        return { success: true, migratedCount };
    } catch (error: any) {
        console.error("Migration failed:", error);
        return { success: false, error: error.message || "Migration failed." };
    }
}

// ================================================================
// BACKFILL: Fix existing ledger entries that have locationId = null
// Assigns the first available location (or creates General Store).
// Also populates defaultLocationId on the product if missing.
// ================================================================

export async function backfillLedgerLocations(shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // 1. Resolve location: prefer default, then any, then create General Store
        let targetLocation = await db.query.stockLocations.findFirst({
            where: and(eq(stockLocations.shopId, shopId), eq(stockLocations.isDefault, true)),
        });

        if (!targetLocation) {
            targetLocation = await db.query.stockLocations.findFirst({
                where: and(eq(stockLocations.shopId, shopId), eq(stockLocations.isActive, true)),
            });
        }

        if (!targetLocation) {
            const [newLoc] = await db.insert(stockLocations).values({
                shopId,
                name: "General Store",
                code: "MAIN",
                isDefault: true,
            }).returning();
            targetLocation = newLoc;
        }

        // 2. Find all ledger entries for this shop with no location
        const nullEntries = await db.query.stockLedger.findMany({
            where: and(
                eq(stockLedger.shopId, shopId),
                isNull(stockLedger.locationId)
            ),
            with: { product: true },
        });

        if (nullEntries.length === 0) {
            return { success: true, patchedCount: 0 };
        }

        await db.transaction(async (tx) => {
            // 3. Patch all null-location ledger entries
            for (const entry of nullEntries) {
                await tx
                    .update(stockLedger)
                    .set({ locationId: targetLocation!.id })
                    .where(eq(stockLedger.id, entry.id));
            }

            // 4. Fix products that have no defaultLocationId
            const trackedProductIds = [...new Set(nullEntries
                .filter(e => e.product?.trackStock)
                .map(e => e.productId))];

            for (const productId of trackedProductIds) {
                const p = await tx.query.products.findFirst({ where: eq(products.id, productId) });
                if (!p) continue;

                if (!p.defaultLocationId) {
                    await tx
                        .update(products)
                        .set({ defaultLocationId: targetLocation!.id })
                        .where(eq(products.id, productId));
                }

                // Upsert junction table with current stockQuantity
                const qty = parseFloat(p.stockQuantity || "0");
                await tx
                    .insert(productLocationStock)
                    .values({
                        shopId,
                        productId,
                        locationId: targetLocation!.id,
                        quantity: qty.toString(),
                    })
                    .onConflictDoUpdate({
                        target: [productLocationStock.productId, productLocationStock.locationId],
                        set: { quantity: qty.toString(), updatedAt: new Date() },
                    });
            }
        });

        revalidatePath(`/workspaces/${shopSlug}/inventory`);
        revalidatePath(`/workspaces/${shopSlug}/products`);
        return { success: true, patchedCount: nullEntries.length };
    } catch (error: any) {
        console.error("Backfill failed:", error);
        return { success: false, error: error.message || "Backfill failed." };
    }
}
