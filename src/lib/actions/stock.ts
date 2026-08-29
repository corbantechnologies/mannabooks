// src/lib/actions/stock.ts
"use server";

import { db } from "@/db";
import { products, documentItems, documents, stockLedger, stockLocations, productLocationStock } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export type StockMovementDirection = "OUTFLOW" | "INFLOW" | "REVERSE_OUTFLOW" | "REVERSE_INFLOW";

/**
 * Adjusts product stock levels based on document lifecycle events.
 * Also writes an immutable entry to the stock_ledger and updates the
 * product_location_stock junction table for per-location quantity tracking.
 *
 * Location resolution order per line item:
 *   1. product.defaultLocationId  (specific location for this product)
 *   2. Shop's global default location
 *   3. null (recorded without a location — still correct for single-location shops)
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

    // Resolve the document for shopId and source linkage
    const doc = await executor.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });

    // Cache the shop's global default location (fallback only)
    let shopDefaultLocationId: string | null = null;
    if (doc?.shopId) {
      const defaultLoc = await executor.query.stockLocations.findFirst({
        where: and(eq(stockLocations.shopId, doc.shopId), eq(stockLocations.isDefault, true)),
      });
      if (defaultLoc) shopDefaultLocationId = defaultLoc.id;
    }

    for (const item of items) {
      const qty = parseFloat(item.quantity || "0");
      if (qty <= 0) continue;

      let targetProduct: any = item.product;

      // Fallback: match by name for unlinked line items
      if (!targetProduct && doc) {
        targetProduct = (await executor.query.products.findFirst({
          where: and(eq(products.shopId, doc.shopId), eq(products.name, item.description)),
        })) || null;
      }

      if (!targetProduct || !targetProduct.trackStock) continue;

      // ─── Per-product location resolution ──────────────────────────────────
      // Use the product's own defaultLocationId first, then fall back to shop default.
      const locationId: string | null = targetProduct.defaultLocationId || shopDefaultLocationId || null;
      // ──────────────────────────────────────────────────────────────────────

      const currentStock = parseFloat(targetProduct.stockQuantity || "0");
      let newStock = currentStock;

      // Determine movement type and direction
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
        // REVERSE_OUTFLOW — e.g. cancelling a receipt
        newStock = currentStock + qty;
        movementType = "RETURN";
      }

      // 1. Write immutable ledger entry
      if (doc?.shopId) {
        await executor.insert(stockLedger).values({
          shopId: doc.shopId,
          productId: targetProduct.id,
          locationId: locationId || null,
          movementType,
          quantity: qty.toString(),
          unitCost: targetProduct.costPrice || "0",
          runningBalance: newStock.toString(),
          sourceDocumentId: documentId,
          notes: `Auto: ${doc.docNumber || documentId}`,
        });
      }

      // 2. Update the denormalized stockQuantity cache on the product
      await executor
        .update(products)
        .set({ stockQuantity: newStock.toString() })
        .where(eq(products.id, targetProduct.id));

      // 3. Upsert per-location quantity in junction table
      if (doc?.shopId && locationId) {
        // Compute the qty delta for this location
        const locationQtyDelta =
          direction === "OUTFLOW" || direction === "REVERSE_INFLOW" ? -qty : qty;

        await executor
          .insert(productLocationStock)
          .values({
            shopId: doc.shopId,
            productId: targetProduct.id,
            locationId,
            quantity: Math.max(0, (parseFloat("0") + locationQtyDelta)).toString(),
          })
          .onConflictDoUpdate({
            target: [productLocationStock.productId, productLocationStock.locationId],
            set: {
              quantity: sql`GREATEST(0, ${productLocationStock.quantity} + ${locationQtyDelta})`,
              updatedAt: new Date(),
            },
          });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to execute stock movement:", error);
    return { success: false, error: error.message };
  }
}
