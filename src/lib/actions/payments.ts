"use server";

import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";

interface AddPaymentMethodInput {
  shopId: string;
  shopSlug: string;
  name: string;      // e.g., "M-Pesa Till" or "NCBA Bank"
  details: string;   // e.g., "Till Number: 552134" or "Acc No: 0110XXXXXX"
  isDefault: boolean;
}

/**
 * Creates a clear transactional text reference instruction block for client payments.
 */
export async function addPaymentMethod(input: AddPaymentMethodInput): Promise<{ success: true; methodId: string } | { success: false; error: string }> {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false as const, error: "Authentication credentials required." };

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

      revalidatePath(`/workspaces/${input.shopSlug}/settings`);
      return { success: true as const, methodId: newMethod.id };
    });
  } catch (error) {
    console.error("Failed to append payment configuration line:", error);
    return { success: false as const, error: "Failed to save settlement parameters." };
  }
}

/**
 * Retrieves active account configurations for dynamic document generation mapping.
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

/**
 * Removes a payment method configuration from the database.
 */
export async function deletePaymentMethod(id: string, shopId: string, shopSlug: string) {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Authentication credentials required." };

    await db.delete(paymentMethods)
      .where(and(eq(paymentMethods.id, id), eq(paymentMethods.shopId, shopId)));

    revalidatePath(`/workspaces/${shopSlug}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove payment method:", error);
    return { success: false, error: "Failed to delete payment method." };
  }
}

/**
 * Sets a payment method as default for the shop.
 */
export async function setDefaultPaymentMethod(id: string, shopId: string, shopSlug: string) {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Authentication credentials required." };

    await db.transaction(async (tx) => {
      await tx.update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.shopId, shopId));

      await tx.update(paymentMethods)
        .set({ isDefault: true })
        .where(and(eq(paymentMethods.id, id), eq(paymentMethods.shopId, shopId)));
    });

    revalidatePath(`/workspaces/${shopSlug}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Failed to set default payment method:", error);
    return { success: false, error: "Failed to update default payment method." };
  }
}