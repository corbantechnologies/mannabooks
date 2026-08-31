"use server";

import { Resend } from "resend";
import { db } from "@/db";
import { documentTokens, documents } from "@/db/schema";
import { eq } from "drizzle-orm";

// Initialize Resend using your active environment variable keys
const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

interface EmailDeliveryInput {
    documentId: string;
    isReminder?: boolean;
}

/**
 * Automates document dispatch by querying the crypt token and emailing the client.
 */
export async function dispatchDocumentEmail({ documentId, isReminder = false }: EmailDeliveryInput) {
    try {
        // 1. Locate the public secure path token for this document
        const matchToken = await db.query.documentTokens.findFirst({
            where: eq(documentTokens.documentId, documentId),
            with: {
                document: {
                    with: { client: true, supplier: true, shop: true }
                }
            }
        });

        if (!matchToken || !matchToken.document) {
            return { success: false, error: "Target token node maps do not exist." };
        }

        const doc = matchToken.document;
        const recipient = doc.client || doc.supplier;
        if (!recipient || !recipient.email) {
            return { success: false, error: "No recipient email address available for this document." };
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.co.ke";
        const publicSecureLink = `${appUrl}/portal/invoice/${matchToken.token}`;

        // Use verified domain email with the dynamic Shop Name as sender
        const rawFrom = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
        const emailMatch = rawFrom.match(/<([^>]+)>/);
        const emailOnly = emailMatch ? emailMatch[1] : (rawFrom.includes("@") ? rawFrom.trim() : "billing@corbantechnologies.org");
        const cleanShopName = (doc.shop?.name || "Manna Books").replace(/[<>"']/g, "").trim();
        const fromAddress = `${cleanShopName} <${emailOnly}>`;

        const isPaidOrReceipt = doc.type === "RECEIPT" || doc.status === "PAID";
        const amountLabel = isPaidOrReceipt ? "AMOUNT SETTLED:" : "AMOUNT DUE:";
        
        const buttonText = 
            doc.type === "RECEIPT" || doc.status === "PAID" ? "View Official Receipt →" :
            doc.type === "QUOTATION" ? "View Quotation Estimate →" :
            doc.type === "DELIVERY_NOTE" ? "View Delivery Note →" :
            doc.type === "CREDIT_NOTE" ? "View Credit Note →" :
            doc.type === "LPO" || doc.type === "PO" ? "View Purchase Order →" :
            "View &amp; Settle Invoice →";

        const introText = isReminder
            ? `This is a polite reminder that your <strong>${doc.type}</strong> (Ref: <code>${doc.docNumber}</code>) is pending settlement.`
            : (isPaidOrReceipt
                ? `An official <strong>${doc.type}</strong> (Ref: <code>${doc.docNumber}</code>) has been issued for your records.`
                : `A new <strong>${doc.type}</strong> (Ref: <code>${doc.docNumber}</code>) has been issued for your account.`);

        const brandColor = doc.shop.primaryColor || "#000000";

        // 2. Dispatch the transaction details via Resend with clean HTML layout
        const { data, error: resendError } = await resend.emails.send({
            from: fromAddress,
            to: [recipient.email],
            replyTo: doc.shop.email ? [doc.shop.email.trim()] : undefined,
            subject: `${doc.shop.name} — ${doc.type} ${doc.docNumber}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff; color: #000000; border: 1px solid ${brandColor}; border-radius: 8px;">
                    <div style="border-bottom: 2px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 24px;">
                        <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; color: ${brandColor}; tracking: -0.05em;">${doc.shop.name}</h1>
                        <p style="font-family: monospace; font-size: 11px; color: #71717a; margin: 4px 0 0 0; text-transform: uppercase;">Official Billing Statement</p>
                    </div>

                    <p style="font-size: 14px; margin-bottom: 20px;">Dear <strong>${recipient.name}</strong>,</p>

                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46; margin-bottom: 24px;">
                        ${introText}
                    </p>

                    <div style="background-color: #f4f4f5; border: 1px solid ${brandColor}; padding: 20px; margin-bottom: 28px; border-radius: 6px;">
                        <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 13px;">
                            <tr>
                                <td style="color: #71717a; padding-bottom: 8px;">DOCUMENT:</td>
                                <td style="text-align: right; font-weight: bold; padding-bottom: 8px;">${doc.docNumber}</td>
                            </tr>
                            <tr>
                                <td style="color: #71717a; padding-bottom: 8px;">TYPE:</td>
                                <td style="text-align: right; font-weight: bold; padding-bottom: 8px;">${doc.type}</td>
                            </tr>
                            <tr>
                                <td style="color: #71717a; padding-bottom: 8px;">${amountLabel}</td>
                                <td style="text-align: right; font-weight: bold; font-size: 16px; color: ${brandColor}; padding-bottom: 8px;">${doc.shop.currency} ${doc.grandTotal}</td>
                            </tr>
                            ${doc.paymentChannel ? `
                            <tr>
                                <td style="color: #71717a; padding-bottom: 8px;">PAYMENT CHANNEL:</td>
                                <td style="text-align: right; font-weight: bold; padding-bottom: 8px;">${doc.paymentChannel} ${doc.paymentReference ? `(Ref: ${doc.paymentReference})` : ''}</td>
                            </tr>` : ''}
                            ${doc.dueDate ? `
                            <tr>
                                <td style="color: #71717a;">DUE DATE:</td>
                                <td style="text-align: right; font-weight: bold;">${new Date(doc.dueDate).toLocaleDateString()}</td>
                            </tr>` : ''}
                        </table>
                    </div>

                    <div style="text-align: center; margin-bottom: 24px;">
                        <a href="${publicSecureLink}" target="_blank" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; font-weight: bold; font-size: 13px; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            ${buttonText}
                        </a>
                    </div>

                    <!-- DIRECT MERCHANT CONTACT & SETTLEMENT INQUIRIES -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 6px 0; font-size: 11px; font-family: monospace; text-transform: uppercase; font-weight: bold; color: #0f172a;">
                            Direct Merchant Contact Details:
                        </h4>
                        <div style="font-size: 12px; color: #334155; line-height: 1.8;">
                            ${doc.shop.phone ? `<div>📞 <strong>Phone:</strong> <a href="tel:${doc.shop.phone.replace(/[^0-9+]/g, "")}" style="color: ${brandColor}; font-weight: bold; text-decoration: none;">${doc.shop.phone}</a> &nbsp;•&nbsp; 💬 <strong>WhatsApp:</strong> <a href="https://wa.me/${doc.shop.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${doc.shop.name}, I am inquiring about ${doc.type} ${doc.docNumber}: ${publicSecureLink}`)}" target="_blank" style="color: #16a34a; font-weight: bold; text-decoration: none;">Chat on WhatsApp →</a></div>` : ''}
                            ${doc.shop.email ? `<div>✉️ <strong>Email:</strong> <a href="mailto:${doc.shop.email}" style="color: ${brandColor}; font-weight: bold; text-decoration: none;">${doc.shop.email}</a> <span style="color: #64748b; font-size: 11px;">(or reply to this email)</span></div>` : ''}
                            ${doc.shop.website ? `<div>🌐 <strong>Website:</strong> <a href="${doc.shop.website.startsWith("http") ? doc.shop.website : `https://${doc.shop.website}`}" target="_blank" style="color: #2563eb; text-decoration: none;">${doc.shop.website}</a></div>` : ''}
                            ${doc.shop.taxPin ? `<div style="font-family: monospace; font-size: 11px; color: #64748b;">🏛️ <strong>KRA Tax PIN:</strong> ${doc.shop.taxPin}</div>` : ''}
                        </div>
                    </div>

                    <div style="border-top: 1px solid #e4e4e7; padding-top: 14px; font-family: monospace; font-size: 10px; color: #94a3b8; text-align: center;">
                        <p style="margin: 0 0 2px 0; font-weight: bold; color: #475569;">${doc.shop.name}</p>
                        <p style="margin: 0;">Direct Portal Link: <a href="${publicSecureLink}" style="color: ${brandColor};">${publicSecureLink}</a></p>
                    </div>
                </div>
            `,
        });

        if (resendError) {
            console.error("Resend API Error:", resendError);
            return { success: false, error: resendError.message || "Email dispatch rejected by mail server." };
        }

        // 3. Update document delivery tracking status
        if (data?.id) {
            try {
                await db.update(documents)
                    .set({
                        emailDeliveryStatus: "SENT",
                        resendEmailId: data.id,
                        lastEmailSentAt: new Date(),
                    })
                    .where(eq(documents.id, doc.id));
            } catch (dbErr) {
                console.error("Failed to update email tracking on document:", dbErr);
            }
        }

        return { success: true, messageId: data?.id };
    } catch (error: any) {
        console.error("Resend engine automation failed execution:", error);
        return { success: false, error: error.message || "Failed to transmit notification message pipelines." };
    }
}