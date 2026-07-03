"use server";

import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";

interface AddPaymentMethodInput {
  shopId: string;
  name: string;      // e.g., "M-Pesa Till" or "NCBA Bank"
  details: string;   // e.g., "Till Number: 552134" or "Acc No: 0110XXXXXX"
  isDefault: boolean;
}

/**
 * Creates a clear transactional text reference instruction block for client payments.
 */
export async function addPaymentMethod(input: AddPaymentMethodInput) {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Authentication credentials required." };

    return await db.transaction(async (tx) => {
      // If this method is set to default, reset any existing default markers for this shop first
      if (input.isDefault) {
        await tx.update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.shopId, input.shopId));
      }

      const [newMethod] = await tx.insert(paymentMethods).values({
        shopId: input.shopId,
        name: input.name.trim(),
        details: input.details.trim(),
        isDefault: input.isDefault,
      }).returning();

      revalidatePath("/settings");
      return { success: true, methodId: newMethod.id };
    });
  } catch (error) {
    console.error("Failed to append payment configuration line:", error);
    return { success: false, error: "Failed to save settlement parameters." };
  }
}

/**
 * Retreives active account configurations for dynamic document generation mapping.
 */
export async function getShopPaymentMethods(shopId: string) {
  try {
    return await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.shopId, shopId),
      orderBy: (methods, { desc }) => [desc(methods.isDefault), desc(methods.createdAt)],
    });
  } catch (error) {
    console.error("Failed to query payment definitions:", error);
    return [];
  }
}