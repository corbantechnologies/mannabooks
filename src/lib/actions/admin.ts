"use server";

import { db } from "@/db";
import { users, shops, documents, shopMembers, stockLocations, productLocationStock } from "@/db/schema";
import { count, eq, and, sql, desc, ilike, or } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { revalidatePath } from "next/cache";

/**
 * Validates the current session and ensures the user is a Super Admin.
 */
export async function enforceSuperAdmin() {
    const session = await verifyAndGetSession();
    if (!session || !session.user) {
        return null;
    }

    if (!session.user.isSuperAdmin) {
        return null;
    }

    return session.user;
}

/**
 * Fetches platform-wide statistics for the global admin dashboard.
 */
export async function getPlatformStats() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const [
            totalUsersRes,
            totalShopsRes,
            totalDocsRes,
            totalTurnoverRes,
            lifetimeProRes,
            suspendedShopsRes,
            recentShops,
            recentUsers
        ] = await Promise.all([
            db.select({ value: count() }).from(users),
            db.select({ value: count() }).from(shops),
            db.select({ value: count() }).from(documents),
            db.select({
                sum: sql<string>`COALESCE(SUM(CAST(${documents.grandTotal} AS NUMERIC)), 0)`
            }).from(documents).where(or(eq(documents.status, "PAID"), eq(documents.status, "ISSUED"))),
            db.select({ value: count() }).from(shops).where(eq(shops.isLifetimePro, true)),
            db.select({ value: count() }).from(shops).where(eq(shops.isSuspended, true)),
            db.query.shops.findMany({
                orderBy: [desc(shops.createdAt)],
                limit: 6,
                with: {
                    owner: true,
                }
            }),
            db.query.users.findMany({
                orderBy: [desc(users.createdAt)],
                limit: 6,
            })
        ]);

        const totalUsers = totalUsersRes[0]?.value || 0;
        const totalWorkspaces = totalShopsRes[0]?.value || 0;
        const totalDocuments = totalDocsRes[0]?.value || 0;
        const totalTurnover = parseFloat(totalTurnoverRes[0]?.sum || "0");
        const lifetimeProCount = lifetimeProRes[0]?.value || 0;
        const suspendedCount = suspendedShopsRes[0]?.value || 0;

        return {
            success: true,
            stats: {
                users: totalUsers,
                workspaces: totalWorkspaces,
                documents: totalDocuments,
                turnover: totalTurnover,
                lifetimeProCount,
                suspendedCount,
                recentShops,
                recentUsers,
            }
        };
    } catch (error) {
        console.error("Failed to fetch platform stats:", error);
        return { success: false, error: "Failed to read analytics from the database." };
    }
}

export interface GetAdminWorkspacesInput {
    search?: string;
    planFilter?: string; // 'ALL' | 'LIFETIME_PRO' | 'PRO' | 'STARTER' | 'FREE' | 'SUSPENDED'
    page?: number;
    limit?: number;
}

/**
 * Fetches the paginated tenant workspace directory with owner details & document counts.
 */
