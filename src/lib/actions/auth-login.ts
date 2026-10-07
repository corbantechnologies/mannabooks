"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/actions/auth";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { isApiModuleEnabled } from "@/lib/api/flags";
import { apiClient } from "@/lib/api/client";
import { cookies } from "next/headers";

interface LoginInput {
    email: string;
    passwordHex: string;
}

const SESSION_COOKIE_NAME = process.env.COOKIE_NAME || "kenya-nzuri-kabisa";
const SESSION_DURATION_DAYS = Number(process.env.COOKIE_DURATION_DAYS) || 30;

export async function loginUserAccount(input: LoginInput) {
    try {
        const cleanEmail = input.email.toLowerCase().trim();

        // FASTAPI STRANGLER ROUTING:
        if (isApiModuleEnabled("auth")) {
            const res = await apiClient<{ success: boolean; token?: string; error?: string }>("/v1/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: cleanEmail, password: input.passwordHex }),
            });

            if (res.error || !res.data?.success || !res.data?.token) {
                return { success: false, error: res.data?.error || res.error || "Invalid credentials." };
            }

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

            (await cookies()).set(SESSION_COOKIE_NAME, res.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                expires: expiresAt,
                path: "/",
            });

            return { success: true };
        }

        // 1. Locate user record in PostgreSQL
        const userRecord = await db.query.users.findFirst({
            where: eq(users.email, cleanEmail),
        });

        if (!userRecord) {
            return { success: false, error: "Invalid email or password parameters." };
        }

        // 2. Authenticate the password hash match
        const isPasswordValid = await bcrypt.compare(input.passwordHex, userRecord.passwordHash);
        if (!isPasswordValid) {
            return { success: false, error: "Invalid email or password parameters." };
        }

        // 3. Issue stateful database session and set HTTP-only cookie
        await createSession(userRecord.id);

        return { success: true };
    } catch (error) {
        console.error("Critical failure during login mutation processing:", error);
        return { success: false, error: "Authentication system failure. Please try again." };
    }
}