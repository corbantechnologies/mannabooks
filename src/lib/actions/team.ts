"use server";

import { db } from "@/db";
import { shopMembers, users, shopInvitations, shops } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

        if (targetUser) {
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

            // 3. Add them directly to the workspace
            await db.insert(shopMembers).values({
                shopId,
                userId: targetUser.id,
                role,
                customPermissions: JSON.stringify(customPermissions),
                isActive: true
            });

            // Optional: Send them an email letting them know they were added to a new workspace
            const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
            if (shop && process.env.RESEND_FROM_EMAIL) {
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL,
                    to: normalizedEmail,
                    subject: `You've been added to ${shop.name} on Manna Books`,
                    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #18181b; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.05em;">MANNA BOOKS</h1>
    </div>
    
    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 40px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Workspace Access Granted</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #52525b; margin-bottom: 24px;">
            You have been added to the workspace <strong style="color: #18181b;">${shop.name}</strong> with the role of <strong style="color: #18181b;">${role}</strong>.
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #52525b; margin-bottom: 24px;">
            Log in to your Manna Books account and use the workspace switcher to access it.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px;">Go to Dashboard</a>
    </div>

    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #a1a1aa;">
        <p>© ${new Date().getFullYear()} Manna Books. All rights reserved.</p>
    </div>
</div>
`
                });
            }

        } else {
            // User does not exist, create a pending invitation
            const existingInvite = await db.query.shopInvitations.findFirst({
                where: and(
                    eq(shopInvitations.shopId, shopId),
                    eq(shopInvitations.email, normalizedEmail),
                    eq(shopInvitations.status, "PENDING")
                )
            });

            if (existingInvite) {
                return { success: false, error: "A pending invitation has already been sent to this email." };
            }

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

            await db.insert(shopInvitations).values({
                shopId,
                email: normalizedEmail,
                role,
                customPermissions: JSON.stringify(customPermissions),
                token,
                status: "PENDING",
                expiresAt
            });

            // Send invite email
            const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
            if (shop && process.env.RESEND_FROM_EMAIL) {
                const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?invite=${token}`;
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL,
                    to: normalizedEmail,
                    subject: `You've been invited to join ${shop.name} on Manna Books`,
                    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #18181b; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.05em;">MANNA BOOKS</h1>
    </div>
    
    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 40px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">You've been invited!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #52525b; margin-bottom: 24px;">
            You have been invited to join the workspace <strong style="color: #18181b;">${shop.name}</strong> on Manna Books.
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px;">Accept Invitation</a>
    </div>

    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #a1a1aa;">
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
        <p>© ${new Date().getFullYear()} Manna Books. All rights reserved.</p>
    </div>
</div>
`
                });
            }
        }

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

export async function revokeInvitation(shopId: string, inviteId: string) {
    try {
        await enforcePermission(shopId, "manage_team");

        const invite = await db.query.shopInvitations.findFirst({
            where: and(
                eq(shopInvitations.id, inviteId),
                eq(shopInvitations.shopId, shopId)
            )
        });

        if (!invite) {
            return { success: false, error: "Invitation not found." };
        }

        await db.delete(shopInvitations).where(eq(shopInvitations.id, inviteId));

        revalidatePath(`/workspaces/${shopId}/team`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to revoke invitation:", error);
        return { success: false, error: error.message || "Failed to revoke invitation." };
    }
}
