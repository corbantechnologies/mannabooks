"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, shops, shopMembers, shopInvitations } from "@/db/schema";
import { generateUniqueShopCode } from "./shopCode";
import { isApiModuleEnabled } from "@/lib/api/flags";
import { apiClient } from "@/lib/api/client";

const SESSION_DURATION_DAYS = Number(process.env.COOKIE_DURATION_DAYS) || 30;

/**
 * Creates an authentic, stateful database session for a user.
 */
export async function createSession(userId: string): Promise<string> {
    // 1. Generate a 64-character un-guessable token ID
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    // 2. Persist session mapping directly to Railway Postgres
    await db.insert(sessions).values({
        id: token,
        userId,
        expiresAt,
    });

    return token;
}


/**
 * Validates the session token from cookies against FastAPI (JWT) or the local database.
 * Auto-cleans expired or orphan tokens to prevent redirect loops.
 */
export const verifyAndGetSession = cache(async function verifyAndGetSession() {
    let token: string | undefined;
    try {
        const store = await cookies();
        token =
            store.get("manna_access_token")?.value ||
            store.get("manna_session_token")?.value;
    } catch {
        return null;
    }


    if (!token) return null;

    // FASTAPI STRANGLER ROUTING (JWT Verification):
    if (isApiModuleEnabled("auth")) {
        try {
            const res = await apiClient<{ success: boolean; user?: any }>("/v1/auth/me");
            if (res.data?.success && res.data.user) {
                return {
                    id: token,
                    userId: res.data.user.id,
                    user: res.data.user,
                    expiresAt: new Date(Date.now() + SESSION_DURATION_DAYS * 86400 * 1000),
                };
            }
            return null;
        } catch (err) {
            console.error("FastAPI JWT verification failed:", err);
            return null;
        }
    }

    // Legacy Postgres session fallback:
    try {
        // Fetch the session alongside user profile contexts
        const sessionRecord = await db.query.sessions.findFirst({
            where: eq(sessions.id, token),
            with: {
                user: true,
            },
        });

        if (!sessionRecord || !sessionRecord.user) {
            return null;
        }

        // Check if session has expired
        const expiryTime =
            sessionRecord.expiresAt instanceof Date
                ? sessionRecord.expiresAt.getTime()
                : new Date(sessionRecord.expiresAt).getTime();

        if (isNaN(expiryTime) || Date.now() >= expiryTime) {
            // Session stale; purge from DB
            try {
                await db.delete(sessions).where(eq(sessions.id, token));
            } catch (e) {}
            return null;
        }

        return sessionRecord;
    } catch (err) {
        console.error("Database error during verifyAndGetSession:", err);
        return null;
    }
});

/**
 * Revokes the active session row and clears the client browser cookies.
 */
export async function invalidateSession() {
    try {
        const cookieStore = await cookies();
        const token =
            cookieStore.get("manna_access_token")?.value ||
            cookieStore.get("manna_session_token")?.value;
        if (token) {
            try {
                await db.delete(sessions).where(eq(sessions.id, token));
            } catch (err) {}
        }

        const cookieNames = [
            "manna_session_token",
            "manna_access_token",
            "kenya-nzuri-kabisa",
        ];


        for (const name of cookieNames) {
            cookieStore.delete(name);
            cookieStore.set(name, "", {
                path: "/",
                maxAge: 0,
                expires: new Date(0),
                httpOnly: true,
                sameSite: "lax",
            });
        }
    } catch (e) {
        console.error("Error during invalidateSession:", e);
    }
}

interface RegisterOwnerInput {
    name: string;
    email: string;
    passwordHex: string;
    businessName: string;
    inviteToken?: string;
}

