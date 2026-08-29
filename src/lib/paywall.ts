import { db } from "@/db";
import { shops, shopMembers, stockLocations } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export interface PlanDefinition {
    id: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
    name: string;
    tagline: string;
    priceKesMonthly: number;
    maxMembers: number;
    maxLocations: number;
    canTransferStock: boolean;
    hasGeneralLedger: boolean;
    hasReconciliation: boolean;
    hasStatutoryPayroll: boolean;
    hasApiAccess: boolean;
    features: string[];
}

export const PLAN_SPECS: Record<string, PlanDefinition> = {
    FREE: {
        id: "FREE",
        name: "Free Starter",
        tagline: "Essential walk-in invoicing & POS for sole operators",
        priceKesMonthly: 0,
        maxMembers: 1,
        maxLocations: 1,
        canTransferStock: false,
        hasGeneralLedger: false,
        hasReconciliation: false,
        hasStatutoryPayroll: false,
        hasApiAccess: false,
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
        maxMembers: 3,
        maxLocations: 3,
        canTransferStock: true,
        hasGeneralLedger: false,
        hasReconciliation: false,
        hasStatutoryPayroll: true,
        hasApiAccess: false,
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
        maxMembers: 10,
        maxLocations: Infinity,
        canTransferStock: true,
        hasGeneralLedger: true,
        hasReconciliation: true,
        hasStatutoryPayroll: true,
        hasApiAccess: false,
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
        maxMembers: Infinity,
        maxLocations: Infinity,
        canTransferStock: true,
        hasGeneralLedger: true,
        hasReconciliation: true,
        hasStatutoryPayroll: true,
        hasApiAccess: true,
        features: [
            "Everything in Professional",
            "Unlimited Team Members & Locations",
            "Dedicated Support & Custom SLAs",
            "Automated Offsite Backup Snapshots",
            "Direct eTIMS VSCU API Connectivity",
        ],
    },
};

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
    });

    if (!shop) return null;

    // Determine effective plan tier
    const rawPlan = (shop.plan || "PRO").toUpperCase();
    const effectivePlanKey = (rawPlan in PLAN_SPECS) ? rawPlan : "PRO";
    const baseSpec = PLAN_SPECS[effectivePlanKey];

    // Lifetime PRO automatically gets Enterprise limits with no expiration
    const isLifetimePro = Boolean(shop.isLifetimePro);

    const expiresAt = shop.subscriptionExpiresAt ? new Date(shop.subscriptionExpiresAt) : null;
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

    const planSpec = isLifetimePro ? PLAN_SPECS.ENTERPRISE : (isExpired ? PLAN_SPECS.FREE : baseSpec);

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
 * Throws an Error if the quota limit is reached.
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
 * Throws an Error if the quota limit is reached.
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
