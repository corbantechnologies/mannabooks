"use server";

import { db } from "@/db";
import { shopMembers, shops, users, shopInvitations } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { inviteTeamMember, removeTeamMember } from "./team";
import { revalidatePath } from "next/cache";

export interface OrganizationStaffMember {
    userId: string;
    name: string;
    email: string;
    memberships: {
        membershipId: string;
        shopId: string;
        shopName: string;
        shopSlug: string;
        role: string;
        isActive: boolean;
        customPermissions: Record<string, boolean>;
    }[];
}

export interface WorkspaceSummary {
    id: string;
    name: string;
    slug: string;
    role: string;
    primaryColor: string;
    memberCount: number;
}

/**
 * Retrieves all staff members across all workspaces owned or managed by the active user.
 */
export async function getOrganizationStaffRoster() {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context.", roster: [], ownedShops: [] };

    try {
        // 1. Fetch all shops owned by the user (or that user is admin/owner in)
        const ownedShops = await db.query.shops.findMany({
            where: eq(shops.ownerId, session.userId),
            orderBy: [desc(shops.createdAt)],
        });

        if (ownedShops.length === 0) {
            return { success: true, roster: [], ownedShops: [] };
        }

        const shopIds = ownedShops.map(s => s.id);

        // 2. Query all active members in these shops with user profiles
        const allMemberships = await db.query.shopMembers.findMany({
            where: inArray(shopMembers.shopId, shopIds),
            with: {
                user: true,
                shop: true,
            },
        });

        // 3. Group by userId
        const staffMap = new Map<string, OrganizationStaffMember>();

        for (const m of allMemberships) {
            if (!m.user || !m.shop) continue;

            let existing = staffMap.get(m.user.id);
            if (!existing) {
                existing = {
                    userId: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                    memberships: [],
                };
                staffMap.set(m.user.id, existing);
            }

            let parsedPerms: Record<string, boolean> = {};
            try {
                parsedPerms = JSON.parse(m.customPermissions || "{}");
            } catch (e) {}

            existing.memberships.push({
                membershipId: m.id,
                shopId: m.shop.id,
                shopName: m.shop.shortName || m.shop.name,
                shopSlug: m.shop.slug,
                role: m.role,
                isActive: m.isActive,
                customPermissions: parsedPerms,
            });
        }

        const roster = Array.from(staffMap.values());

        // 4. Also calculate member counts per owned shop
        const countsMap: Record<string, number> = {};
        for (const m of allMemberships) {
            if (m.isActive) {
                countsMap[m.shopId] = (countsMap[m.shopId] || 0) + 1;
            }
        }

        const formattedOwnedShops = ownedShops.map(s => ({
            id: s.id,
            name: s.shortName || s.name,
            slug: s.slug,
            primaryColor: s.primaryColor || "#000000",
            memberCount: countsMap[s.id] || 0,
        }));

        return { success: true, roster, ownedShops: formattedOwnedShops };
    } catch (err: any) {
        console.error("Failed to load organization staff roster:", err);
        return { success: false, error: err.message || "Failed to load staff roster.", roster: [], ownedShops: [] };
    }
}

export type EnterpriseRole = "ADMIN" | "MANAGER" | "ACCOUNTANT" | "STOREKEEPER" | "CASHIER" | "DISPATCHER" | "SALES_REP" | "EMPLOYEE" | "VIEWER";

/**
 * Fast action to invite or assign a staff member to a specific workspace directly from the directory.
 */
export async function quickInviteStaffAction(params: {
    shopId: string;
    email: string;
    role: EnterpriseRole;
    customPermissions?: Record<string, boolean>;
    assignedLocationIds?: string[];
    hideCostPrices?: boolean;
    directApprovalLimit?: number;
}) {
    const res = await inviteTeamMember(
        params.shopId,
        params.email,
        params.role,
        params.customPermissions || {},
        {
            assignedLocationIds: params.assignedLocationIds,
            hideCostPrices: params.hideCostPrices,
            directApprovalLimit: params.directApprovalLimit,
        }
    );
    revalidatePath("/workspaces");
    return res;
}

/**
 * Removes a staff member from a workspace directly from the directory.
 */
export async function removeStaffFromWorkspaceAction(shopId: string, memberId: string) {
    const res = await removeTeamMember(shopId, memberId);
    revalidatePath("/workspaces");
    return res;
}
