import { db } from "@/db";
import { shops, shopMembers, stockLocations, platformPlans } from "@/db/schema";
import { count, eq, asc, and } from "drizzle-orm";

export interface PlanDefinition {
    id: string; // 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' | custom tier ID
    name: string;
    tagline: string;
    priceKesMonthly: number;
    priceKesAnnually: number;
    annualDiscountPercent: number;
    /** Promotional override — if set, shown as the current price with original slashed through */
    discountedPriceMonthly?: number | null;
    discountedPriceAnnually?: number | null;
    maxMembers: number;
    maxLocations: number;
    canTransferStock: boolean;
    hasGeneralLedger: boolean;
    hasReconciliation: boolean;
    hasStatutoryPayroll: boolean;
    hasApiAccess: boolean;
    badge?: string | null;
    isHighlighted?: boolean;
    features: string[];
}

export const PLAN_SPECS: Record<string, PlanDefinition> = {
    FREE: {
        id: "FREE",
        name: "Free Starter",
        tagline: "Essential walk-in invoicing & POS for sole operators",
        priceKesMonthly: 0,
        priceKesAnnually: 0,
        annualDiscountPercent: 0,
        maxMembers: 1,
        maxLocations: 1,
        canTransferStock: false,
        hasGeneralLedger: false,
        hasReconciliation: false,
        hasStatutoryPayroll: false,
        hasApiAccess: false,
        badge: null,
        isHighlighted: false,
        features: [
            "1 Workspace & 1 Team Member (Owner)",
            "Single Stock Location (Main Store)",
            "Standard Quotes, Invoices & Receipts",
            "Walk-in POS & 58mm/80mm Thermal Receipt Slips",
            "KRA eTIMS CU QR Verification",
            "Client Statement of Account Ledgers",
        ],
    },
    BASIC: {
        id: "BASIC",
        name: "Basic",
        tagline: "Team collaboration & multi-node stock for growing retail shops",
        priceKesMonthly: 1500,
        priceKesAnnually: 14400, // 20% discount: 1500 * 12 * 0.8 = 14,400 (equiv to 1,200/mo)
        annualDiscountPercent: 20,
        maxMembers: 3,
        maxLocations: 3,
        canTransferStock: true,
        hasGeneralLedger: false,
        hasReconciliation: false,
        hasStatutoryPayroll: true,
        hasApiAccess: false,
        badge: null,
        isHighlighted: false,
        features: [
            "Everything in Free Starter",
            "Up to 3 Team Members with Granular Roles",
            "Up to 3 Stock Locations (Main, Backroom, Branch)",
            "Inter-Branch Stock Transfers with Audit Logs",
            "Statutory Payroll (PAYE, SHIF, Housing Levy, NSSF)",
            "Expense & Operational Cost Tracking",
            "Tax Wear & Tear and VAT Return Trackers",
        ],
    },
    PRO: {
        id: "PRO",
        name: "Professional",
        tagline: "Full double-entry general ledger & unlimited warehouse inventory",
        priceKesMonthly: 3500,
        priceKesAnnually: 33600, // 20% discount: 3500 * 12 * 0.8 = 33,600 (equiv to 2,800/mo)
        annualDiscountPercent: 20,
        maxMembers: 10,
        maxLocations: Infinity,
        canTransferStock: true,
        hasGeneralLedger: true,
        hasReconciliation: true,
        hasStatutoryPayroll: true,
        hasApiAccess: false,
        badge: "Most Popular",
        isHighlighted: true,
        features: [
            "Everything in Basic",
            "Up to 10 Team Members across Workspaces",
            "CRM Deals Pipeline & Visual Kanban Board",
            "Tiered Proposals with Client e-Signatures",
            "Retainer Contracts, SLAs & Project Workspaces",
            "Full Double-Entry General Ledger (GL)",
            "Balance Sheet & Real-time Trial Balance / P&L",
            "Bank & M-Pesa Cash Account Reconciliation Tool",
            "FIFO Inventory Asset Valuation Engine",
            "Multi-Currency Transaction Ledgers",
        ],
    },
    ENTERPRISE: {
        id: "ENTERPRISE",
        name: "Enterprise",
        tagline: "Unlimited high-volume capacity & custom integrations",
        priceKesMonthly: 10000,
        priceKesAnnually: 96000, // 20% discount
        annualDiscountPercent: 20,
        maxMembers: Infinity,
        maxLocations: Infinity,
        canTransferStock: true,
        hasGeneralLedger: true,
        hasReconciliation: true,
        hasStatutoryPayroll: true,
        hasApiAccess: true,
        badge: "Custom SLA",
        isHighlighted: false,
        features: [
            "Everything in Professional",
            "Unlimited Team Members & Locations",
            "Dedicated Support & Custom SLAs",
            "Automated Offsite Backup Snapshots",
        ],
    },
};

