"use server";

import { db } from "@/db";
import { platformPlans } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { enforceSuperAdmin } from "./admin";
import { getDynamicPlanSpecs, PLAN_SPECS, type PlanDefinition } from "@/lib/paywall";
import { revalidatePath } from "next/cache";

export interface UpdatePlatformPlanInput {
    id: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
    name: string;
    tagline: string;
    priceKesMonthly: number;
    priceKesAnnually: number;
    annualDiscountPercent: number;
    maxMembers: number; // -1 for unlimited
    maxLocations: number; // -1 for unlimited
    canTransferStock: boolean;
    hasGeneralLedger: boolean;
    hasReconciliation: boolean;
    hasStatutoryPayroll: boolean;
    hasApiAccess: boolean;
    badge?: string | null;
    isHighlighted: boolean;
    features: string[];
    isActive: boolean;
}

/**
 * Fetches all platform plan definitions for the Super Admin management terminal.
 */
export async function getAdminPlatformPlans() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin required." };
    }

    try {
        const dynamicSpecs = await getDynamicPlanSpecs();
        return {
            success: true,
            plans: Object.values(dynamicSpecs),
        };
    } catch (error: any) {
        console.error("Failed to load platform plans:", error);
        return { success: false, error: error.message || "Failed to load pricing plans." };
    }
}

/**
 * Updates a platform plan's pricing, quotas, features, and display metadata.
 */
export async function updatePlatformPlanAction(input: UpdatePlatformPlanInput) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin required." };
    }

    try {
        const targetId = input.id.toUpperCase();
        if (!["FREE", "BASIC", "PRO", "ENTERPRISE"].includes(targetId)) {
            return { success: false, error: "Invalid plan ID." };
        }

        const monthly = Math.max(0, Number(input.priceKesMonthly) || 0);
        let annual = Number(input.priceKesAnnually);
        const discountPercent = Math.max(0, Math.min(99, Number(input.annualDiscountPercent) || 20));

        // If annual is not provided or 0 for a paid plan, auto-calculate with discount
        if ((!annual || annual <= 0) && monthly > 0) {
            annual = Math.round(monthly * 12 * (1 - discountPercent / 100));
        } else if (monthly === 0) {
            annual = 0;
        }

        const featuresClean = Array.isArray(input.features)
            ? input.features.filter((f) => typeof f === "string" && f.trim().length > 0)
            : [];

        await db.insert(platformPlans).values({
            id: targetId,
            name: input.name.trim(),
            tagline: input.tagline.trim(),
            priceKesMonthly: monthly,
            priceKesAnnually: annual,
            annualDiscountPercent: discountPercent,
            maxMembers: input.maxMembers,
            maxLocations: input.maxLocations,
            canTransferStock: Boolean(input.canTransferStock),
            hasGeneralLedger: Boolean(input.hasGeneralLedger),
            hasReconciliation: Boolean(input.hasReconciliation),
            hasStatutoryPayroll: Boolean(input.hasStatutoryPayroll),
            hasApiAccess: Boolean(input.hasApiAccess),
            badge: input.badge?.trim() || null,
            isHighlighted: Boolean(input.isHighlighted),
            featuresJson: JSON.stringify(featuresClean),
            isActive: Boolean(input.isActive),
            updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: platformPlans.id,
            set: {
                name: input.name.trim(),
                tagline: input.tagline.trim(),
                priceKesMonthly: monthly,
                priceKesAnnually: annual,
                annualDiscountPercent: discountPercent,
                maxMembers: input.maxMembers,
                maxLocations: input.maxLocations,
                canTransferStock: Boolean(input.canTransferStock),
                hasGeneralLedger: Boolean(input.hasGeneralLedger),
                hasReconciliation: Boolean(input.hasReconciliation),
                hasStatutoryPayroll: Boolean(input.hasStatutoryPayroll),
                hasApiAccess: Boolean(input.hasApiAccess),
                badge: input.badge?.trim() || null,
                isHighlighted: Boolean(input.isHighlighted),
                featuresJson: JSON.stringify(featuresClean),
                isActive: Boolean(input.isActive),
                updatedAt: new Date(),
            },
        });

        revalidatePath("/pricing");
        revalidatePath("/admin/pricing");
        revalidatePath("/admin/workspaces");

        return { success: true, message: `Updated ${input.name} plan successfully.` };
    } catch (error: any) {
        console.error("Failed to update platform plan:", error);
        return { success: false, error: error.message || "Failed to update plan." };
    }
}

/**
 * Resets all platform plans to the default baseline configuration.
 */
export async function resetDefaultPlatformPlansAction() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin required." };
    }

    try {
        await Promise.all(
            Object.values(PLAN_SPECS).map((p, idx) =>
                db.insert(platformPlans).values({
                    id: p.id,
                    name: p.name,
                    tagline: p.tagline,
                    priceKesMonthly: p.priceKesMonthly,
                    priceKesAnnually: p.priceKesAnnually,
                    annualDiscountPercent: p.annualDiscountPercent,
                    maxMembers: p.maxMembers === Infinity ? -1 : p.maxMembers,
                    maxLocations: p.maxLocations === Infinity ? -1 : p.maxLocations,
                    canTransferStock: p.canTransferStock,
                    hasGeneralLedger: p.hasGeneralLedger,
                    hasReconciliation: p.hasReconciliation,
                    hasStatutoryPayroll: p.hasStatutoryPayroll,
                    hasApiAccess: p.hasApiAccess,
                    badge: p.badge,
                    isHighlighted: p.isHighlighted || false,
                    featuresJson: JSON.stringify(p.features),
                    isActive: true,
                    displayOrder: idx,
                    updatedAt: new Date(),
                }).onConflictDoUpdate({
                    target: platformPlans.id,
                    set: {
                        name: p.name,
                        tagline: p.tagline,
                        priceKesMonthly: p.priceKesMonthly,
                        priceKesAnnually: p.priceKesAnnually,
                        annualDiscountPercent: p.annualDiscountPercent,
                        maxMembers: p.maxMembers === Infinity ? -1 : p.maxMembers,
                        maxLocations: p.maxLocations === Infinity ? -1 : p.maxLocations,
                        canTransferStock: p.canTransferStock,
                        hasGeneralLedger: p.hasGeneralLedger,
                        hasReconciliation: p.hasReconciliation,
                        hasStatutoryPayroll: p.hasStatutoryPayroll,
                        hasApiAccess: p.hasApiAccess,
                        badge: p.badge,
                        isHighlighted: p.isHighlighted || false,
                        featuresJson: JSON.stringify(p.features),
                        isActive: true,
                        displayOrder: idx,
                        updatedAt: new Date(),
                    },
                })
            )
        );

        revalidatePath("/pricing");
        revalidatePath("/admin/pricing");

        return { success: true, message: "Reset all plans to standard defaults." };
    } catch (error: any) {
        console.error("Failed to reset plans:", error);
        return { success: false, error: error.message || "Failed to reset plans." };
    }
}
