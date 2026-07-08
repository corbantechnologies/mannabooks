"use server";

import { db } from "@/db";
import { shops, shopMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifyAndGetSession } from "./auth";
import { revalidatePath } from "next/cache";

import { cache } from "react";

/**
 * Server-side security guard that extracts session credentials, 
 * verifies tenant membership, and returns the active shop context.
 */
export const getActiveWorkspaceContext = cache(async function getActiveWorkspaceContext(slug: string) {
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
});

interface UpdateShopSettingsInput {
    shopId: string;
    name: string;
    shortName?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    primaryColor?: string;
    taxPin?: string;
    email?: string;
    isVatRegistered: boolean;
    vatNumber?: string;
    currency: string;
    fiscalYearStartMonth: number;
}

/**
 * Persists modifications to the merchant's brand and compliance criteria.
 */
export async function updateShopSettings(input: UpdateShopSettingsInput) {
    try {
        // Re-verify authorization parameters before running mutation
        const sessionRecord = await verifyAndGetSession();
        if (!sessionRecord) return { success: false, error: "Authentication expired." };

        let primaryColor = input.primaryColor?.trim() || "#000000";
        if (primaryColor && !primaryColor.startsWith("#")) {
            primaryColor = `#${primaryColor}`;
        }

        await db.update(shops)
            .set({
                name: input.name.trim(),
                shortName: input.shortName?.trim() || null,
                phone: input.phone?.trim() || null,
                website: input.website?.trim() || null,
                logoUrl: input.logoUrl?.trim() || null,
                primaryColor,
                taxPin: input.taxPin?.trim() || null,
                email: input.email?.trim() || null,
                isVatRegistered: input.isVatRegistered,
                vatNumber: input.isVatRegistered ? (input.vatNumber?.trim() || null) : null, // Set to null if not VAT registered
                currency: input.currency.toUpperCase().trim(),
                fiscalYearStartMonth: input.fiscalYearStartMonth,
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

export async function disableOnboardingGuideAction(shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context." };

    try {
        await db.update(shops)
            .set({ hideOnboarding: true })
            .where(eq(shops.id, shopId));

        revalidatePath(`/workspaces/${shopSlug}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to dismiss guide." };
    }
}