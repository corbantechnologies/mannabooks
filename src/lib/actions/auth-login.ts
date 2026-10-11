// src/lib/actions/auth-login.ts
"use server";

import { apiClient } from "@/lib/api/client";
import { isApiModuleEnabled } from "@/lib/api/flags";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/lib/actions/auth";

export interface LoginInput {
    email: string;
    passwordHex?: string;
    password?: string;
}

export interface LoginResult {
    success: boolean;
    error?: string;
    token?: string;
    shopSlug?: string;
    user?: any;
}

/**
 * Authenticates user credentials via the FastAPI backend and sets the session cookie.
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
    try {
        const password = input.passwordHex || input.password || "";
        const email = input.email.toLowerCase().trim();

        const res = await apiClient<{
            access_token?: string;
            token?: string;
            shop_slug?: string;
            shopSlug?: string;
            user?: any;
            error?: string;
            detail?: string;
        }>("/v1/auth/token", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        if (res.error || !res.data) {
            return {
                success: false,
                error: res.data?.detail || res.data?.error || res.error || "Invalid email or password.",
            };
        }

        const token = res.data.access_token || res.data.token;
        if (!token) {
            return {
                success: false,
                error: "Authentication token missing from response.",
            };
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: expiresAt,
            path: "/",
        });

        return {
            success: true,
            token,
            shopSlug: res.data.shop_slug || res.data.shopSlug || "",
            user: res.data.user,
        };
    } catch (err: any) {
        console.error("Login action error:", err);
        return {
            success: false,
            error: err.message || "An unexpected error occurred during login.",
        };
    }
}