export async function getAdminWorkspacesList(input?: GetAdminWorkspacesInput) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const search = input?.search?.trim() || "";
        const planFilter = input?.planFilter || "ALL";
        const page = input?.page || 1;
        const limit = input?.limit || 20;
        const offset = (page - 1) * limit;

        // Fetch all matching shops
        const allShops = await db.query.shops.findMany({
            orderBy: [desc(shops.createdAt)],
            with: {
                owner: true,
                members: {
                    with: {
                        user: true
                    }
                }
            }
        });

        // Filter in memory for rich multi-field matching
        let filtered = allShops;

        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(shop =>
                shop.name.toLowerCase().includes(s) ||
                shop.slug.toLowerCase().includes(s) ||
                (shop.taxPin && shop.taxPin.toLowerCase().includes(s)) ||
                (shop.owner && shop.owner.email.toLowerCase().includes(s)) ||
                (shop.owner && shop.owner.name.toLowerCase().includes(s))
            );
        }

        if (planFilter === "LIFETIME_PRO") {
            filtered = filtered.filter(shop => shop.isLifetimePro);
        } else if (planFilter === "SUSPENDED") {
            filtered = filtered.filter(shop => shop.isSuspended);
        } else if (planFilter !== "ALL") {
            filtered = filtered.filter(shop => shop.plan?.toUpperCase() === planFilter.toUpperCase());
        }

        const totalCount = filtered.length;
        const paginatedShops = filtered.slice(offset, offset + limit);

        // Fetch document counts for these paginated shops
        const shopSummaries = await Promise.all(
            paginatedShops.map(async (shop) => {
                const [docCountRes, turnoverRes] = await Promise.all([
                    db.select({ value: count() }).from(documents).where(eq(documents.shopId, shop.id)),
                    db.select({
                        sum: sql<string>`COALESCE(SUM(CAST(${documents.grandTotal} AS NUMERIC)), 0)`
                    }).from(documents).where(and(eq(documents.shopId, shop.id), or(eq(documents.status, "PAID"), eq(documents.status, "ISSUED"))))
                ]);

                return {
                    id: shop.id,
                    name: shop.name,
                    shortName: shop.shortName,
                    slug: shop.slug,
                    taxPin: shop.taxPin,
                    currency: shop.currency || "KES",
                    primaryColor: shop.primaryColor,
                    phone: shop.phone,
                    email: shop.email,
                    website: shop.website,
                    isVatRegistered: shop.isVatRegistered,
                    isGlEnabled: shop.isGlEnabled,
                    plan: shop.plan || "FREE",
                    subscriptionStatus: shop.subscriptionStatus || "ACTIVE",
                    isLifetimePro: shop.isLifetimePro || false,
                    isSuspended: shop.isSuspended || false,
                    suspendedReason: shop.suspendedReason,
                    createdAt: shop.createdAt,
                    owner: shop.owner ? {
                        id: shop.owner.id,
                        name: shop.owner.name,
                        email: shop.owner.email,
                        isSuperAdmin: shop.owner.isSuperAdmin,
                    } : null,
                    memberCount: shop.members?.length || 1,
                    documentCount: docCountRes[0]?.value || 0,
                    turnover: parseFloat(turnoverRes[0]?.sum || "0"),
                };
            })
        );

        return {
            success: true,
            workspaces: shopSummaries,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit) || 1,
        };
    } catch (error) {
        console.error("Failed to list admin workspaces:", error);
        return { success: false, error: "Failed to retrieve tenant workspaces." };
    }
}

/**
 * Deep inspection of a specific tenant workspace.
 */
export async function getAdminWorkspaceDetails(shopId: string) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const shop = await db.query.shops.findFirst({
            where: eq(shops.id, shopId),
            with: {
                owner: true,
                members: {
                    with: {
                        user: true
                    }
                }
            }
        });

        if (!shop) {
            return { success: false, error: "Target workspace not found." };
        }

        // Aggregate document metrics by type
        const [docStats, recentDocs, inventoryStockRes] = await Promise.all([
            db.select({
                type: documents.type,
                count: count(),
                totalAmount: sql<string>`COALESCE(SUM(CAST(${documents.grandTotal} AS NUMERIC)), 0)`
            }).from(documents).where(eq(documents.shopId, shopId)).groupBy(documents.type),
            db.query.documents.findMany({
                where: eq(documents.shopId, shopId),
                orderBy: [desc(documents.createdAt)],
                limit: 10,
                with: {
                    client: true,
                    supplier: true,
                }
            }),
            db.select({
                valuation: sql<string>`COALESCE(SUM(CAST(${productLocationStock.quantity} AS NUMERIC)), 0)`
            }).from(productLocationStock)
        ]);

        return {
            success: true,
            shop,
            docStats,
            recentDocs,
        };
    } catch (error) {
        console.error("Failed to inspect workspace:", error);
        return { success: false, error: "Failed to load workspace details." };
    }
}

export interface UpdateWorkspacePlanInput {
    shopId: string;
    plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE" | string;
    isLifetimePro: boolean;
    subscriptionStatus?: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED" | "LIFETIME_FREE" | string;
}

/**
 * Grants/updates a workspace's subscription plan, including 1-click Lifetime PRO whitelist.
 */
export async function updateWorkspacePlanAction(input: UpdateWorkspacePlanInput) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const [updated] = await db.update(shops).set({
            plan: input.plan,
            isLifetimePro: input.isLifetimePro,
            subscriptionStatus: input.isLifetimePro ? "LIFETIME_FREE" : (input.subscriptionStatus || "ACTIVE"),
        }).where(eq(shops.id, input.shopId)).returning();

        revalidatePath("/admin");
        revalidatePath("/admin/workspaces");
        revalidatePath(`/admin/workspaces/${input.shopId}`);
        if (updated?.slug) {
            revalidatePath(`/workspaces/${updated.slug}`);
            revalidatePath(`/workspaces/${updated.slug}/settings`);
        }

        return {
            success: true,
            message: input.isLifetimePro 
                ? `👑 Successfully granted Lifetime PRO status to ${updated?.name || "workspace"}!`
                : `Plan updated to ${input.plan} successfully.`
        };
    } catch (error) {
        console.error("Failed to update workspace plan:", error);
        return { success: false, error: "Database error updating plan tier." };
    }
}

