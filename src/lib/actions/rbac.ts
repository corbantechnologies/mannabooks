"use server";

import { db } from "@/db";
import { shopMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";

export type WorkspacePermission = 
    | "manage_documents"
    | "manage_products"
    | "manage_expenses"
    | "view_analytics"
    | "manage_payroll"
    | "manage_team"
    | "manage_settings";

/**
 * Ensures the currently logged-in user has the right role and/or granular permissions 
 * to perform a specific action within a workspace.
 * 
 * @param shopId The target workspace ID
 * @param requiredPermission The specific action permission required
 * @returns The user's role and ID if authorized, otherwise throws or returns null.
 */
export async function enforcePermission(shopId: string, requiredPermission: WorkspacePermission) {
    const session = await verifyAndGetSession();
    if (!session) {
        throw new Error("Unauthorized. Please log in.");
    }

    if (session.user.isSuperAdmin) {
        return { userId: session.user.id, role: "SUPER_ADMIN" };
    }

    const membership = await db.query.shopMembers.findFirst({
        where: and(
            eq(shopMembers.shopId, shopId),
            eq(shopMembers.userId, session.userId),
            eq(shopMembers.isActive, true)
        )
    });

    if (!membership) {
        throw new Error("Access Denied. You do not belong to this workspace.");
    }

    const role = membership.role;

    // 1. OWNER and ADMIN have full access to everything
    if (role === "OWNER" || role === "ADMIN") {
        return { userId: session.userId, role };
    }

    // 2. MANAGER has full access EXCEPT managing the team / critical settings
    if (role === "MANAGER") {
        if (requiredPermission === "manage_team" || requiredPermission === "manage_settings") {
            throw new Error("Access Denied. Only Owners or Admins can manage team settings.");
        }
        return { userId: session.userId, role };
    }

    // 3. ACCOUNTANT has access to financial and analytical data
    if (role === "ACCOUNTANT") {
        const accountantAllowed: WorkspacePermission[] = [
            "view_analytics", "manage_documents", "manage_expenses", "manage_payroll"
        ];
        if (!accountantAllowed.includes(requiredPermission)) {
            throw new Error("Access Denied. Accountants cannot perform this action.");
        }
        return { userId: session.userId, role };
    }

    // 4. VIEWER is strictly read-only for EVERYTHING.
    // (Notice none of the permissions typically map to "read" directly in this model, 
    // but if we had a "view_documents", they'd get it. For now, they can't "manage" anything.)
    if (role === "VIEWER") {
        if (requiredPermission === "view_analytics") {
            return { userId: session.userId, role }; // Viewers can see analytics
        }
        throw new Error("Access Denied. Viewers are restricted to read-only mode.");
    }

    // 5. EMPLOYEE relies on dynamic customPermissions
    if (role === "EMPLOYEE") {
        try {
            const permissionsMap: Record<string, boolean> = JSON.parse(membership.customPermissions || "{}");
            if (permissionsMap[requiredPermission] === true) {
                return { userId: session.userId, role };
            }
        } catch (e) {
            console.error("Failed to parse employee permissions:", e);
        }
        throw new Error(`Access Denied. Your employee account lacks the '${requiredPermission}' permission.`);
    }

    throw new Error("Access Denied. Unknown role mapping.");
}
