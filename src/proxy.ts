// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = process.env.COOKIE_NAME || "manna_session_token";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Grab the session cookie matching process.env.COOKIE_NAME
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // 2. Route Protection Guardrail
    // If the user is trying to access internal workspaces or the dashboard proxy without a session,
    // bounce them straight to the login interface.
    const isDashboardRoute = pathname.startsWith("/workspaces") || pathname === "/dashboard";

    if (isDashboardRoute && !sessionToken) {
        const loginUrl = new URL("/login", request.url);
        // Optional: Pass the original path as a redirect parameter so they return here after login
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 3. Catch authenticated users trying to hit /login or /signup and push them to dashboard
    const isAuthRoute = pathname === "/login" || pathname === "/signup";
    if (isAuthRoute && sessionToken) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Continue to the intended route seamlessly
    return NextResponse.next();
}

/**
 * Configure the static analyzer matcher rules.
 * This filters the proxy to run ONLY on dashboard routes, workspaces, and auth pages,
 * completely ignoring public portals, static assets, and images for maximum speed.
 */
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/workspaces/:path*",
        "/login",
        "/signup"
    ],
};