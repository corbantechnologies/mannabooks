"use server";

import { apiClient } from "@/lib/api/client";
import { verifyAndGetSession, invalidateSession } from "./auth";
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
 * Fetches platform-wide statistics for the global admin dashboard via FastAPI.
 */
export async function getPlatformStats() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const res = await apiClient<{
            success: boolean;
            stats: {
                users: number;
                workspaces: number;
                documents: number;
                turnover: number;
                lifetimeProCount: number;
                suspendedCount: number;
                recentShops: any[];
                recentUsers: any[];
            };
            error?: string;
        }>("/v1/admin/stats");

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to read analytics from the API." };
        }

        return {
            success: true,
            stats: res.data.stats,
        };
    } catch (error: any) {
        console.error("Failed to fetch platform stats via FastAPI:", error);
        return { success: false, error: error.message || "Failed to read analytics." };
    }
}

export interface GetAdminWorkspacesInput {
    search?: string;
    planFilter?: string; // 'ALL' | 'LIFETIME_PRO' | 'PRO' | 'STARTER' | 'FREE' | 'SUSPENDED'
    page?: number;
    limit?: number;
}

/**
 * Fetches the paginated tenant workspace directory with owner details & document counts via FastAPI.
 */
export async function getAdminWorkspacesList(input?: GetAdminWorkspacesInput) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const params: Record<string, string> = {};
        if (input?.search) params.search = input.search.trim();
        if (input?.planFilter) params.plan_filter = input.planFilter;
        if (input?.page) params.page = String(input.page);
        if (input?.limit) params.limit = String(input.limit);

        const res = await apiClient<{
            success: boolean;
            workspaces: any[];
            totalCount: number;
            page: number;
            totalPages: number;
            error?: string;
        }>("/v1/admin/workspaces", { params });

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to retrieve tenant workspaces." };
        }

        return {
            success: true,
            workspaces: res.data.workspaces,
            totalCount: res.data.totalCount,
            page: res.data.page,
            totalPages: res.data.totalPages,
        };
    } catch (error: any) {
        console.error("Failed to list admin workspaces via FastAPI:", error);
        return { success: false, error: error.message || "Failed to retrieve tenant workspaces." };
    }
}

/**
 * Deep inspection of a specific tenant workspace via FastAPI.
 */
export async function getAdminWorkspaceDetails(shopId: string) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const res = await apiClient<{
            success: boolean;
            shop: any;
            docStats: any[];
            recentDocs: any[];
            error?: string;
        }>(`/v1/admin/workspaces/${shopId}`);

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to load workspace details." };
        }

        return {
            success: true,
            shop: res.data.shop,
            docStats: res.data.docStats,
            recentDocs: res.data.recentDocs,
        };
    } catch (error: any) {
        console.error("Failed to inspect workspace via FastAPI:", error);
        return { success: false, error: error.message || "Failed to load workspace details." };
    }
}

export interface UpdateWorkspacePlanInput {
    shopId: string;
    plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE" | string;
    isLifetimePro: boolean;
    subscriptionStatus?: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED" | "LIFETIME_FREE" | string;
}

/**
 * Grants/updates a workspace's subscription plan via FastAPI.
 */
export async function updateWorkspacePlanAction(input: UpdateWorkspacePlanInput) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const res = await apiClient<{ success: boolean; message: string; shop?: any; error?: string }>(
            `/v1/admin/workspaces/${input.shopId}/plan`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    plan: input.plan,
                    is_lifetime_pro: input.isLifetimePro,
                    subscription_status: input.subscriptionStatus || "ACTIVE",
                }),
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to update plan tier." };
        }

        revalidatePath("/admin");
        revalidatePath("/admin/workspaces");
        revalidatePath(`/admin/workspaces/${input.shopId}`);
        if (res.data.shop?.slug) {
            revalidatePath(`/workspaces/${res.data.shop.slug}`);
            revalidatePath(`/workspaces/${res.data.shop.slug}/settings`);
        }

        return {
            success: true,
            message: res.data.message || (input.isLifetimePro
                ? "👑 Successfully granted Lifetime PRO status!"
                : `Plan updated to ${input.plan} successfully.`),
        };
    } catch (error: any) {
        console.error("Failed to update workspace plan via FastAPI:", error);
        return { success: false, error: error.message || "Error updating plan tier." };
    }
}

export interface ToggleWorkspaceSuspensionInput {
    shopId: string;
    isSuspended: boolean;
    reason?: string;
}

/**
 * Suspends or activates a tenant workspace via FastAPI.
 */
export async function toggleWorkspaceSuspensionAction(input: ToggleWorkspaceSuspensionInput) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const res = await apiClient<{ success: boolean; message: string; shop?: any; error?: string }>(
            `/v1/admin/workspaces/${input.shopId}/toggle-suspension`,
            {
                method: "POST",
                body: JSON.stringify({
                    is_suspended: input.isSuspended,
                    reason: input.reason?.trim() || null,
                }),
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to update suspension status." };
        }

        revalidatePath("/admin");
        revalidatePath("/admin/workspaces");
        revalidatePath(`/admin/workspaces/${input.shopId}`);
        if (res.data.shop?.slug) {
            revalidatePath(`/workspaces/${res.data.shop.slug}`);
        }

        return {
            success: true,
            message: res.data.message,
        };
    } catch (error: any) {
        console.error("Failed to toggle workspace suspension via FastAPI:", error);
        return { success: false, error: error.message || "Error updating suspension status." };
    }
}

