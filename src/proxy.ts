// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Grab standard access token from cookies
    const token =
        request.cookies.get("access_token")?.value ||
        request.cookies.get("next-auth.session-token")?.value ||
        request.cookies.get("__Secure-next-auth.session-token")?.value;

    // 2. Route Protection Guardrail
    const isDashboardRoute = pathname.startsWith("/workspaces") || pathname === "/dashboard";

    if (isDashboardRoute && !token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 3. Redirect logged-in users away from /login or /signup
    const isAuthRoute = pathname === "/login" || pathname === "/signup";
    if (isAuthRoute && token) {
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