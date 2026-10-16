// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
    REFRESH_COOKIE_NAME,
    SESSION_COOKIE_NAME,
    accessCookieOptions,
    refreshCookieOptions,
    type SessionTokens,
} from "@/lib/auth/session-constants";

const API_BASE_URL = (process.env.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
// Refresh a little before expiry so a request never reaches the API with a token about to lapse.
const REFRESH_LEEWAY_SECONDS = 60;

/** Seconds until the JWT expires (unverified read of `exp`; the API verifies signatures). */
function secondsUntilExpiry(jwt: string | undefined): number {
    if (!jwt) return 0;
    try {
        const payload = jwt.split(".")[1];
        const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof json.exp === "number" ? json.exp - Math.floor(Date.now() / 1000) : 0;
    } catch {
        return 0;
    }
}

async function rotateTokens(refreshToken: string, request: NextRequest): Promise<SessionTokens | null> {
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Internal-Key": process.env.INTERNAL_API_KEY || "",
        };
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
        if (ip) headers["X-Client-IP"] = ip;
        const ua = request.headers.get("user-agent");
        if (ua) headers["X-Client-User-Agent"] = ua.slice(0, 255);

        const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
            method: "POST",
            headers,
            body: JSON.stringify({ refresh_token: refreshToken }),
            cache: "no-store",
        });
        if (!res.ok) return null;
        const data = (await res.json()) as SessionTokens;
        return data?.access_token && data?.refresh_token ? data : null;
    } catch (err) {
        console.error("[proxy] token refresh failed:", err);
        return null;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isApiCall = pathname.startsWith("/api/v1/");

    let access = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const refresh = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    // 1. Silent refresh: swap an expired/expiring access token using the refresh token.
    let rotated: SessionTokens | null = null;
    let sessionEnded = false;
    if (refresh && secondsUntilExpiry(access) < REFRESH_LEEWAY_SECONDS) {
        rotated = await rotateTokens(refresh, request);
        if (rotated) {
            access = rotated.access_token;
            // Make the new tokens visible to this same request (Server Components, the /api/v1 rewrite).
            request.cookies.set(SESSION_COOKIE_NAME, rotated.access_token);
            request.cookies.set(REFRESH_COOKIE_NAME, rotated.refresh_token);
        } else {
            access = undefined;
            sessionEnded = true;
            request.cookies.delete(SESSION_COOKIE_NAME);
            request.cookies.delete(REFRESH_COOKIE_NAME);
        }
    }
    const signedIn = Boolean(access);

    // 2. Decide the response.
    let response: NextResponse;
    const isProtectedRoute =
        pathname.startsWith("/workspaces") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/onboarding") ||
        pathname === "/dashboard";
    const isAuthRoute = pathname === "/login" || pathname === "/signup";

    if (!isApiCall && isProtectedRoute && !signedIn) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        if (sessionEnded) loginUrl.searchParams.set("expired", "1");
        response = NextResponse.redirect(loginUrl);
    } else if (isAuthRoute && signedIn && !request.nextUrl.searchParams.has("cleared")) {
        response = NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
        response = NextResponse.next({ request: { headers: request.headers } });
    }

    // 3. Persist the outcome in the browser.
    if (rotated) {
        response.cookies.set(SESSION_COOKIE_NAME, rotated.access_token, accessCookieOptions(rotated.expires_in));
        response.cookies.set(REFRESH_COOKIE_NAME, rotated.refresh_token, refreshCookieOptions(rotated.refresh_expires_in));
    } else if (sessionEnded) {
        response.cookies.set(SESSION_COOKIE_NAME, "", { ...accessCookieOptions(0), maxAge: 0 });
        response.cookies.set(REFRESH_COOKIE_NAME, "", { ...refreshCookieOptions(0), maxAge: 0 });
    }
    return response;
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/workspaces/:path*",
        "/admin/:path*",
        "/onboarding/:path*",
        "/login",
        "/signup",
        // Browser API calls (rewritten to FastAPI) also get silent refresh.
        "/api/v1/:path*",
    ],
};
