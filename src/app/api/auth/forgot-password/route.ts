import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { apiClient } from "@/lib/api/client";
import { escapeHtml } from "@/lib/utils";

const GENERIC_RESPONSE = {
  success: true,
  message: "If an account exists for that email, a reset link has been sent.",
};

/**
 * Password reset request. The backend issues a single-use token ONLY to this server (internal key),
 * and we email the link. The browser always gets the same generic answer, so this endpoint can't be
 * used to discover accounts or obtain tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
    const res = await apiClient.post<{ success: boolean; token?: string; userName?: string; email?: string }>(
      "/v1/auth/forgot-password",
      { email },
      { anonymous: true, headers: clientIp ? { "X-Client-IP": clientIp } : undefined }
    );

    if (res.status === 429) {
      return NextResponse.json({ success: false, error: res.error }, { status: 429 });
    }

    const token = res.data?.token;
    if (token && res.data?.email) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.error("RESEND_API_KEY missing; password reset email not sent.");
      } else {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.mannabooks.co.ke").replace(/\/$/, "");
        const link = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
        const { error } = await new Resend(apiKey).emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Manna Books <billing@mannabooks.co.ke>",
          to: [res.data.email],
          subject: "Reset your MannaBooks password",
          html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
              <h2>Reset your password</h2>
              <p>Hi ${escapeHtml(res.data.userName || "there")},</p>
              <p>We received a request to reset your MannaBooks password. This link expires in 1 hour.</p>
              <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#000;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Choose a new password</a></p>
              <p style="color:#71717a;font-size:12px;">If you didn't ask for this, you can ignore this email. Your password won't change.</p>
            </div>`,
        });
        if (error) console.error("Password reset email failed:", error);
      }
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error("Forgot password route error:", err);
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
