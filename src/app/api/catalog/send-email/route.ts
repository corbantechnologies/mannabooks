import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { apiClient } from "@/lib/api/client";
import { verifyAndGetSession } from "@/lib/auth/session";
import { escapeHtml } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAndGetSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { shopSlug, recipientEmail, recipientName, customMessage, token } = body ?? {};

    if (typeof recipientEmail !== "string" || !EMAIL_RE.test(recipientEmail) || typeof shopSlug !== "string" || !shopSlug) {
      return NextResponse.json(
        { success: false, error: "A valid recipient email and workspace slug are required." },
        { status: 400 }
      );
    }

    // The caller must be a member of the workspace whose catalog is being sent.
    const ctxRes = await apiClient.get<{ success: boolean; shop?: { name?: string; email?: string } }>(
      `/v1/workspaces/by-slug/${encodeURIComponent(shopSlug)}/context`
    );
    if (!ctxRes.data?.success || !ctxRes.data.shop) {
      return NextResponse.json({ success: false, error: "Workspace not found." }, { status: 404 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ success: false, error: "Email delivery is not configured." }, { status: 503 });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.mannabooks.co.ke").replace(/\/$/, "");
    const base = `${appUrl}/portal/catalog/${encodeURIComponent(shopSlug)}`;
    const safeToken = typeof token === "string" && /^[A-Za-z0-9_-]{1,2000}$/.test(token) ? token : "";
    const catalogUrl = safeToken ? `${base}?token=${safeToken}` : base;
    const shopName = ctxRes.data.shop.name || shopSlug;

    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Manna Books <billing@mannabooks.co.ke>",
      to: [recipientEmail],
      replyTo: ctxRes.data.shop.email ? [ctxRes.data.shop.email] : undefined,
      subject: `Product Catalog - ${shopName}`,
      html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>${escapeHtml(shopName)} Product Catalog</h2>
            ${recipientName ? `<p>Dear ${escapeHtml(String(recipientName))},</p>` : ""}
            ${customMessage ? `<p>${escapeHtml(String(customMessage).slice(0, 2000))}</p>` : ""}
            <p><a href="${escapeHtml(catalogUrl)}">Click here to view our product catalog</a></p>
          </div>
        `,
    });

    if (error) {
      console.error("Catalog email send failed:", error);
      return NextResponse.json({ success: false, error: "Email provider rejected the message." }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: "Catalog email dispatched successfully!" });
  } catch (err) {
    console.error("Catalog email route error:", err);
    return NextResponse.json({ success: false, error: "Failed to dispatch email." }, { status: 500 });
  }
}
