import { db } from "@/db";
import { shops, shopMembers, stockLocations, platformPlans } from "@/db/schema";
import { count, eq, asc } from "drizzle-orm";

export interface PlanDefinition {
    id: string; // 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' | custom tier ID
    name: string;
    tagline: string;
    priceKesMonthly: number;
    priceKesAnnually: number;
    annualDiscountPercent: number;
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
            "Unlimited Physical Locations & Warehouses",
            "Full Double-Entry General Ledger (GL)",
            "Balance Sheet (Statement of Financial Position)",
            "Real-time Trial Balance & P&L Statement",
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
            "Direct eTIMS VSCU API Connectivity",
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
                maxMembers: row.maxMembers === -1 ? Infinity : row.maxMembers,
                maxLocations: row.maxLocations === -1 ? Infinity : row.maxLocations,
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

/**
 * Resolves full plan limits, active subscription status, and usage statistics for a shop tenant.
 */
export async function getShopPlanDetails(shopId: string): Promise<ShopPlanDetails | null> {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.id, shopId),
        with: {
            owner: true,
        },
    });

    if (!shop) return null;

    const dynamicSpecs = await getDynamicPlanSpecs();

    // In User-Centric Billing: the plan tier and expiration are governed by the Owner User Account
    const isLifetimePro = Boolean(
        shop.owner?.isLifetimePro ||
        shop.owner?.isSuperAdmin ||
        shop.isLifetimePro
    );

    const rawPlan = isLifetimePro ? "PRO" : ((shop.owner?.plan || "FREE").toUpperCase());
    const effectivePlanKey = (rawPlan in dynamicSpecs) ? rawPlan : "FREE";
    const baseSpec = dynamicSpecs[effectivePlanKey] || PLAN_SPECS[effectivePlanKey] || PLAN_SPECS.FREE;

    const expiresAt = shop.owner?.subscriptionExpiresAt ? new Date(shop.owner.subscriptionExpiresAt) : null;
    const isExpired = !isLifetimePro && expiresAt !== null && Date.now() > expiresAt.getTime();

    const daysRemaining = expiresAt
        ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    // Count active members and locations
    const [memberCountRes, locationCountRes] = await Promise.all([
        db.select({ value: count() }).from(shopMembers).where(eq(shopMembers.shopId, shopId)),
        db.select({ value: count() }).from(stockLocations).where(eq(stockLocations.shopId, shopId)),
    ]);

    const currentMembersCount = memberCountRes[0]?.value || 1;
    const currentLocationsCount = locationCountRes[0]?.value || 1;

    const enterpriseSpec = dynamicSpecs.ENTERPRISE || PLAN_SPECS.ENTERPRISE;
    const freeSpec = dynamicSpecs.FREE || PLAN_SPECS.FREE;
    const planSpec = isLifetimePro ? enterpriseSpec : (isExpired ? freeSpec : baseSpec);

    return {
        shopId: shop.id,
        shopName: shop.name,
        slug: shop.slug,
        plan: isLifetimePro ? "PRO" : (effectivePlanKey as any),
        planSpec,
        isLifetimePro,
        isSuspended: shop.isSuspended,
        subscriptionStatus: isLifetimePro ? "LIFETIME_FREE" : (isExpired ? "EXPIRED" : (shop.subscriptionStatus || "ACTIVE")),
        isExpired,
        daysRemaining,
        expiresAt,
        currentMembersCount,
        currentLocationsCount,
        canAddMember: currentMembersCount < planSpec.maxMembers,
        canAddLocation: currentLocationsCount < planSpec.maxLocations,
        canTransferStock: planSpec.canTransferStock,
        canAccessGL: planSpec.hasGeneralLedger,
        canAccessReconciliation: planSpec.hasReconciliation,
        canAccessPayroll: planSpec.hasStatutoryPayroll,
    };
}

/**
 * Asserts that the shop tenant can invite or add another team member.
 */
export async function assertCanAddMember(shopId: string) {
    const details = await getShopPlanDetails(shopId);
    if (!details) throw new Error("Target workspace not found.");

    if (!details.canAddMember) {
        throw new Error(
            `Workspace member limit reached (${details.currentMembersCount}/${details.planSpec.maxMembers}). Upgrade your plan to invite additional team members.`
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
        throw new Error(
            `Stock location limit reached (${details.currentLocationsCount}/${details.planSpec.maxLocations}). Basic supports up to 3 locations; upgrade to Professional for unlimited warehouses.`
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