/**
 * Global User Management Directory for Super Admins via FastAPI.
 */
export async function getAdminUsersList(searchQuery?: string) {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const params: Record<string, string> = {};
        if (searchQuery?.trim()) params.search = searchQuery.trim();

        const res = await apiClient<{ success: boolean; users: any[]; error?: string }>("/v1/admin/users", { params });

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to list platform users." };
        }

        return {
            success: true,
            users: res.data.users,
        };
    } catch (error: any) {
        console.error("Failed to fetch user list via FastAPI:", error);
        return { success: false, error: error.message || "Failed to list platform users." };
    }
}

/**
 * Updates a user's subscription tier, expiry, or lifetime status via FastAPI.
 */
export async function updateUserSubscriptionAction({
    userId,
    plan,
    isLifetimePro,
    subscriptionExpiresAt,
}: {
    userId: string;
    plan: string;
    isLifetimePro: boolean;
    subscriptionExpiresAt: Date | null;
}) {
    const currentAdmin = await enforceSuperAdmin();
    if (!currentAdmin) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const res = await apiClient<{ success: boolean; message: string; error?: string }>(
            `/v1/admin/users/${userId}/subscription`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    plan,
                    is_lifetime_pro: isLifetimePro,
                    subscription_expires_at: subscriptionExpiresAt?.toISOString() || null,
                }),
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to update user subscription." };
        }

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        revalidatePath("/admin/workspaces");
        revalidatePath("/workspaces");

        return {
            success: true,
            message: res.data.message || `User subscription updated to ${isLifetimePro ? "LIFETIME PRO" : plan}!`,
        };
    } catch (error: any) {
        console.error("Failed to update user subscription via FastAPI:", error);
        return { success: false, error: error.message || "Failed to update user subscription." };
    }
}

/**
 * Grants or revokes Lifetime PRO access for a user account, cascading to all owned workspaces via FastAPI.
 */
export async function toggleUserLifetimeProAction({ userId, isLifetimePro }: { userId: string; isLifetimePro: boolean }) {
    const currentAdmin = await enforceSuperAdmin();
    if (!currentAdmin) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const res = await apiClient<{ success: boolean; message: string; error?: string }>(
            `/v1/admin/users/${userId}/toggle-lifetime-pro`,
            {
                method: "POST",
                body: JSON.stringify({ is_lifetime_pro: isLifetimePro }),
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to update user lifetime status." };
        }

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        revalidatePath("/admin/workspaces");
        revalidatePath("/workspaces");

        return {
            success: true,
            message: res.data.message,
        };
    } catch (error: any) {
        console.error("Failed to toggle user lifetime pro status via FastAPI:", error);
        return { success: false, error: error.message || "Failed to update user lifetime status." };
    }
}

/**
 * Elevates or demotes a user's Super Admin (ROOT) status via FastAPI.
 */
export async function toggleSuperAdminAction({ userId, isSuperAdmin }: { userId: string; isSuperAdmin: boolean }) {
    const currentAdmin = await enforceSuperAdmin();
    if (!currentAdmin) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    if (!isSuperAdmin && currentAdmin.id === userId) {
        return { success: false, error: "Cannot demote yourself as a Super Admin." };
    }

    try {
        const res = await apiClient<{ success: boolean; message: string; error?: string }>(
            `/v1/admin/users/${userId}/toggle-super-admin`,
            {
                method: "POST",
                body: JSON.stringify({ is_super_admin: isSuperAdmin }),
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to update user administrative status." };
        }

        revalidatePath("/admin");
        revalidatePath("/admin/users");

        return {
            success: true,
            message: res.data.message,
        };
    } catch (error: any) {
        console.error("Failed to toggle super admin status via FastAPI:", error);
        return { success: false, error: error.message || "Failed to update user administrative status." };
    }
}

/**
 * Permanently purges a user account from the platform via FastAPI.
 */
export async function deleteUserAccountAction(input: {
    userId: string;
    confirmationInput: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
        const session = await verifyAndGetSession();
        if (!session || !session.user) {
            return { success: false, error: "Authentication required." };
        }

        const isSuperAdmin = Boolean(session.user.isSuperAdmin);
        const isSelf = session.userId === input.userId;

        if (!isSuperAdmin && !isSelf) {
            return { success: false, error: "Unauthorized. Super Admin privileges required to delete other users." };
        }

        const normalizedInput = (input.confirmationInput || "").toLowerCase().trim();
        if (normalizedInput !== "delete" && normalizedInput !== session.user.email?.toLowerCase().trim()) {
            return {
                success: false,
                error: `Confirmation mismatch. Please type your email or "DELETE" to confirm permanent purge.`,
            };
        }

        const res = await apiClient<{ success: boolean; message: string; error?: string }>(
            `/v1/admin/users/${input.userId}`,
            {
                method: "DELETE",
            }
        );

        if (res.error || !res.data?.success) {
            return { success: false, error: res.error || "Failed to delete user account." };
        }

        if (isSelf) {
            await invalidateSession();
        }

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        revalidatePath("/admin/workspaces");
        revalidatePath("/workspaces");

        return {
            success: true,
            message: res.data.message,
        };
    } catch (error: any) {
        console.error("Critical failure during user account purge sequence via FastAPI:", error);
        return { success: false, error: error?.message || "Failed to delete user account." };
    }
}
