// src/lib/actions/auth-login.ts
"use server";

import { apiClient } from "@/lib/api/client";
import { getClientMeta, setSessionCookies, type SessionTokens } from "@/lib/auth/session-cookie";

export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginResult {
    success: boolean;
    error?: string;
}

/**
 * Authenticates credentials against the FastAPI backend and stores the access and refresh tokens
 * in HttpOnly cookies. Tokens are never returned to the browser.
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
    const email = (input.email || "").toLowerCase().trim();
    const password = input.password || "";
    if (!email || !password) {
        return { success: false, error: "Email and password are required." };
    }

    const res = await apiClient<SessionTokens>("/v1/auth/token", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        anonymous: true,
        headers: await getClientMeta(),
    });

    if (res.error || !res.data?.access_token || !res.data.refresh_token) {
        return {
            success: false,
            error: res.status === 429 ? res.error : res.status >= 500 ? "Login is temporarily unavailable. Please try again." : "Invalid email or password.",
        };
    }

    await setSessionCookies(res.data);
    return { success: true };
}
