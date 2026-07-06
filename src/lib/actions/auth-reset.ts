"use server";

import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

/**
 * Generates a secure token and emails a password reset link to the user.
 */
export async function requestPasswordReset(email: string) {
    try {
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Verify user exists
        const userMatch = await db.query.users.findFirst({
            where: eq(users.email, normalizedEmail),
        });

        if (!userMatch) {
            // Security Best Practice: Don't reveal whether the email exists or not
            return { success: true };
        }

        // 2. Generate cryptographically secure token
        const rawToken = crypto.randomBytes(32).toString("hex");
        
        // Expiration: 1 hour from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // 3. Clear any existing tokens for this user to prevent token hoarding
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userMatch.id));

        // 4. Store token
        await db.insert(passwordResetTokens).values({
            userId: userMatch.id,
            token: rawToken,
            expiresAt,
        });

        // 5. Send Email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.co.ke";
        const resetLink = `${appUrl}/reset-password?token=${rawToken}`;
        
        const fromAddress = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";

        await resend.emails.send({
            from: fromAddress,
            to: normalizedEmail,
            subject: "Manna Books - Password Reset Request",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
                    <h2 style="font-weight: 800;">Password Reset Request</h2>
                    <p>Hello ${userMatch.name},</p>
                    <p>We received a request to reset the password associated with your Manna Books account. This link will expire in 1 hour.</p>
                    <p>
                        <a href="${resetLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; margin-top: 10px;">
                            Reset Password
                        </a>
                    </p>
                    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">
                        If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                </div>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("Password reset request failed:", error);
        return { success: false, error: "System failure while processing reset request." };
    }
}

/**
 * Validates the token and updates the user's password.
 */
export async function resetPasswordWithToken(token: string, newPasswordRaw: string) {
    try {
        const now = new Date();

        // 1. Validate token presence and expiration
        const tokenMatch = await db.query.passwordResetTokens.findFirst({
            where: and(
                eq(passwordResetTokens.token, token),
                gt(passwordResetTokens.expiresAt, now)
            ),
            with: {
                user: true
            }
        });

        if (!tokenMatch || !tokenMatch.user) {
            return { success: false, error: "The reset link is invalid or has expired. Please request a new one." };
        }

        // 2. Hash new password
        const passwordHash = await bcrypt.hash(newPasswordRaw, 10);

        // 3. Update User Record
        await db.update(users)
            .set({ passwordHash })
            .where(eq(users.id, tokenMatch.userId));

        // 4. Burn the token so it cannot be reused
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenMatch.id));

        return { success: true };
    } catch (error) {
        console.error("Password reset action failed:", error);
        return { success: false, error: "Failed to reset password." };
    }
}
