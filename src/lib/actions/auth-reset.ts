"use server";

import { apiClient } from "@/lib/api/client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

/**
 * Generates a secure token and emails a password reset link to the user via FastAPI.
 */
export async function requestPasswordReset(email: string) {
    try {
        const normalizedEmail = email.toLowerCase().trim();

        const res = await apiClient<{ success: boolean; token?: string; userName?: string; email?: string }>(
            "/v1/auth/forgot-password",
            {
                method: "POST",
                body: JSON.stringify({ email: normalizedEmail }),
            }
        );

        // If backend returned a reset token, dispatch the email via Resend
        if (res.data?.success && res.data.token) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.co.ke";
            const resetLink = `${appUrl}/reset-password?token=${res.data.token}`;
            const fromAddress = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
            const userName = res.data.userName || "Customer";

            await resend.emails.send({
                from: fromAddress,
                to: email,
                subject: "Manna Books - Password Reset Request",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
                        <h2 style="font-weight: 800;">Password Reset Request</h2>
                        <p>Hello ${userName},</p>
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
            }).catch((err) => {
                console.error("[requestPasswordReset] Resend email send failed:", err);
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Password reset request failed:", error);
        return { success: false, error: "System failure while processing reset request." };
    }
}

/**
 * Validates the token and updates the user's password via FastAPI.
 */
export async function resetPasswordWithToken(token: string, newPasswordRaw: string) {
    try {
        const res = await apiClient<{ success: boolean; error?: string }>(
            "/v1/auth/reset-password",
            {
                method: "POST",
                body: JSON.stringify({
                    token: token.trim(),
                    new_password: newPasswordRaw,
                }),
            }
        );

        if (res.error || !res.data?.success) {
            return {
                success: false,
                error: res.error || "The reset link is invalid or has expired. Please request a new one.",
            };
        }

        return { success: true };
    } catch (error) {
        console.error("Password reset action failed:", error);
        return { success: false, error: "Failed to reset password." };
    }
}