/**
 * Retrieves dynamically configured plans from the database.
 * Auto-seeds default tiers if table is empty.
 */
export async function getDynamicPlanSpecs(): Promise<Record<string, PlanDefinition>> {
    try {
        const rows = await db.query.platformPlans.findMany({
            orderBy: [asc(platformPlans.displayOrder)],
        });

        if (rows.length === 0) {
            // Auto-seed default plans into database
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
                    }).onConflictDoNothing()
                )
            );
            return PLAN_SPECS;
        }

        const map: Record<string, PlanDefinition> = {};
        for (const row of rows) {
            let features: string[] = [];
            try {
                features = JSON.parse(row.featuresJson);
            } catch {
                features = [];
            }

            map[row.id] = {
                id: row.id as any,
                name: row.name,
                tagline: row.tagline,
                priceKesMonthly: row.priceKesMonthly,
                priceKesAnnually: row.priceKesAnnually,
                annualDiscountPercent: row.annualDiscountPercent,
                discountedPriceMonthly: row.discountedPriceMonthly ?? null,
                discountedPriceAnnually: row.discountedPriceAnnually ?? null,
                maxMembers: row.maxMembers === -1 ? Infinity : Math.max(1, Number(row.maxMembers ?? 1)),
                maxLocations: row.maxLocations === -1 ? Infinity : Math.max(1, Number(row.maxLocations ?? 1)),
                canTransferStock: row.canTransferStock,
                hasGeneralLedger: row.hasGeneralLedger,
                hasReconciliation: row.hasReconciliation,
                hasStatutoryPayroll: row.hasStatutoryPayroll,
                hasApiAccess: row.hasApiAccess,
                badge: row.badge,
                isHighlighted: row.isHighlighted,
                features,
            };
        }

        return map;
    } catch (error) {
        console.error("Error fetching dynamic plan specs, falling back to static specs:", error);
        return PLAN_SPECS;
    }
}

export interface ShopPlanDetails {
    shopId: string;
    shopName: string;
    slug: string;
    plan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
    planSpec: PlanDefinition;
    isLifetimePro: boolean;
    isSuspended: boolean;
    subscriptionStatus: string;
    isExpired: boolean;
    inGracePeriod: boolean;
    graceDaysRemaining: number | null;
    gracePeriodEndsAt: Date | null;
    isSoftLocked: boolean;
    daysRemaining: number | null;
    expiresAt: Date | null;
    currentMembersCount: number;
    currentLocationsCount: number;
    canAddMember: boolean;
    canAddLocation: boolean;
    canTransferStock: boolean;
    canAccessGL: boolean;
    canAccessReconciliation: boolean;
    canAccessPayroll: boolean;
}

import { apiClient } from "@/lib/api/client";

/**
 * Resolves full plan limits, active subscription status, and usage statistics for a shop tenant.
 */
