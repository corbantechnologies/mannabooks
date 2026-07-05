// src/lib/actions/stock.ts
"use server";

import { db } from "@/db";
import { products, documentItems, documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type StockMovementDirection = "OUTFLOW" | "INFLOW" | "REVERSE_OUTFLOW" | "REVERSE_INFLOW";

/**
 * Adjusts product stock levels based on document lifecycle events.
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

    for (const item of items) {
      const qty = parseFloat(item.quantity || "0");
      if (qty <= 0) continue;

      let targetProduct: any = item.product;

      // Fallback: If productId is not explicitly linked, attempt matching by exact name for the shop
      if (!targetProduct) {
        const doc = await executor.query.documents.findFirst({
          where: eq(documents.id, documentId),
        });
        if (doc) {
          targetProduct = (await executor.query.products.findFirst({
            where: and(eq(products.shopId, doc.shopId), eq(products.name, item.description)),
          })) || null;
        }
      }

      if (!targetProduct || !targetProduct.trackStock) continue;

      const currentStock = parseFloat(targetProduct.stockQuantity || "0");
      let newStock = currentStock;

      if (direction === "OUTFLOW" || direction === "REVERSE_INFLOW") {
        newStock = Math.max(0, currentStock - qty);
      } else if (direction === "INFLOW" || direction === "REVERSE_OUTFLOW") {
        newStock = currentStock + qty;
      }

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
