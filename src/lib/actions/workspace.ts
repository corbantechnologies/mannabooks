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