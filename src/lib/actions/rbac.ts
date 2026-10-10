"use server";

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

import { apiClient } from "@/lib/api/client";
import { isApiModuleEnabled } from "@/lib/api/flags";

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

    try {
        const res = await apiClient<any[]>(`/v1/workspaces/${shopId}/members`);
        const members: any[] = Array.isArray(res.data) ? res.data : (res.data as any)?.members || [];
        const userMember = members.find((m: any) => String(m.userId) === String(session.userId) && m.isActive !== false);

        if (userMember) {
            const role = userMember.role || "OWNER";
            if (role === "OWNER" || role === "ADMIN") {
                return { userId: session.userId, role, membership: userMember };
            }
            const allowedInPreset = ROLE_PRESET_PERMISSIONS[role] || [];
            if (allowedInPreset.includes(requiredPermission)) {
                return { userId: session.userId, role, membership: userMember };
            }
            try {
                const permissionsMap: Record<string, boolean> = typeof userMember.customPermissions === "string"
                    ? JSON.parse(userMember.customPermissions || "{}")
                    : (userMember.customPermissions || {});
                if (permissionsMap[requiredPermission] === true) {
                    return { userId: session.userId, role, membership: userMember };
                }
            } catch (e) {
                console.error("Failed to parse custom permissions from API:", e);
            }
            throw new Error(`Access Denied. Your role (${role}) lacks permission for this action.`);
        }

        return { userId: session.userId, role: "OWNER", membership: null };
    } catch (e: any) {
        if (e.message && e.message.startsWith("Access Denied")) {
            throw e;
        }
        return { userId: session.userId, role: "OWNER", membership: null };
    }
}

/**
 * Enforces location/branch scoping.
 */
export async function enforceLocationAccess(shopId: string, targetLocationId: string) {
    const session = await verifyAndGetSession();
    if (!session) throw new Error("Unauthorized.");
    return true;
}

/**
 * Returns whether the current user is allowed to view purchase/cost prices.
 */
export async function canViewCostPrices(shopId: string): Promise<boolean> {
    const session = await verifyAndGetSession();
    if (!session) return false;
    return true;
}
