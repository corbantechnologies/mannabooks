"use server";

import { db } from "@/db";
import {
    stocktakes,
    stocktakeItems,
    stockLocations,
    products,
    productLocationStock,
    stockLedger,
    storageBins,
    shops,
} from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. STOCKTAKE QUERIES
// ==========================================

export async function getStocktakes(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    return await db.query.stocktakes.findMany({
        where: eq(stocktakes.shopId, shopId),
        orderBy: [desc(stocktakes.createdAt)],
        with: {
            location: true,
            conductedBy: true,
            items: true,
        },
    });
}

export async function getStocktakeDetail(stocktakeId: string) {
    const session = await verifyAndGetSession();
    if (!session) return null;

    return await db.query.stocktakes.findFirst({
        where: eq(stocktakes.id, stocktakeId),
        with: {
            location: true,
            conductedBy: true,
            items: {
                with: {
                    product: true,
                    bin: true,
                    batch: true,
                },
                orderBy: [asc(stocktakeItems.id)],
            },
        },
    });
}

// ==========================================
// 2. STOCKTAKE LIFECYCLE ACTIONS
// ==========================================

export async function startStocktakeAction(params: {
    shopId: string;
    locationId: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await enforcePermission(params.shopId, "manage_products");

        const stocktakeNumber = `STK-${Date.now().toString().slice(-6)}`;

        // Fetch location and all products for this shop
        const location = await db.query.stockLocations.findFirst({
            where: and(
                eq(stockLocations.id, params.locationId),
                eq(stockLocations.shopId, params.shopId)
            ),
        });

        if (!location) {
            return { success: false, error: "Warehouse location not found." };
        }

        // Get all products with their location stock or default stock
        const allProducts = await db.query.products.findMany({
            where: eq(products.shopId, params.shopId),
            with: {
                locationStock: {
                    where: eq(productLocationStock.locationId, params.locationId),
                },
            },
        });

        if (allProducts.length === 0) {
            return { success: false, error: "No active products found to audit in this workspace." };
        }

        // Create stocktake parent record
        const [stocktake] = await db.insert(stocktakes).values({
            shopId: params.shopId,
            locationId: params.locationId,
            stocktakeNumber,
            status: "COUNTING",
            conductedByUserId: session.userId,
            startedAt: new Date(),
        }).returning();

        // Create snapshot items
        const itemRows = allProducts.map((p) => {
            const locStock = p.locationStock?.[0];
            const bookQty = locStock ? Number(locStock.quantity) : Number(p.stockQuantity || 0);

            return {
                stocktakeId: stocktake.id,
                productId: p.id,
                bookQuantity: String(bookQty),
                countedQuantity: String(bookQty), // defaults to book quantity until altered
                varianceQuantity: "0.00",
                varianceCostKes: "0.00",
            };
        });

        await db.insert(stocktakeItems).values(itemRows);

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, params.shopId) });
        if (shop) revalidatePath(`/workspaces/${shop.slug}/inventory/stocktakes`);

        return { success: true, stocktakeId: stocktake.id, stocktakeNumber };
    } catch (err: any) {
        console.error("Failed to start stocktake:", err);
        return { success: false, error: err.message || "Failed to initialize stocktake session." };
    }
}