export async function registerOwnerAccount(input: RegisterOwnerInput) {
    try {
        // FASTAPI STRANGLER ROUTING:
        if (isApiModuleEnabled("auth")) {
            const res = await apiClient<{
                success: boolean;
                token?: string;
                shop_slug?: string;
                error?: string;
            }>("/v1/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    name: input.name.trim(),
                    email: input.email.toLowerCase().trim(),
                    password: input.passwordHex,
                    business_name: input.businessName.trim(),
                    invite_token: input.inviteToken,
                }),
            });

            if (res.error || !res.data?.success || !res.data?.token) {
                return {
                    success: false as const,
                    error: res.data?.error || res.error || "Account initialization failed. Please try again.",
                };
            }

            return {
                success: true as const,
                shopSlug: res.data.shop_slug || "",
                token: res.data.token,
            };
        }


        // Run all DB writes inside a transaction for atomicity
        const result = await db.transaction(async (tx) => {
            // 1. Enforce unique emails at the application level
            const existingUser = await tx.query.users.findFirst({
                where: eq(users.email, input.email.toLowerCase().trim()),
            });

            if (existingUser) {
                return { success: false as const, error: "An account with this email already exists." };
            }

            // 2. Hash the password securely
            const saltRounds = 10;
            const hashedPass = await bcrypt.hash(input.passwordHex, saltRounds);

            // 3. Write the User profile
            const [newUser] = await tx.insert(users).values({
                name: input.name.trim(),
                email: input.email.toLowerCase().trim(),
                passwordHash: hashedPass,
            }).returning();

            // 4. Generate a clean unique URL slug from the business name
            const baseSlug = input.businessName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") // Replace spaces/special chars with hyphens
                .replace(/(^-|-$)+/g, "");   // Clean up trailing hyphens

            // Verify if slug is unique; if not, append a quick timestamp string
            const existingSlug = await tx.query.shops.findFirst({
                where: eq(shops.slug, baseSlug),
            });
            const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

            const shopCode = await generateUniqueShopCode(tx);

            // 5. Write the Shop Workspace profile
            const [newShop] = await tx.insert(shops).values({
                ownerId: newUser.id,
                name: input.businessName.trim(),
                slug: finalSlug,
                code: shopCode,
                currency: "KES", // Default baseline currency
                primaryColor: "#000000", // Stark sleek default
                isVatRegistered: false,  // Default to non-VAT until configured
                plan: "FREE",
                subscriptionStatus: "ACTIVE",
                isLifetimePro: false,
            }).returning();

            // 6. Create the Bridge Membership Record linking User to Shop as OWNER
            await tx.insert(shopMembers).values({
                shopId: newShop.id,
                userId: newUser.id,
                role: "OWNER",
                isActive: true,
            });

            // 6.5 Auto-accept pending invitations
            let pendingInvites = await tx.query.shopInvitations.findMany({
                where: eq(shopInvitations.email, input.email.toLowerCase().trim()),
            });

            // If an invite token was explicitly provided, also look for that specific invite
            if (input.inviteToken) {
                const tokenInvite = await tx.query.shopInvitations.findFirst({
                    where: eq(shopInvitations.token, input.inviteToken),
                });

                // If found and not already in the array, add it
                if (tokenInvite && !pendingInvites.some((inv) => inv.id === tokenInvite.id)) {
                    pendingInvites.push(tokenInvite);
                }
            }

            const validInvites = pendingInvites.filter(
                (inv) => inv.status === "PENDING" && new Date(inv.expiresAt) > new Date()
            );

            for (const invite of validInvites) {
                // Add them to the invited workspace
                await tx.insert(shopMembers).values({
                    shopId: invite.shopId,
                    userId: newUser.id,
                    role: invite.role,
                    customPermissions: invite.customPermissions,
                    isActive: true,
                }).onConflictDoNothing();

                // Update invite status
                await tx.update(shopInvitations)
                    .set({ status: "ACCEPTED" })
                    .where(eq(shopInvitations.id, invite.id));
            }

            return {
                success: true as const,
                userId: newUser.id,
                shopSlug: newShop.slug,
            };
        });

        // If the transaction returned an error (e.g. duplicate email), return it immediately
        if (!result.success) {
            return result;
        }

        // 7. Issue the session AFTER the transaction completes.
        //    cookies() cannot be reliably set inside a Drizzle transaction context.
        await createSession(result.userId);

        return { success: true as const, shopSlug: result.shopSlug };
    } catch (error) {
        console.error("Critical error during merchant onboarding transaction:", error);
        return { success: false as const, error: "Account initialization failed. Please try again." };
    }
}

export async function clearStaleSessionAction() {
    await invalidateSession();
    return { success: true };
}
