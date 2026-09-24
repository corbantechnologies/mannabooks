"use server";

import { db } from "@/db";
import {
    billOfMaterials,
    bomItems,
    productionOrders,
    products,
    stockLocations,
    stockLedger,
    productLocationStock,
    shops,
} from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. BILL OF MATERIALS (BOM) QUERIES & CREATION
// ==========================================

export async function getBillOfMaterials(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    return await db.query.billOfMaterials.findMany({
        where: and(
            eq(billOfMaterials.shopId, shopId),
            eq(billOfMaterials.isActive, true)
        ),
        orderBy: [desc(billOfMaterials.createdAt)],
        with: {
            finishedProduct: true,
            items: {
                with: {
                    rawMaterialProduct: true,
                },
            },
        },
    });
}

export async function getBomDetail(bomId: string) {
    const session = await verifyAndGetSession();
    if (!session) return null;

    return await db.query.billOfMaterials.findFirst({
        where: eq(billOfMaterials.id, bomId),
        with: {
            finishedProduct: true,
            items: {
                with: {
                    rawMaterialProduct: true,
                },
            },
            productionOrders: {
                orderBy: [desc(productionOrders.createdAt)],
                limit: 10,
                with: {
                    targetLocation: true,
                },
            },
        },
    });
}

export async function createBillOfMaterialsAction(params: {
    shopId: string;
    finishedProductId: string;
    name: string;
    laborCostEstimate?: number;
    overheadCostEstimate?: number;
    items: {
        rawMaterialProductId: string;
        quantityRequired: number;
        wastagePercentage?: number;
    }[];
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await enforcePermission(params.shopId, "manage_products");

        if (!params.name.trim()) {
            return { success: false, error: "Recipe name is required." };
        }
        if (!params.finishedProductId) {
            return { success: false, error: "Finished assembly product must be selected." };
        }
        if (!params.items || params.items.length === 0) {
            return { success: false, error: "At least one raw material component is required." };
        }

        const [bom] = await db.insert(billOfMaterials).values({
            shopId: params.shopId,
            finishedProductId: params.finishedProductId,
            name: params.name.trim(),
            laborCostEstimate: String(params.laborCostEstimate || 0),
            overheadCostEstimate: String(params.overheadCostEstimate || 0),
            isActive: true,
        }).returning();

        // Insert items
        const itemRows = params.items.map((item) => ({
            bomId: bom.id,
            rawMaterialProductId: item.rawMaterialProductId,
            quantityRequired: String(item.quantityRequired),
            wastagePercentage: String(item.wastagePercentage || 0),
        }));

        await db.insert(bomItems).values(itemRows);

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, params.shopId) });
        if (shop) revalidatePath(`/workspaces/${shop.slug}/inventory/bom`);

        return { success: true, bom };
    } catch (err: any) {
        console.error("Failed to create BOM:", err);
        return { success: false, error: err.message || "Failed to create BOM." };
    }
}

// ==========================================
// 2. PRODUCTION RUNS & ASSEMBLY EXECUTION
// ==========================================

export async function getProductionOrders(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    return await db.query.productionOrders.findMany({
        where: eq(productionOrders.shopId, shopId),
        orderBy: [desc(productionOrders.createdAt)],
        with: {
            bom: {
                with: {
                    finishedProduct: true,
                },
            },
            targetLocation: true,
        },
    });
}

