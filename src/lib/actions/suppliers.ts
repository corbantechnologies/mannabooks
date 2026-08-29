// src/lib/actions/suppliers.ts
"use server";

import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateSupplierInput {
  shopId: string;
  shopSlug: string;
  name: string;
  email?: string;
  phone?: string;
  supplierType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
  taxPin?: string;
  requiresEtims?: boolean;
  paymentTerms?: string;
}

/**
 * Server Action to register a new supplier/vendor record in tenant isolation.
 * Flexible Tax PIN accepts both Sole Proprietor (A...) and Corporate (P...) PINs without artificial restrictions.
 */
export async function createSupplierProfile(input: CreateSupplierInput) {
  try {
    const cleanEmail = input.email ? input.email.toLowerCase().trim() : "";
    const cleanName = input.name.trim();
    const cleanPin = input.taxPin?.toUpperCase().trim() || null;

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        shopId: input.shopId,
        name: cleanName,
        email: cleanEmail,
        phone: input.phone?.trim() || null,
        supplierType: input.supplierType,
        taxPin: cleanPin,
        requiresEtims: input.requiresEtims || false,
        paymentTerms: input.paymentTerms?.trim() || "NET_30",
      })
      .returning();

    revalidatePath(`/workspaces/${input.shopSlug}/suppliers`);

    return { success: true, supplierId: newSupplier.id };
  } catch (error) {
    console.error("Failed to register supplier profile record:", error);
    return { success: false, error: "An unexpected database error occurred while registering supplier." };
  }
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  id: string;
  shopId: string;
  shopSlug: string;
}

/**
 * Server Action to modify an existing supplier record.
 */
export async function updateSupplierProfile({ id, shopId, shopSlug, ...updates }: UpdateSupplierInput) {
  try {
    const existing = await db.query.suppliers.findFirst({
      where: and(eq(suppliers.id, id), eq(suppliers.shopId, shopId)),
    });

    if (!existing) {
      return { success: false, error: "Supplier registry node not found or access denied." };
    }

    const cleanPin = updates.taxPin?.toUpperCase().trim();

    await db
      .update(suppliers)
      .set({
        name: updates.name?.trim(),
        email: updates.email?.toLowerCase().trim(),
        phone: updates.phone?.trim(),
        supplierType: updates.supplierType,
        taxPin: cleanPin !== undefined ? cleanPin : existing.taxPin,
        requiresEtims: updates.requiresEtims !== undefined ? updates.requiresEtims : existing.requiresEtims,
        paymentTerms: updates.paymentTerms?.trim() || existing.paymentTerms,
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.shopId, shopId)));

    revalidatePath(`/workspaces/${shopSlug}/suppliers`);
    revalidatePath(`/workspaces/${shopSlug}/suppliers/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update supplier profile record:", error);
    return { success: false, error: "Failed to persist supplier updates." };
  }
}

/**
 * Server Action to delete a supplier record.
 */
export async function deleteSupplierProfile(id: string, shopId: string, shopSlug: string) {
  try {
    await db.delete(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.shopId, shopId)));

    revalidatePath(`/workspaces/${shopSlug}/suppliers`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete supplier profile:", error);
    return { success: false, error: "Failed to remove supplier record from database." };
  }
}
