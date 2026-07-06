"use server";

import { db } from "@/db";
import { shopMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(
    shopId: string, 
    email: string, 
    role: "ADMIN" | "MANAGER" | "ACCOUNTANT" | "EMPLOYEE" | "VIEWER", 
    customPermissions: Record<string, boolean> = {}
) {
    try {
        await enforcePermission(shopId, "manage_team");

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check if the user exists in the system
        const targetUser = await db.query.users.findFirst({
            where: eq(users.email, normalizedEmail)
        });

        if (!targetUser) {
            return { success: false, error: "No user found with that email. They must sign up first." };
        }

        // 2. Check if they are already in the workspace
        const existingMembership = await db.query.shopMembers.findFirst({
            where: and(
                eq(shopMembers.shopId, shopId),
                eq(shopMembers.userId, targetUser.id)
            )
        });

        if (existingMembership) {
            return { success: false, error: "User is already a member of this workspace." };
        }

        // 3. Add them to the workspace
        await db.insert(shopMembers).values({
            shopId,
            userId: targetUser.id,
            role,
            customPermissions: JSON.stringify(customPermissions),
            isActive: true
        });

        revalidatePath(`/workspaces/${shopId}/team`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to invite team member:", error);
        return { success: false, error: error.message || "Failed to invite member." };
    }
}

export async function removeTeamMember(shopId: string, memberId: string) {
    try {
        await enforcePermission(shopId, "manage_team");

        // Prevent removing the owner
        const membership = await db.query.shopMembers.findFirst({
            where: and(
                eq(shopMembers.id, memberId),
                eq(shopMembers.shopId, shopId)
            )
        });

        if (!membership) {
            return { success: false, error: "Member not found." };
        }

        if (membership.role === "OWNER") {
            return { success: false, error: "Cannot remove the workspace owner." };
        }

        await db.delete(shopMembers).where(eq(shopMembers.id, memberId));

        revalidatePath(`/workspaces/${shopId}/team`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to remove team member:", error);
        return { success: false, error: error.message || "Failed to remove member." };
    }
}
