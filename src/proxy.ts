// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Grab session token if present
    const sessionToken =
        request.cookies.get("manna_access_token")?.value ||
        request.cookies.get("manna_session_token")?.value;

    // 2. Route Protection Guardrail
    const isDashboardRoute = pathname.startsWith("/workspaces") || pathname === "/dashboard";

    if (isDashboardRoute && !sessionToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
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