export interface ToggleWorkspaceSuspensionInput {
    shopId: string;
    isSuspended: boolean;
    reason?: string;
}

/**
 * Suspends or activates a tenant workspace.
 */
export async function toggleWorkspaceSuspensionAction(input: ToggleWorkspaceSuspensionInput) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const [updated] = await db.update(shops).set({
            isSuspended: input.isSuspended,
            suspendedReason: input.isSuspended ? (input.reason?.trim() || "Administrative security lockout") : null,
        }).where(eq(shops.id, input.shopId)).returning();

        revalidatePath("/admin");
        revalidatePath("/admin/workspaces");
        revalidatePath(`/admin/workspaces/${input.shopId}`);
        if (updated?.slug) {
            revalidatePath(`/workspaces/${updated.slug}`);
        }

        return {
            success: true,
            message: input.isSuspended 
                ? `🔒 Workspace ${updated?.name} has been suspended.`
                : `✅ Workspace ${updated?.name} is now active.`
        };
    } catch (error) {
        console.error("Failed to toggle workspace suspension:", error);
        return { success: false, error: "Database error updating suspension status." };
    }
}

/**
 * Global User Management Directory for Super Admins.
 */
export async function getAdminUsersList(searchQuery?: string) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const allUsers = await db.query.users.findMany({
            orderBy: [desc(users.createdAt)],
            with: {
                ownedShops: true,
                memberships: {
                    with: {
                        shop: true
                    }
                }
            }
        });

        let filtered = allUsers;
        if (searchQuery && searchQuery.trim()) {
            const s = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(s) ||
                u.email.toLowerCase().includes(s)
            );
        }

        const userSummaries = filtered.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            isSuperAdmin: u.isSuperAdmin,
            isLifetimePro: u.isLifetimePro,
            createdAt: u.createdAt,
            ownedShopsCount: u.ownedShops?.length || 0,
            membershipsCount: u.memberships?.length || 0,
            ownedShops: u.ownedShops?.map(s => ({ id: s.id, name: s.name, slug: s.slug, plan: s.plan })) || [],
        }));

        return {
            success: true,
            users: userSummaries,
        };
    } catch (error) {
        console.error("Failed to fetch user list:", error);
        return { success: false, error: "Failed to list platform users." };
    }
}

/**
 * Grants or revokes Lifetime PRO access for a user account, cascading to all owned workspaces.
 */
export async function toggleUserLifetimeProAction({ userId, isLifetimePro }: { userId: string; isLifetimePro: boolean }) {
    const currentAdmin = await enforceSuperAdmin();
    if (!currentAdmin) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const [updated] = await db.update(users).set({
            isLifetimePro,
        }).where(eq(users.id, userId)).returning();

        // Cascade to all current workspaces owned by this user
        await db.update(shops).set({
            isLifetimePro,
            subscriptionStatus: isLifetimePro ? "LIFETIME_FREE" : "ACTIVE",
            plan: isLifetimePro ? "PRO" : "FREE",
        }).where(eq(shops.ownerId, userId));

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        revalidatePath("/admin/workspaces");
        revalidatePath("/workspaces");

        return {
            success: true,
            message: isLifetimePro
                ? `👑 Lifetime PRO granted to ${updated?.email}! All current and future workspaces owned by this account are permanently upgraded.`
                : `Lifetime PRO revoked for ${updated?.email}.`
        };
    } catch (error) {
        console.error("Failed to toggle user lifetime pro status:", error);
        return { success: false, error: "Failed to update user lifetime status." };
    }
}

/**
 * Elevates or demotes a user's Super Admin (ROOT) status.
 */
export async function toggleSuperAdminAction({ userId, isSuperAdmin }: { userId: string; isSuperAdmin: boolean }) {
    const currentAdmin = await enforceSuperAdmin();
    if (!currentAdmin) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        // Prevent demoting oneself if they are the only admin
        if (!isSuperAdmin && currentAdmin.id === userId) {
            const superAdmins = await db.select({ value: count() }).from(users).where(eq(users.isSuperAdmin, true));
            if ((superAdmins[0]?.value || 0) <= 1) {
                return { success: false, error: "Cannot demote yourself as the only remaining Super Admin." };
            }
        }

        const [updated] = await db.update(users).set({
            isSuperAdmin,
        }).where(eq(users.id, userId)).returning();

        revalidatePath("/admin");
        revalidatePath("/admin/users");

        return {
            success: true,
            message: isSuperAdmin 
                ? `👑 ${updated?.email} has been elevated to Super Admin (ROOT).`
                : `User ${updated?.email} Super Admin privileges revoked.`
        };
    } catch (error) {
        console.error("Failed to toggle super admin status:", error);
        return { success: false, error: "Failed to update user administrative status." };
    }
}
