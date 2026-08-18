// src/lib/actions/stock-transfers.ts
"use server";

import { db } from "@/db";
import {
    stockTransfers,
    stockTransferItems,
    stockLedger,
    stockLocations,
    products,
    shops,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface TransferLineItem {
    productId: string;
    quantityRequested: number;
    notes?: string;
}

// ================================================================
// CREATE TRANSFER
// ================================================================

export async function createStockTransfer(formData: {
    shopId: string;
    shopSlug: string;
    fromLocationId: string;
    toLocationId: string;
    notes?: string;
    items: TransferLineItem[];
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    if (formData.fromLocationId === formData.toLocationId) {
        return { success: false, error: "Source and destination locations cannot be the same." };
    }
    if (formData.items.length === 0) {
        return { success: false, error: "A transfer must contain at least one product line." };
    }

    try {
        const transferId = crypto.randomUUID();

        await db.transaction(async (tx) => {
            // 1. Create the transfer header
            await tx.insert(stockTransfers).values({
                id: transferId,
                shopId: formData.shopId,
                fromLocationId: formData.fromLocationId,
                toLocationId: formData.toLocationId,
                status: "DRAFT",
                notes: formData.notes || null,
                requestedById: session.userId,
            });

            // 2. Insert transfer line items
            await tx.insert(stockTransferItems).values(
                formData.items.map(item => ({
                    transferId,
                    productId: item.productId,
                    quantityRequested: item.quantityRequested.toString(),
                    quantityReceived: "0.00",
                    notes: item.notes || null,
                }))
            );
        });

        revalidatePath(`/workspaces/${formData.shopSlug}/inventory/transfers`);
        return { success: true, transferId };
    } catch (error: any) {
        console.error("Failed to create transfer:", error);
        return { success: false, error: error.message || "Failed to create transfer." };
    }
}

// ================================================================
// DISPATCH TRANSFER (DRAFT → IN_TRANSIT)
// Deducts stock from source location and locks the transfer
// ================================================================

export async function dispatchStockTransfer(transferId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const transfer = await db.query.stockTransfers.findFirst({
            where: eq(stockTransfers.id, transferId),
            with: {
                items: {
                    with: { product: true },
                },
                fromLocation: true,
            },
        });

        if (!transfer) return { success: false, error: "Transfer not found." };
        if (transfer.status !== "DRAFT") {
            return { success: false, error: `Transfer is already ${transfer.status}. Only DRAFT transfers can be dispatched.` };
        }

        await db.transaction(async (tx) => {
            for (const item of transfer.items) {
                const product = item.product;
                if (!product || !product.trackStock) continue;

                const qty = parseFloat(item.quantityRequested);
                const currentStock = parseFloat(product.stockQuantity || "0");
                const newStock = Math.max(0, currentStock - qty);

                // Write TRANSFER_OUT ledger entry
                await tx.insert(stockLedger).values({
                    shopId: transfer.shopId,
                    productId: item.productId,
                    locationId: transfer.fromLocationId,
                    movementType: "TRANSFER_OUT",
                    quantity: qty.toString(),
                    unitCost: product.costPrice || "0",
                    runningBalance: newStock.toString(),
                    transferId,
                    notes: `Transfer to ${transfer.fromLocation?.name || "destination"}`,
                    createdById: session.userId,
                });

                // Update cached product stock
                await tx.update(products)
                    .set({ stockQuantity: newStock.toString() })
                    .where(eq(products.id, item.productId));
            }

            // Mark transfer as IN_TRANSIT
            await tx.update(stockTransfers)
                .set({ status: "IN_TRANSIT" })
                .where(eq(stockTransfers.id, transferId));
        });

        revalidatePath(`/workspaces/${shopSlug}/inventory/transfers`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to dispatch transfer:", error);
        return { success: false, error: error.message || "Dispatch failed." };
    }
}

// ================================================================
// RECEIVE TRANSFER (IN_TRANSIT → COMPLETED)
// Adds stock to destination location
// ================================================================

export async function receiveStockTransfer(
    transferId: string,
    shopSlug: string,
    receivedItems: { transferItemId: string; quantityReceived: number }[]
) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const transfer = await db.query.stockTransfers.findFirst({
            where: eq(stockTransfers.id, transferId),
            with: {
                items: {
                    with: { product: true },
                },
                toLocation: true,
            },
        });

        if (!transfer) return { success: false, error: "Transfer not found." };
        if (transfer.status !== "IN_TRANSIT") {
            return { success: false, error: `Only IN_TRANSIT transfers can be received. Current status: ${transfer.status}` };
        }

        await db.transaction(async (tx) => {
            for (const received of receivedItems) {
                const line = transfer.items.find(i => i.id === received.transferItemId);
                if (!line || !line.product || !line.product.trackStock) continue;

                const qty = received.quantityReceived;
                const product = line.product;
                const currentStock = parseFloat(product.stockQuantity || "0");
                const newStock = currentStock + qty;

                // Write TRANSFER_IN ledger entry
                await tx.insert(stockLedger).values({
                    shopId: transfer.shopId,
                    productId: line.productId,
                    locationId: transfer.toLocationId,
                    movementType: "TRANSFER_IN",
                    quantity: qty.toString(),
                    unitCost: product.costPrice || "0",
                    runningBalance: newStock.toString(),
                    transferId,
                    notes: `Received from ${transfer.toLocation?.name || "source"}`,
                    createdById: session.userId,
                });

                // Update cached stock quantity
                await tx.update(products)
                    .set({ stockQuantity: newStock.toString() })
                    .where(eq(products.id, line.productId));

                // Update the quantityReceived on the transfer item
                await tx.update(stockTransferItems)
                    .set({ quantityReceived: qty.toString() })
                    .where(eq(stockTransferItems.id, received.transferItemId));
            }

            // Mark transfer as COMPLETED
            await tx.update(stockTransfers)
                .set({ status: "COMPLETED", completedAt: new Date() })
                .where(eq(stockTransfers.id, transferId));
        });

        revalidatePath(`/workspaces/${shopSlug}/inventory/transfers`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to receive transfer:", error);
        return { success: false, error: error.message || "Receive failed." };
    }
}

// ================================================================
// CANCEL TRANSFER
// ================================================================

export async function cancelStockTransfer(transferId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const transfer = await db.query.stockTransfers.findFirst({
            where: eq(stockTransfers.id, transferId),
            with: { items: { with: { product: true } } },
        });

        if (!transfer) return { success: false, error: "Transfer not found." };
        if (transfer.status === "COMPLETED") {
            return { success: false, error: "Completed transfers cannot be cancelled." };
        }

        await db.transaction(async (tx) => {
            // If IN_TRANSIT, reverse the TRANSFER_OUT entries
            if (transfer.status === "IN_TRANSIT") {
                for (const item of transfer.items) {
                    const product = item.product;
                    if (!product || !product.trackStock) continue;

                    const qty = parseFloat(item.quantityRequested);
                    const currentStock = parseFloat(product.stockQuantity || "0");
                    const restoredStock = currentStock + qty;

                    await tx.insert(stockLedger).values({
                        shopId: transfer.shopId,
                        productId: item.productId,
                        locationId: transfer.fromLocationId,
                        movementType: "VOID",
                        quantity: qty.toString(),
                        unitCost: product.costPrice || "0",
                        runningBalance: restoredStock.toString(),
                        transferId,
                        notes: `Transfer cancelled — stock restored`,
                        createdById: session.userId,
                    });

                    await tx.update(products)
                        .set({ stockQuantity: restoredStock.toString() })
                        .where(eq(products.id, item.productId));
                }
            }

            await tx.update(stockTransfers)
                .set({ status: "CANCELLED" })
                .where(eq(stockTransfers.id, transferId));
        });

        revalidatePath(`/workspaces/${shopSlug}/inventory/transfers`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Cancellation failed." };
    }
}

// ================================================================
// LIST TRANSFERS
// ================================================================

export async function getStockTransfers(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    return await db.query.stockTransfers.findMany({
        where: eq(stockTransfers.shopId, shopId),
        with: {
            fromLocation: true,
            toLocation: true,
            requestedBy: true,
            items: {
                with: { product: true },
            },
        },
        orderBy: [desc(stockTransfers.createdAt)],
    });
}

export async function getStockTransfer(transferId: string) {
    const session = await verifyAndGetSession();
    if (!session) return null;

    return await db.query.stockTransfers.findFirst({
        where: eq(stockTransfers.id, transferId),
        with: {
            fromLocation: true,
            toLocation: true,
            requestedBy: true,
            items: {
                with: { product: true },
            },
        },
    });
}
