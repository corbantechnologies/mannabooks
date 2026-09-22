// src/app/logout/route.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE_NAME = process.env.COOKIE_NAME || "manna_session_token";

/**
 * GET /logout
 * Route Handler that explicitly sends HTTP Set-Cookie headers to destroy
 * all session cookies on the root path and redirects to /login.
 */
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

        // 1. Purge from database if token exists
        if (token) {
            try {
                await db.delete(sessions).where(eq(sessions.id, token));
            } catch (err) {
                console.error("Failed to delete session row during /logout:", err);
            }
        }

        // 2. Clear known session cookie names across root path
        const cookiesToClear = [
            SESSION_COOKIE_NAME,
            "manna_session_token",
            "kenya-nzuri-kabisa",
        ];

        for (const name of cookiesToClear) {
            cookieStore.delete(name);
            cookieStore.set(name, "", {
                path: "/",
                maxAge: 0,
                expires: new Date(0),
                httpOnly: true,
                sameSite: "lax",
            });
        }
    } catch (err) {
        console.error("Error clearing cookies in /logout route:", err);
    }

    // 3. Clean redirect to login with confirmation
    redirect("/login?cleared=1");
}
