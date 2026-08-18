// src/lib/actions/stock.ts
"use server";

import { db } from "@/db";
import { products, documentItems, documents, stockLedger, stockLocations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type StockMovementDirection = "OUTFLOW" | "INFLOW" | "REVERSE_OUTFLOW" | "REVERSE_INFLOW";

/**
 * Adjusts product stock levels based on document lifecycle events.
 * Also writes an immutable entry to the stock_ledger for full audit trail.
 * Accepts an optional Drizzle executor (transaction or DB instance).
 */
export async function applyDocumentStockMovements(
  documentId: string,
  direction: StockMovementDirection,
  executor: any = db
) {
  try {
    const items = await executor.query.documentItems.findMany({
      where: eq(documentItems.documentId, documentId),
      with: {
        product: true,
      },
    });

    // Resolve the document to get shopId for ledger entries
    const doc = await executor.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });

    // Find the default stock location for ledger entries (best-effort)
    let defaultLocationId: string | null = null;
    if (doc?.shopId) {
      const defaultLoc = await executor.query.stockLocations.findFirst({
        where: and(eq(stockLocations.shopId, doc.shopId), eq(stockLocations.isDefault, true)),
      });
      if (defaultLoc) defaultLocationId = defaultLoc.id;
    }

    for (const item of items) {
      const qty = parseFloat(item.quantity || "0");
      if (qty <= 0) continue;

      let targetProduct: any = item.product;

      // Fallback: If productId is not explicitly linked, attempt matching by exact name for the shop
      if (!targetProduct && doc) {
        targetProduct = (await executor.query.products.findFirst({
          where: and(eq(products.shopId, doc.shopId), eq(products.name, item.description)),
        })) || null;
      }

      if (!targetProduct || !targetProduct.trackStock) continue;

      const currentStock = parseFloat(targetProduct.stockQuantity || "0");
      let newStock = currentStock;

      // Determine ledger movement type
      let movementType: "SALE" | "PURCHASE_RECEIPT" | "RETURN" | "VOID";

      if (direction === "OUTFLOW") {
        newStock = Math.max(0, currentStock - qty);
        movementType = "SALE";
      } else if (direction === "REVERSE_INFLOW") {
        newStock = Math.max(0, currentStock - qty);
        movementType = "VOID";
      } else if (direction === "INFLOW") {
        newStock = currentStock + qty;
        movementType = "PURCHASE_RECEIPT";
      } else {
        // REVERSE_OUTFLOW
        newStock = currentStock + qty;
        movementType = "RETURN";
      }

      // 1. Write immutable ledger entry (if shop context available)
      if (doc?.shopId) {
        await executor.insert(stockLedger).values({
          shopId: doc.shopId,
          productId: targetProduct.id,
          locationId: defaultLocationId || null,
          movementType,
          quantity: qty.toString(),
          unitCost: targetProduct.costPrice || "0",
          runningBalance: newStock.toString(),
          sourceDocumentId: documentId,
          notes: `Auto: document ${doc.serialNumber || documentId}`,
        });
      }

      // 2. Update cached stock quantity on products table
      await executor
        .update(products)
        .set({ stockQuantity: newStock.toString() })
        .where(eq(products.id, targetProduct.id));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to execute stock movement:", error);
    return { success: false, error: error.message };
  }
}