export async function runProductionOrderAction(params: {
    shopId: string;
    bomId: string;
    unitsToProduce: number;
    targetLocationId: string;
    notes?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await enforcePermission(params.shopId, "manage_products");

        if (params.unitsToProduce <= 0) {
            return { success: false, error: "Units to produce must be greater than 0." };
        }

        // Fetch full BOM with items and products
        const bom = await db.query.billOfMaterials.findFirst({
            where: and(
                eq(billOfMaterials.id, params.bomId),
                eq(billOfMaterials.shopId, params.shopId)
            ),
            with: {
                finishedProduct: true,
                items: {
                    with: {
                        rawMaterialProduct: true,
                    },
                },
            },
        });

        if (!bom) {
            return { success: false, error: "Bill of Materials recipe not found." };
        }

        // Calculate material requirements and costs
        let totalMaterialCost = 0;
        const deductions: {
            product: any;
            qtyNeeded: number;
            unitCost: number;
            lineTotalCost: number;
        }[] = [];

        for (const item of bom.items) {
            const raw = item.rawMaterialProduct;
            const qtyPerUnit = Number(item.quantityRequired) || 0;
            const wastage = Number(item.wastagePercentage) || 0;
            const totalQtyNeeded = params.unitsToProduce * qtyPerUnit * (1 + wastage / 100);
            const costPerUnit = Number(raw.costPrice || raw.unitPrice || 0);
            const lineCost = totalQtyNeeded * costPerUnit;

            totalMaterialCost += lineCost;
            deductions.push({
                product: raw,
                qtyNeeded: totalQtyNeeded,
                unitCost: costPerUnit,
                lineTotalCost: lineCost,
            });
        }

        const labor = Number(bom.laborCostEstimate || 0);
        const overhead = Number(bom.overheadCostEstimate || 0);
        const grandTotalCost = totalMaterialCost + labor + overhead;
        const unitProductionCost = grandTotalCost / params.unitsToProduce;

        const orderNumber = `PRD-${Date.now().toString().slice(-6)}`;

        // Execute atomic production run
        const [order] = await db.insert(productionOrders).values({
            shopId: params.shopId,
            bomId: bom.id,
            orderNumber,
            targetLocationId: params.targetLocationId,
            unitsToProduce: String(params.unitsToProduce),
            totalCostKes: String(grandTotalCost.toFixed(2)),
            status: "COMPLETED",
            completedAt: new Date(),
            notes: params.notes?.trim() || `Assembled ${params.unitsToProduce} x ${bom.finishedProduct.name}`,
        }).returning();

        // 1. Consume raw materials (ADJUSTMENT_OUT)
        for (const d of deductions) {
            await db.insert(stockLedger).values({
                shopId: params.shopId,
                productId: d.product.id,
                locationId: params.targetLocationId,
                movementType: "ADJUSTMENT_OUT",
                quantity: String(d.qtyNeeded.toFixed(4)),
                unitCost: String(d.unitCost.toFixed(2)),
                adjustmentReason: "OTHER",
                notes: `Consumed for Production Order ${orderNumber} (${bom.name})`,
                createdById: session.userId,
            });

            // Decrement total stock
            await db.update(products).set({
                stockQuantity: sql`GREATEST(0, CAST(COALESCE(${products.stockQuantity}, 0) AS NUMERIC) - ${d.qtyNeeded})`,
            }).where(eq(products.id, d.product.id));

            // Decrement location stock
            const locStock = await db.query.productLocationStock.findFirst({
                where: and(
                    eq(productLocationStock.productId, d.product.id),
                    eq(productLocationStock.locationId, params.targetLocationId)
                ),
            });
            if (locStock) {
                await db.update(productLocationStock).set({
                    quantity: sql`GREATEST(0, CAST(COALESCE(${productLocationStock.quantity}, 0) AS NUMERIC) - ${d.qtyNeeded})`,
                    updatedAt: new Date(),
                }).where(eq(productLocationStock.id, locStock.id));
            }
        }

        // 2. Deposit finished assembly goods (ADJUSTMENT_IN)
        await db.insert(stockLedger).values({
            shopId: params.shopId,
            productId: bom.finishedProductId,
            locationId: params.targetLocationId,
            movementType: "ADJUSTMENT_IN",
            quantity: String(params.unitsToProduce),
            unitCost: String(unitProductionCost.toFixed(2)),
            adjustmentReason: "OTHER",
            notes: `Manufactured via Order ${orderNumber} (${bom.name})`,
            createdById: session.userId,
        });

        // Increment finished good total stock
        await db.update(products).set({
            stockQuantity: sql`CAST(COALESCE(${products.stockQuantity}, 0) AS NUMERIC) + ${params.unitsToProduce}`,
            costPrice: String(unitProductionCost.toFixed(2)), // update unit cost
        }).where(eq(products.id, bom.finishedProductId));

        // Increment finished good location stock
        const finishLocStock = await db.query.productLocationStock.findFirst({
            where: and(
                eq(productLocationStock.productId, bom.finishedProductId),
                eq(productLocationStock.locationId, params.targetLocationId)
            ),
        });
        if (finishLocStock) {
            await db.update(productLocationStock).set({
                quantity: sql`CAST(COALESCE(${productLocationStock.quantity}, 0) AS NUMERIC) + ${params.unitsToProduce}`,
                updatedAt: new Date(),
            }).where(eq(productLocationStock.id, finishLocStock.id));
        } else {
            await db.insert(productLocationStock).values({
                shopId: params.shopId,
                productId: bom.finishedProductId,
                locationId: params.targetLocationId,
                quantity: String(params.unitsToProduce),
            });
        }

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, params.shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/inventory`);
            revalidatePath(`/workspaces/${shop.slug}/inventory/bom`);
        }

        return { success: true, order, totalCostKes: grandTotalCost, unitProductionCost };
    } catch (err: any) {
        console.error("Failed to run production order:", err);
        return { success: false, error: err.message || "Failed to execute production run." };
    }
}

export async function getWorkspaceProducts(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];
    return await db.query.products.findMany({
        where: eq(products.shopId, shopId),
        orderBy: [asc(products.name)],
    });
}

