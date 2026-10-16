import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/utils";

const FIELD_LIMITS: Record<string, number> = {
  name: 120,
  email: 200,
  company: 150,
  phone: 40,
  subject: 200,
  message: 5000,
};

/** Public contact form. Sends the enquiry to CONTACT_INBOX_EMAIL via Resend. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const data: Record<string, string> = {};
    for (const [key, max] of Object.entries(FIELD_LIMITS)) {
      data[key] = typeof body?.[key] === "string" ? body[key].trim().slice(0, max) : "";
    }

    // Honeypot field: real users never fill it.
    if (typeof body?.website === "string" && body.website.trim()) {
      return NextResponse.json({ success: true });
    }
    if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.message.length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide your name, a valid email and a message." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const inbox = process.env.CONTACT_INBOX_EMAIL;
    if (!apiKey || !inbox) {
      console.error("Contact form not configured (RESEND_API_KEY / CONTACT_INBOX_EMAIL).");
      return NextResponse.json(
        { success: false, error: "Our contact form is temporarily unavailable. Please email us directly." },
        { status: 503 }
      );
    }

    const rows = Object.keys(FIELD_LIMITS)
      .filter((k) => k !== "message" && data[k])
      .map((k) => `<tr><td style="color:#71717a;padding-right:12px;">${k}</td><td>${escapeHtml(data[k])}</td></tr>`)
      .join("");

    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Manna Books <billing@mannabooks.co.ke>",
      to: [inbox],
      replyTo: [data.email],
      subject: `[Contact] ${data.subject || "New enquiry"} — ${data.name}`,
      html: `<div style="font-family:sans-serif;"><table>${rows}</table><p style="white-space:pre-wrap;">${escapeHtml(data.message)}</p></div>`,
    });

    if (error) {
      console.error("Contact email failed:", error);
      return NextResponse.json({ success: false, error: "Failed to send your message. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ success: false, error: "Failed to send your message." }, { status: 500 });
  }
}
