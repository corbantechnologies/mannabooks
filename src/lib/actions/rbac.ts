"use server";

import { db } from "@/db";
import { shopMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";

export type WorkspacePermission = 
    | "manage_documents"
    | "canCreateDocuments"
    | "manage_clients"
    | "canEditClients"
    | "manage_products"
    | "manage_inventory_ops"
    | "operate_pos"
    | "manage_logistics"
    | "manage_crm"
    | "manage_expenses"
    | "view_analytics"
    | "view_finance"
    | "canViewFinance"
    | "export_reports"
    | "canExportReports"
    | "manage_payroll"
    | "manage_team"
    | "manage_settings"
    | "view_cost_prices"
    | "approve_requests";

/**
 * Built-in permission matrices for standard business roles (Option C Presets).
 */
const ROLE_PRESET_PERMISSIONS: Record<string, WorkspacePermission[]> = {
    OWNER: [
        "manage_documents", "canCreateDocuments", "manage_clients", "canEditClients",
        "manage_products", "manage_inventory_ops", "operate_pos", "manage_logistics",
        "manage_crm", "manage_expenses", "view_analytics", "view_finance", "canViewFinance",
        "export_reports", "canExportReports", "manage_payroll", "manage_team", "manage_settings",
        "view_cost_prices", "approve_requests"
    ],
    ADMIN: [
        "manage_documents", "canCreateDocuments", "manage_clients", "canEditClients",
        "manage_products", "manage_inventory_ops", "operate_pos", "manage_logistics",
        "manage_crm", "manage_expenses", "view_analytics", "view_finance", "canViewFinance",
        "export_reports", "canExportReports", "manage_payroll", "manage_team", "manage_settings",
        "view_cost_prices", "approve_requests"
    ],
    MANAGER: [
        "manage_documents", "canCreateDocuments", "manage_clients", "canEditClients",
        "manage_products", "manage_inventory_ops", "operate_pos", "manage_logistics",
        "manage_crm", "manage_expenses", "view_analytics", "view_finance", "canViewFinance",
        "export_reports", "canExportReports", "manage_payroll", "view_cost_prices", "approve_requests"
    ],
    ACCOUNTANT: [
        "manage_documents", "canCreateDocuments", "manage_clients", "canEditClients",
        "manage_expenses", "view_analytics", "view_finance", "canViewFinance",
        "export_reports", "canExportReports", "manage_payroll", "view_cost_prices", "approve_requests"
    ],
    STOREKEEPER: [
        "manage_products", "manage_inventory_ops", "manage_logistics", "canCreateDocuments"
    ],
    CASHIER: [
        "operate_pos", "manage_documents", "canCreateDocuments", "manage_clients", "canEditClients"
    ],
    DISPATCHER: [
        "manage_logistics", "manage_documents", "canCreateDocuments"
    ],
    SALES_REP: [
        "manage_crm", "manage_documents", "canCreateDocuments", "manage_clients", "canEditClients"
    ],
    VIEWER: [
        "view_analytics", "view_finance", "canViewFinance"
    ],
    EMPLOYEE: []
};

/**
 * Ensures the currently logged-in user has the right role and/or granular permissions 
 * to perform a specific action within a workspace.
 */
export async function enforcePermission(shopId: string, requiredPermission: WorkspacePermission) {
    const session = await verifyAndGetSession();
    if (!session) {
        throw new Error("Unauthorized. Please log in.");
    }

    if (session.user.isSuperAdmin) {
        return { userId: session.user.id, role: "SUPER_ADMIN", membership: null };
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
        return { userId: session.userId, role, membership };
    }

    // 2. Check Role Presets
    const allowedInPreset = ROLE_PRESET_PERMISSIONS[role] || [];
    if (allowedInPreset.includes(requiredPermission)) {
        return { userId: session.userId, role, membership };
    }

    // 3. Check Granular Custom Permissions Overrides
    try {
        const permissionsMap: Record<string, boolean> = JSON.parse(membership.customPermissions || "{}");
        if (permissionsMap[requiredPermission] === true) {
            return { userId: session.userId, role, membership };
        }
    } catch (e) {
        console.error("Failed to parse custom permissions:", e);
    }

    throw new Error(`Access Denied. Your role (${role}) lacks permission for this action.`);
}

/**
 * Enforces location/branch scoping.
 * If user is restricted to specific locations, ensures target locationId is allowed.
 */
export async function enforceLocationAccess(shopId: string, targetLocationId: string) {
    const session = await verifyAndGetSession();
    if (!session) throw new Error("Unauthorized.");
    if (session.user.isSuperAdmin) return true;

    const membership = await db.query.shopMembers.findFirst({
        where: and(
            eq(shopMembers.shopId, shopId),
            eq(shopMembers.userId, session.userId),
            eq(shopMembers.isActive, true)
        )
    });

    if (!membership) throw new Error("Access Denied: Not a member of this workspace.");

    // Owners, Admins, and Managers have universal multi-branch access
    if (membership.role === "OWNER" || membership.role === "ADMIN" || membership.role === "MANAGER") {
        return true;
    }

    const assigned = (membership.assignedLocationIds as string[]) || [];
    // If no specific branch restriction is set, user has workspace-wide operational access
    if (assigned.length === 0) {
        return true;
    }

    if (!assigned.includes(targetLocationId)) {
        throw new Error("Access Denied: You are not authorized to perform operations in this warehouse location.");
    }

    return true;
}

/**
 * Returns whether the current user is allowed to view purchase/cost prices
 * or whether cost prices should be blinded (e.g. for Storekeepers and Cashiers).
 */
export async function canViewCostPrices(shopId: string): Promise<boolean> {
    const session = await verifyAndGetSession();
    if (!session) return false;
    if (session.user.isSuperAdmin) return true;

    const membership = await db.query.shopMembers.findFirst({
        where: and(
            eq(shopMembers.shopId, shopId),
            eq(shopMembers.userId, session.userId),
            eq(shopMembers.isActive, true)
        )
    });

    if (!membership) return false;
    if (membership.role === "OWNER" || membership.role === "ADMIN" || membership.role === "MANAGER" || membership.role === "ACCOUNTANT") {
        return !membership.hideCostPrices;
    }

    return !membership.hideCostPrices;
}
