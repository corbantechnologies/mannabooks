// src/lib/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { cache } from "react";
import { generateShopCode } from "./shopCode";
import { isApiModuleEnabled } from "@/lib/api/flags";
import { apiClient } from "@/lib/api/client";

export const SESSION_COOKIE_NAME = "manna_access_token";
export const SESSION_DURATION_DAYS = 30;

export interface SessionUser {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
    plan?: string;
    subscriptionStatus?: string;
}

export interface UserSession {
    user: SessionUser;
}

export interface RegisterUserInput {
    name: string;
    email: string;
    passwordHex?: string;
    password?: string;
    businessName: string;
    inviteToken?: string;
}

export interface RegisterResult {
    success: boolean;
    error?: string;
    shopSlug?: string;
    token?: string;
}

/**
 * Validates the current user session against the FastAPI backend.
 */
export const verifyAndGetSession = cache(async function verifyAndGetSession(): Promise<UserSession | null> {
    try {
        const cookieStore = await cookies();
        const token =
            cookieStore.get(SESSION_COOKIE_NAME)?.value ||
            cookieStore.get("manna_session_token")?.value ||
            cookieStore.get("kenya-nzuri-kabisa")?.value;

        if (!token) return null;

        const res = await apiClient.get<{ success: boolean; user?: SessionUser }>("/v1/auth/me");
        if (res.data?.success && res.data.user) {
            return { user: res.data.user };
        }
        return null;
    } catch (err) {
        return null;
    }
});

/**
 * Validates current session and returns the user only if they are a super admin.
 */
export async function enforceSuperAdmin(): Promise<SessionUser | null> {
    const session = await verifyAndGetSession();
    if (!session || !session.user || !session.user.isSuperAdmin) {
        return null;
    }
    return session.user;
}

/**
 * Revokes the active session row and clears the client browser cookie.
 */
export async function invalidateSession(): Promise<void> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete(SESSION_COOKIE_NAME);
        cookieStore.set(SESSION_COOKIE_NAME, "", {
            path: "/",
            maxAge: 0,
            expires: new Date(0),
            httpOnly: true,
            sameSite: "lax",
        });
        await apiClient.post("/v1/auth/logout");
    } catch (e) {
        // Safe fallback
    }
}

/**
 * Registers a new user and workspace through the FastAPI backend.
 */
export async function registerUser(input: RegisterUserInput): Promise<RegisterResult> {
    try {
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
                password: input.passwordHex || input.password,
                business_name: input.businessName.trim(),
                invite_token: input.inviteToken,
                shop_code: generateShopCode(input.businessName),
            }),
        });

        if (res.error || !res.data?.success || !res.data?.token) {
            return {
                success: false,
                error:
                    res.data?.error ||
                    res.error ||
                    "Account initialization failed. Please try again.",
            };
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, res.data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: expiresAt,
            path: "/",
        });

        return {
            success: true,
            shopSlug: res.data.shop_slug || "",
            token: res.data.token,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || "Failed to complete user registration.",
        };
    }
}
