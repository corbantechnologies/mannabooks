"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/actions/auth";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { isApiModuleEnabled } from "@/lib/api/flags";
import { apiClient } from "@/lib/api/client";

interface LoginInput {

  email: string;
  passwordHex: string;
}

export async function loginUserAccount(input: LoginInput) {
  try {
    const cleanEmail = input.email.toLowerCase().trim();

    // FASTAPI STRANGLER ROUTING
    if (isApiModuleEnabled("auth")) {
      const res = await apiClient<{
        success: boolean;
        token?: string;
        error?: string;
      }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: cleanEmail, password: input.passwordHex }),
      });

      if (res.error || !res.data?.success || !res.data?.token) {
        return {
          success: false,
          error: res.data?.error || res.error || "Invalid credentials.",
        };
      }

      // Return the token for pure client JWT storage in localStorage
      return {
        success: true,
        token: res.data.token,
      };
    }


    // Legacy local DB path
    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
    });

    if (!userRecord) {
      return { success: false, error: "Invalid email or password parameters." };
    }

    const isPasswordValid = await bcrypt.compare(
      input.passwordHex,
      userRecord.passwordHash
    );
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password parameters." };
    }

    await createSession(userRecord.id);

    return { success: true };
  } catch (error) {
    console.error("Critical failure during login mutation processing:", error);
    return {
      success: false,
      error: "Authentication system failure. Please try again.",
    };
  }
}