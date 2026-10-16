// src/lib/actions/auth.ts
"use server";

import { apiClient } from "@/lib/api/client";
import { clearSessionCookies, getClientMeta, getRefreshToken, setSessionCookies } from "@/lib/auth/session-cookie";

export interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
    businessName: string;
    inviteToken?: string;
}

export interface RegisterResult {
    success: boolean;
    error?: string;
    shopSlug?: string;
}

/**
 * Signs this device out: revokes the refresh-token family and the current access token on the
 * backend, then clears the session cookies.
 */
export async function invalidateSession(): Promise<void> {
    try {
        const refreshToken = await getRefreshToken();
        await apiClient.post("/v1/auth/logout", { refresh_token: refreshToken || null });
    } catch {
        // Clearing the cookies below still signs the browser out.
    }
    await clearSessionCookies();
}

/**
 * Registers a new user and workspace through the FastAPI backend and signs them in.
 */
export async function registerUser(input: RegisterUserInput): Promise<RegisterResult> {
    const res = await apiClient<{
        success: boolean;
        token?: string;
        refresh_token?: string;
        expires_in?: number;
        refresh_expires_in?: number;
        shop_slug?: string;
        error?: string;
    }>("/v1/auth/register", {
        method: "POST",
        anonymous: true,
        headers: await getClientMeta(),
        body: JSON.stringify({
            name: (input.name || "").trim(),
            email: (input.email || "").toLowerCase().trim(),
            password: input.password,
            business_name: (input.businessName || "").trim(),
            invite_token: input.inviteToken || null,
        }),
    });

    const data = res.data;
    if (res.error || !data?.success || !data.token || !data.refresh_token) {
        return {
            success: false,
            error: data?.error || res.error || "Account initialization failed. Please try again.",
        };
    }

    await setSessionCookies({
        access_token: data.token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in ?? 15 * 60,
        refresh_expires_in: data.refresh_expires_in ?? 30 * 24 * 60 * 60,
    });
    return { success: true, shopSlug: data.shop_slug || "" };
}