export async function getShopPlanDetails(shopId: string): Promise<ShopPlanDetails | null> {
    const freeSpec = PLAN_SPECS.FREE;
    try {
        const apiRes = await apiClient<{ success: boolean; planDetails: any }>(`/v1/workspaces/${shopId}/plan-details`);
        if (apiRes.data?.success && apiRes.data.planDetails) {
            const pd = apiRes.data.planDetails;
            const spec: PlanDefinition = pd.planSpec || freeSpec;
            const memCnt = Number(pd.usage?.membersCount ?? 1);
            const locCnt = Number(pd.usage?.locationsCount ?? 1);

            return {
                shopId: pd.shopId || shopId,
                shopName: pd.shopName || "Workspace",
                slug: pd.slug || "",
                plan: (pd.plan || "FREE") as any,
                planSpec: spec,
                isLifetimePro: Boolean(pd.isLifetimePro),
                isSuspended: Boolean(pd.isSuspended),
                subscriptionStatus: pd.subscriptionStatus || "ACTIVE",
                isExpired: Boolean(pd.isExpired),
                inGracePeriod: Boolean(pd.inGracePeriod),
                graceDaysRemaining: pd.graceDaysRemaining ?? null,
                gracePeriodEndsAt: pd.graceEndsAt ? new Date(pd.graceEndsAt) : null,
                isSoftLocked: Boolean(pd.isExpired),
                daysRemaining: pd.daysRemaining ?? null,
                expiresAt: pd.expiresAt ? new Date(pd.expiresAt) : null,
                currentMembersCount: memCnt,
                currentLocationsCount: locCnt,
                canAddMember: memCnt < spec.maxMembers,
                canAddLocation: locCnt < spec.maxLocations,
                canTransferStock: spec.canTransferStock,
                canAccessGL: spec.hasGeneralLedger,
                canAccessReconciliation: spec.hasReconciliation,
                canAccessPayroll: spec.hasStatutoryPayroll,
            };
        }
    } catch (e) {
        console.warn("[getShopPlanDetails] API fetch failed, falling back", e);
    }

    return {
        shopId,
        shopName: "Workspace",
        slug: "",
        plan: "FREE",
        planSpec: freeSpec,
        isLifetimePro: false,
        isSuspended: false,
        subscriptionStatus: "ACTIVE",
        isExpired: false,
        inGracePeriod: false,
        graceDaysRemaining: null,
        gracePeriodEndsAt: null,
        isSoftLocked: false,
        daysRemaining: null,
        expiresAt: null,
        currentMembersCount: 1,
        currentLocationsCount: 1,
        canAddMember: false,
        canAddLocation: false,
        canTransferStock: freeSpec.canTransferStock,
        canAccessGL: freeSpec.hasGeneralLedger,
        canAccessReconciliation: freeSpec.hasReconciliation,
        canAccessPayroll: freeSpec.hasStatutoryPayroll,
    };
}


/**
 * Asserts that the shop tenant can invite or add another team member.
 */
export async function assertCanAddMember(shopId: string) {
    const details = await getShopPlanDetails(shopId);
    if (!details) throw new Error("Target workspace not found.");

    if (!details.canAddMember) {
        const maxDisplay = details.planSpec.maxMembers === Infinity ? "Unlimited" : details.planSpec.maxMembers;
        throw new Error(
            `Workspace member limit reached (${details.currentMembersCount}/${maxDisplay}). Upgrade your plan to invite additional team members.`
        );
    }
}

/**
 * Asserts that the shop tenant can create an additional physical stock location.
 */
export async function assertCanAddLocation(shopId: string) {
    const details = await getShopPlanDetails(shopId);
    if (!details) throw new Error("Target workspace not found.");

    if (!details.canAddLocation) {
        const maxDisplay = details.planSpec.maxLocations === Infinity ? "Unlimited" : details.planSpec.maxLocations;
        throw new Error(
            `Stock location limit reached (${details.currentLocationsCount}/${maxDisplay}). Basic supports up to 3 locations; upgrade to Professional for unlimited warehouses.`
        );
    }
}

/**
 * Asserts that the shop tenant has Inter-Branch Stock Transfers enabled.
 */
export async function assertCanTransferStock(shopId: string) {
    const details = await getShopPlanDetails(shopId);
    if (!details) throw new Error("Target workspace not found.");

    if (!details.canTransferStock) {
        throw new Error(
            "Inter-branch stock transfers require a Basic or Professional subscription."
        );
    }
}

/**
 * Asserts that the shop tenant has access to the General Ledger & Balance Sheet suite.
 */
export async function assertCanAccessGL(shopId: string) {
    const details = await getShopPlanDetails(shopId);
    if (!details) throw new Error("Target workspace not found.");

    if (!details.canAccessGL) {
        throw new Error(
            "The full General Ledger suite (Balance Sheet, Trial Balance, Cash Flow) requires a Professional subscription."
        );
    }
}

/**
 * Asserts that the shop tenant has access to the Bank & M-Pesa Reconciliation tool.
 */
export async function assertCanAccessReconciliation(shopId: string) {
    const details = await getShopPlanDetails(shopId);
    if (!details) throw new Error("Target workspace not found.");

    if (!details.canAccessReconciliation) {
        throw new Error(
            "The Bank & M-Pesa Reconciliation tool requires a Professional subscription."
        );
    }
}
