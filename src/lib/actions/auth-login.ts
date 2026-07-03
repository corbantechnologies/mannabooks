"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/actions/auth";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

interface LoginInput {
    email: string;
    passwordHex: string;
}

export async function loginUserAccount(input: LoginInput) {
    try {
        const cleanEmail = input.email.toLowerCase().trim();

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