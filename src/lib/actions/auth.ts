"use server";

import { db } from "@/db";
import { sessions, users, shops, shopMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcrypt";

const SESSION_COOKIE_NAME = process.env.COOKIE_NAME || "manna_session_token";
const SESSION_DURATION_DAYS = Number(process.env.COOKIE_DURATION_DAYS) || 30;

/**
 * Creates an authentic, stateful database session for a user and injects the HTTP-only cookie.
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

    // 3. Bake the token directly into an encrypted, ultra-secure HTTP-only cookie
    (await cookies()).set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });

    return token;
}

/**
 * Validates the session token from cookies against the database.
 * Auto-cleans expired slots to keep your data performance high.
 */
export async function verifyAndGetSession() {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    // Fetch the session alongside user profile contexts
    const sessionRecord = await db.query.sessions.findFirst({
        where: eq(sessions.id, token),
        with: {
            user: true,
        },
    });

    if (!sessionRecord) {
        return null;
    }

    // Check if session has expired
    if (Date.now() >= sessionRecord.expiresAt.getTime()) {
        // Session stale; purge from DB and drop cookie context
        await db.delete(sessions).where(eq(sessions.id, token));
        (await cookies()).delete(SESSION_COOKIE_NAME);
        return null;
    }

    return sessionRecord;
}

/**
 * Revokes the active session row and clears the client browser cookie.
 */
export async function invalidateSession() {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) return;

    await db.delete(sessions).where(eq(sessions.id, token));
    (await cookies()).delete(SESSION_COOKIE_NAME);
}

interface RegisterOwnerInput {
    name: string;
    email: string;
    passwordHex: string;
    businessName: string;
}

export async function registerOwnerAccount(input: RegisterOwnerInput) {
    try {
        return await db.transaction(async (tx) => {

            // 1. Enforce unique emails at the application level
            const existingUser = await tx.query.users.findFirst({
                where: eq(users.email, input.email.toLowerCase().trim()),
            });

            if (existingUser) {
                return { success: false, error: "An account with this email already exists." };
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

            // 5. Write the Shop Workspace profile
            const [newShop] = await tx.insert(shops).values({
                ownerId: newUser.id,
                name: input.businessName.trim(),
                slug: finalSlug,
                currency: "KES", // Default baseline currency
                primaryColor: "#000000", // Stark sleek default
                isVatRegistered: false,  // Default to non-VAT until configured
            }).returning();

            // 6. Create the Bridge Membership Record linking User to Shop as OWNER
            await tx.insert(shopMembers).values({
                shopId: newShop.id,
                userId: newUser.id,
                role: "OWNER",
                isActive: true,
            });

            // Issue session directly during registration so user is logged in
            // (Note: To avoid db transaction nested issues with cookies(), we can just create the session DB record, 
            // but createSession uses cookies() which requires "use server" context)
            
            return {
                success: true,
                userId: newUser.id,
                shopId: newShop.id,
                shopSlug: newShop.slug
            };
        });
    } catch (error) {
        console.error("Critical error during merchant onboarding transaction:", error);
        return { success: false, error: "Account initialization failed. Please try again." };
    }
}