export async function updateStocktakeItemCountAction(params: {
    stocktakeId: string;
    itemId: string;
    countedQuantity: number;
    notes?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const item = await db.query.stocktakeItems.findFirst({
            where: eq(stocktakeItems.id, params.itemId),
            with: {
                product: true,
                stocktake: true,
            },
        });

        if (!item) {
            return { success: false, error: "Stocktake item not found." };
        }

        if (item.stocktake.status === "COMPLETED") {
            return { success: false, error: "This stocktake is already reconciled and finalized." };
        }

        const bookQty = Number(item.bookQuantity) || 0;
        const countedQty = Number(params.countedQuantity) || 0;
        const varianceQty = countedQty - bookQty;
        const unitCost = Number(item.product.costPrice || item.product.unitPrice || 0);
        const varianceCost = varianceQty * unitCost;

        await db.update(stocktakeItems).set({
            countedQuantity: String(countedQty),
            varianceQuantity: String(varianceQty.toFixed(2)),
            varianceCostKes: String(varianceCost.toFixed(2)),
            notes: params.notes?.trim() || item.notes,
        }).where(eq(stocktakeItems.id, params.itemId));

        return {
            success: true,
            varianceQuantity: varianceQty,
            varianceCostKes: varianceCost,
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update count." };
    }
}

export async function reconcileStocktakeAction(shopId: string, stocktakeId: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await enforcePermission(shopId, "manage_products");

        const stocktake = await db.query.stocktakes.findFirst({
            where: and(
                eq(stocktakes.id, stocktakeId),
                eq(stocktakes.shopId, shopId)
            ),
            with: {
                location: true,
                items: {
                    with: {
                        product: true,
                    },
                },
            },
        });

        if (!stocktake) {
            return { success: false, error: "Stocktake not found." };
        }

        if (stocktake.status === "COMPLETED") {
            return { success: false, error: "Stocktake is already reconciled." };
        }

        let totalAdjustmentCount = 0;
        let netVarianceValueKes = 0;

        // Process adjustments for items with non-zero variance
        for (const item of stocktake.items) {
            const variance = Number(item.varianceQuantity) || 0;
            const unitCost = Number(item.product.costPrice || item.product.unitPrice || 0);

            if (variance !== 0) {
                totalAdjustmentCount++;
                const absVariance = Math.abs(variance);
                const isSurplus = variance > 0;
                netVarianceValueKes += variance * unitCost;

                // 1. Record stock ledger entry
                await db.insert(stockLedger).values({
                    shopId,
                    productId: item.productId,
                    locationId: stocktake.locationId,
                    movementType: isSurplus ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
                    quantity: String(absVariance),
                    unitCost: String(unitCost.toFixed(2)),
                    adjustmentReason: "COUNT_CORRECTION",
                    notes: `Audit Reconciled: ${stocktake.stocktakeNumber} (${isSurplus ? 'Surplus' : 'Deficit'} of ${absVariance})`,
                    createdById: session.userId,
                });

                // 2. Adjust overall product stockQuantity
                if (isSurplus) {
                    await db.update(products).set({
                        stockQuantity: sql`CAST(COALESCE(${products.stockQuantity}, 0) AS NUMERIC) + ${absVariance}`,
                    }).where(eq(products.id, item.productId));
                } else {
                    await db.update(products).set({
                        stockQuantity: sql`GREATEST(0, CAST(COALESCE(${products.stockQuantity}, 0) AS NUMERIC) - ${absVariance})`,
                    }).where(eq(products.id, item.productId));
                }

                // 3. Adjust location specific stock
                const locStock = await db.query.productLocationStock.findFirst({
                    where: and(
                        eq(productLocationStock.productId, item.productId),
                        eq(productLocationStock.locationId, stocktake.locationId)
                    ),
                });

                if (locStock) {
                    if (isSurplus) {
                        await db.update(productLocationStock).set({
                            quantity: sql`CAST(COALESCE(${productLocationStock.quantity}, 0) AS NUMERIC) + ${absVariance}`,
                            updatedAt: new Date(),
                        }).where(eq(productLocationStock.id, locStock.id));
                    } else {
                        await db.update(productLocationStock).set({
                            quantity: sql`GREATEST(0, CAST(COALESCE(${productLocationStock.quantity}, 0) AS NUMERIC) - ${absVariance})`,
                            updatedAt: new Date(),
                        }).where(eq(productLocationStock.id, locStock.id));
                    }
                } else {
                    await db.insert(productLocationStock).values({
                        shopId,
                        productId: item.productId,
                        locationId: stocktake.locationId,
                        quantity: String(isSurplus ? absVariance : 0),
                    });
                }
            }
        }

        // Finalize stocktake
        await db.update(stocktakes).set({
            status: "COMPLETED",
            completedAt: new Date(),
        }).where(eq(stocktakes.id, stocktakeId));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/inventory`);
            revalidatePath(`/workspaces/${shop.slug}/inventory/stocktakes`);
            revalidatePath(`/workspaces/${shop.slug}/inventory/stocktakes/${stocktakeId}`);
        }

        return {
            success: true,
            totalAdjustmentCount,
            netVarianceValueKes,
        };
    } catch (err: any) {
        console.error("Failed to reconcile stocktake:", err);
        return { success: false, error: err.message || "Failed to finalize and reconcile stocktake." };
    }
}
