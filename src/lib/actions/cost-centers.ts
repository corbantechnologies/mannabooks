"use server";

import { db } from "@/db";
import { costCenters, shops, journalEntries } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

export interface CreateCostCenterInput {
    code: string;
    name: string;
    department?: string;
}

export interface UpdateCostCenterInput {
    code?: string;
    name?: string;
    department?: string;
    isActive?: boolean;
}

/**
 * Fetch all cost centers for a workspace
 */
export async function getCostCenters(shopSlug: string) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        throw new Error("Workspace not found");
    }

    await enforcePermission(shop.id, "view_finance");

    return db.query.costCenters.findMany({
        where: eq(costCenters.shopId, shop.id),
        orderBy: [asc(costCenters.code)],
    });
}

/**
 * Create a new cost center
 */
export async function createCostCenter(shopSlug: string, input: CreateCostCenterInput) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        return { success: false, error: "Workspace not found" };
    }

    await enforcePermission(shop.id, "manage_settings");

    if (!input.code.trim() || !input.name.trim()) {
        return { success: false, error: "Cost center code and name are required." };
    }

    try {
        const [newCenter] = await db.insert(costCenters).values({
            shopId: shop.id,
            code: input.code.trim().toUpperCase(),
            name: input.name.trim(),
            department: input.department?.trim() || null,
            isActive: true,
        }).returning();

        revalidatePath(`/workspaces/${shopSlug}/finance/cost-centers`);
        revalidatePath(`/workspaces/${shopSlug}/finance/ledger`);

        return { success: true, costCenter: newCenter };
    } catch (err: any) {
        if (err.message?.includes("unique") || err.code === "23505") {
            return { success: false, error: `A cost center with code "${input.code}" already exists.` };
        }
        return { success: false, error: err.message || "Failed to create cost center." };
    }
}

/**
 * Update an existing cost center
 */
export async function updateCostCenter(id: string, shopSlug: string, input: UpdateCostCenterInput) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        return { success: false, error: "Workspace not found" };
    }

    await enforcePermission(shop.id, "manage_settings");

    try {
        const updateData: Partial<typeof costCenters.$inferInsert> = {};
        if (input.code) updateData.code = input.code.trim().toUpperCase();
        if (input.name) updateData.name = input.name.trim();
        if (input.department !== undefined) updateData.department = input.department?.trim() || null;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        await db.update(costCenters).set(updateData).where(
            and(eq(costCenters.id, id), eq(costCenters.shopId, shop.id))
        );

        revalidatePath(`/workspaces/${shopSlug}/finance/cost-centers`);
        revalidatePath(`/workspaces/${shopSlug}/finance/ledger`);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update cost center." };
    }
}

/**
 * Delete a cost center (if not linked to journal entries)
 */
export async function deleteCostCenter(id: string, shopSlug: string) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        return { success: false, error: "Workspace not found" };
    }

    await enforcePermission(shop.id, "manage_settings");

    // Check if journal entries exist for this cost center
    const linkedJournals = await db.query.journalEntries.findMany({
        where: and(eq(journalEntries.shopId, shop.id), eq(journalEntries.costCenterId, id)),
        limit: 1,
    });

    if (linkedJournals.length > 0) {
        return {
            success: false,
            error: "Cannot delete cost center that is referenced by posted journal entries. You can deactivate it instead.",
        };
    }

    await db.delete(costCenters).where(
        and(eq(costCenters.id, id), eq(costCenters.shopId, shop.id))
    );

    revalidatePath(`/workspaces/${shopSlug}/finance/cost-centers`);
    revalidatePath(`/workspaces/${shopSlug}/finance/ledger`);

    return { success: true };
}
