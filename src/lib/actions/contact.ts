"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";

interface ContactFormInput {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    subject: string;
    message: string;
}

export async function submitContactForm(input: ContactFormInput): Promise<{ success: boolean; error?: string }> {
    if (!input.name || !input.email || !input.subject || !input.message) {
        return { success: false, error: "Please fill in all required fields." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
        return { success: false, error: "Please enter a valid email address." };
    }

    try {
        // 1. Send notification to business
        await resend.emails.send({
            from: FROM_EMAIL,
            to: "business@corbantechnologies.org",
            replyTo: input.email,
            subject: `[Manna Books Inquiry] ${input.subject} — ${input.name}`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 640px; margin: 32px auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
        
        <div style="background: #18181b; padding: 24px 32px; display: flex; align-items: center; gap: 12px;">
            <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%;"></div>
            <span style="color: #a1a1aa; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;">NEW INQUIRY // MANNA BOOKS PLATFORM</span>
        </div>
        
        <div style="padding: 32px;">
            <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #09090b; text-transform: uppercase; letter-spacing: -0.02em;">
                ${input.subject}
            </h2>
            <p style="margin: 0 0 28px; font-size: 13px; color: #71717a;">Submitted via mannabooks.co.ke contact form</p>

            <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr style="border-bottom: 1px solid #e4e4e7;">
                        <td style="padding: 10px 0; font-weight: 700; color: #71717a; text-transform: uppercase; font-size: 11px; font-family: monospace; width: 30%;">Name</td>
                        <td style="padding: 10px 0; color: #09090b; font-weight: 600;">${input.name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e4e4e7;">
                        <td style="padding: 10px 0; font-weight: 700; color: #71717a; text-transform: uppercase; font-size: 11px; font-family: monospace;">Email</td>
                        <td style="padding: 10px 0; color: #09090b;"><a href="mailto:${input.email}" style="color: #18181b;">${input.email}</a></td>
                    </tr>
                    ${input.company ? `<tr style="border-bottom: 1px solid #e4e4e7;">
                        <td style="padding: 10px 0; font-weight: 700; color: #71717a; text-transform: uppercase; font-size: 11px; font-family: monospace;">Company</td>
                        <td style="padding: 10px 0; color: #09090b;">${input.company}</td>
                    </tr>` : ""}
                    ${input.phone ? `<tr>
                        <td style="padding: 10px 0; font-weight: 700; color: #71717a; text-transform: uppercase; font-size: 11px; font-family: monospace;">Phone</td>
                        <td style="padding: 10px 0; color: #09090b;">${input.phone}</td>
                    </tr>` : ""}
                </table>
            </div>

            <div style="margin-bottom: 28px;">
                <p style="margin: 0 0 8px; font-weight: 700; color: #71717a; text-transform: uppercase; font-size: 11px; font-family: monospace; letter-spacing: 0.05em;">MESSAGE</p>
                <div style="background: #f4f4f5; border-left: 3px solid #18181b; padding: 16px 20px; border-radius: 4px; font-size: 14px; color: #3f3f46; line-height: 1.7; white-space: pre-wrap;">${input.message}</div>
            </div>

            <a href="mailto:${input.email}?subject=Re: ${input.subject}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Reply to ${input.name}</a>
        </div>

        <div style="padding: 20px 32px; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 11px; color: #a1a1aa; font-family: monospace;">
            MANNA BOOKS // CORBAN TECHNOLOGIES LTD — AUTOMATED CONTACT FORM RELAY
        </div>
    </div>
</body>
</html>`,
        });

        // 2. Send confirmation to the user
        await resend.emails.send({
            from: FROM_EMAIL,
            to: input.email,
            subject: `We received your inquiry — Manna Books`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 640px; margin: 32px auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
        
        <div style="background: #18181b; padding: 32px; text-align: center;">
            <p style="margin: 0 0 12px; color: #71717a; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700;">MANNA BOOKS PLATFORM</p>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; line-height: 1.1;">We got your message.</h1>
            <p style="margin: 12px 0 0; color: #a1a1aa; font-size: 14px;">Your inquiry is in our hands.</p>
        </div>

        <div style="padding: 40px 32px;">
            <p style="font-size: 15px; color: #09090b; font-weight: 600; margin: 0 0 8px;">Hi ${input.name},</p>
            <p style="font-size: 14px; color: #52525b; line-height: 1.7; margin: 0 0 24px;">
                Thank you for reaching out. We have received your inquiry and our team is working on getting back to you as soon as possible — typically within <strong>1–2 business days</strong>.
            </p>

            <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 8px; font-weight: 700; color: #71717a; text-transform: uppercase; font-size: 11px; font-family: monospace; letter-spacing: 0.05em;">YOUR INQUIRY</p>
                <p style="margin: 0 0 6px; font-weight: 700; font-size: 14px; color: #09090b;">${input.subject}</p>
                <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.6; white-space: pre-wrap;">${input.message.substring(0, 200)}${input.message.length > 200 ? "..." : ""}</p>
            </div>

            <p style="font-size: 13px; color: #52525b; line-height: 1.7; margin: 0 0 28px;">
                In the meantime, you can explore Manna Books by creating a free workspace. No credit card required.
            </p>

            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.co.ke"}/signup" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Start Free →</a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.co.ke"}/features" style="display: inline-block; background-color: #ffffff; color: #18181b; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 6px; border: 1px solid #e4e4e7; text-transform: uppercase; letter-spacing: 0.05em;">View Features</a>
            </div>
        </div>

        <div style="padding: 20px 32px; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 11px; color: #a1a1aa; text-align: center; font-family: monospace;">
            © 2026 Manna Books LTD — Powered by Corban Technologies LTD<br>
            <span style="color: #d4d4d8;">This is an automated acknowledgement. Please reply to this email if you have questions.</span>
        </div>
    </div>
</body>
</html>`,
        });

        return { success: true };
    } catch (error) {
        console.error("Contact form email dispatch error:", error);
        return { success: false, error: "Failed to send your message. Please try again or email us directly." };
    }
}
