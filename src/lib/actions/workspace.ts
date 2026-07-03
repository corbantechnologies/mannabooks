"use server";

import { db } from "@/db";
import { shops, shopMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifyAndGetSession } from "./auth";

/**
 * Server-side security guard that extracts session credentials, 
 * verifies tenant membership, and returns the active shop context.
 */
export async function getActiveWorkspaceContext(slug: string) {
    // 1. Authenticate the active session cookie
    const sessionRecord = await verifyAndGetSession();
    if (!sessionRecord) {
        redirect("/login");
    }

    // 2. Locate the requested shop profile by its unique URL slug
    const shopProfile = await db.query.shops.findFirst({
        where: eq(shops.slug, slug),
    });

    if (!shopProfile) {
        redirect("/dashboard");
    }

    // 3. Verify that this specific user is an active member/owner of this shop
    const membership = await db.query.shopMembers.findFirst({
        where: and(
            eq(shopMembers.shopId, shopProfile.id),
            eq(shopMembers.userId, sessionRecord.userId),
            eq(shopMembers.isActive, true)
        ),
    });

    if (!membership) {
        redirect("/dashboard"); // Unauthorized access attempt; bounce to safe root proxy
    }

    return {
        user: sessionRecord.user,
        shop: shopProfile,
        role: membership.role,
    };
}

interface UpdateShopSettingsInput {
    shopId: string;
    name: string;
    taxPin?: string;
    isVatRegistered: boolean;
    currency: string;
}

/**
 * Persists modifications to the merchant's brand and compliance criteria.
 */
export async function updateShopSettings(input: UpdateShopSettingsInput) {
    try {
        // Re-verify authorization parameters before running mutation
        const sessionRecord = await verifyAndGetSession();
        if (!sessionRecord) return { success: false, error: "Authentication expired." };

        await db.update(shops)
            .set({
                name: input.name.trim(),
                taxPin: input.taxPin?.toUpperCase().trim() || null,
                isVatRegistered: input.isVatRegistered,
                currency: input.currency.toUpperCase().trim(),
            })
            .where(eq(shops.id, input.shopId));

        return { success: true };
    } catch (error) {
        console.error("Failed to commit shop settings changes:", error);
        return { success: false, error: "Failed to persist compliance updates." };
    }
}

/**
 * Server action to create an additional shop
 */
export async function createAdditionalShop(input: { userId: string; businessName: string; currency: string }) {
    const baseSlug = input.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const existingSlug = await db.query.shops.findFirst({ where: eq(shops.slug, baseSlug) });
    const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const [newShop] = await db.insert(shops).values({
        ownerId: input.userId,
        name: input.businessName.trim(),
        slug: finalSlug,
        currency: input.currency,
        primaryColor: "#000000",
        isVatRegistered: false,
    }).returning();

    await db.insert(shopMembers).values({
        shopId: newShop.id,
        userId: input.userId,
        role: "OWNER",
        isActive: true,
    });

    return { success: true as const, shopSlug: newShop.slug };
}