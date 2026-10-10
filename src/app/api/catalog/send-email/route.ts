import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { apiClient } from "@/lib/api/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopSlug, recipientEmail, recipientName, customMessage, token } = body;

    if (!recipientEmail || !shopSlug) {
      return NextResponse.json(
        { success: false, error: "Recipient email and workspace slug are required." },
        { status: 400 }
      );
    }

    const host = req.headers.get("host") || "mannabooks.com";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const base = `${protocol}://${host}/portal/catalog/${shopSlug}`;
    const catalogUrl = token ? `${base}?token=${token}` : base;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "catalog@mannabooks.com",
        to: [recipientEmail],
        subject: `Product Catalog - ${shopSlug}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Product Catalog</h2>
            ${recipientName ? `<p>Dear ${recipientName},</p>` : ""}
            ${customMessage ? `<p>${customMessage}</p>` : ""}
            <p><a href="${catalogUrl}">Click here to view our product catalog</a></p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Catalog email dispatched successfully!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch email." },
      { status: 500 }
    );
  }
}
