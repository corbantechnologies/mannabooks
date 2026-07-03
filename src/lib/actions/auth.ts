// src/lib/auth.ts
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "manna_session_token";
const SESSION_DURATION_DAYS = 30;

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