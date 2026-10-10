// src/app/logout/route.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";

const SESSION_COOKIE_NAME = process.env.COOKIE_NAME || "kenya-nzuri-kabisa";

/**
 * GET /logout
 * Route Handler that explicitly calls backend logout, destroys session cookies,
 * and redirects to /login.
 */
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token =
            cookieStore.get(SESSION_COOKIE_NAME)?.value ||
            cookieStore.get("manna_session_token")?.value ||
            cookieStore.get("kenya-nzuri-kabisa")?.value;

        // 1. Notify FastAPI backend to revoke session
        if (token) {
            try {
                await apiClient.post("/v1/auth/logout", {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Backend logout call failed:", err);
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
