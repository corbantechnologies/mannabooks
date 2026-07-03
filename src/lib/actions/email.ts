"use server";

import { Resend } from "resend";
import { db } from "@/db";
import { documentTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

// Initialize Resend using your active environment variable keys
const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

interface EmailDeliveryInput {
    documentId: string;
}

/**
 * Automates document dispatch by querying the crypt token and emailing the client.
 */
export async function dispatchDocumentEmail({ documentId }: EmailDeliveryInput) {
    try {
        // 1. Locate the public secure path token for this document
        const matchToken = await db.query.documentTokens.findFirst({
            where: eq(documentTokens.documentId, documentId),
            with: {
                document: {
                    with: { client: true, shop: true }
                }
            }
        });

        if (!matchToken || !matchToken.document) {
            return { success: false, error: "Target token node maps do not exist." };
        }

        const doc = matchToken.document;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.vercel.app";
        const publicSecureLink = `${appUrl}/portal/invoice/${matchToken.token}`;

        // Use verified corbantechnologies.org domain address
        const fromAddress = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";

        // 2. Dispatch the transaction details via Resend with clean HTML layout
        const { data, error: resendError } = await resend.emails.send({
            from: fromAddress,
            to: [doc.client.email],
            subject: `${doc.shop.name} — ${doc.type} ${doc.docNumber}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff; color: #000000; border: 1px solid #000000;">
                    <div style="border-bottom: 2px solid #000000; padding-bottom: 16px; margin-bottom: 24px;">
                        <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; tracking: -0.05em;">${doc.shop.name}</h1>
                        <p style="font-family: monospace; font-size: 11px; color: #71717a; margin: 4px 0 0 0; text-transform: uppercase;">Official Billing Statement</p>
                    </div>

                    <p style="font-size: 14px; margin-bottom: 20px;">Dear <strong>${doc.client.name}</strong>,</p>

                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46; margin-bottom: 24px;">
                        A new <strong>${doc.type}</strong> (Ref: <code>${doc.docNumber}</code>) has been issued for your account.
                    </p>

                    <div style="background-color: #f4f4f5; border: 1px solid #000000; padding: 20px; margin-bottom: 28px;">
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
                                <td style="color: #71717a; padding-bottom: 8px;">AMOUNT DUE:</td>
                                <td style="text-align: right; font-weight: bold; font-size: 16px; padding-bottom: 8px;">${doc.shop.currency} ${doc.grandTotal}</td>
                            </tr>
                            ${doc.dueDate ? `
                            <tr>
                                <td style="color: #71717a;">DUE DATE:</td>
                                <td style="text-align: right; font-weight: bold;">${new Date(doc.dueDate).toLocaleDateString()}</td>
                            </tr>` : ''}
                        </table>
                    </div>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <a href="${publicSecureLink}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-weight: bold; font-size: 13px; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border: 1px solid #000000;">
                            View &amp; Settle Document →
                        </a>
                    </div>

                    <div style="border-t: 1px solid #e4e4e7; pt: 16px; font-family: monospace; font-size: 10px; color: #a1a1aa; text-align: center;">
                        Direct Portal Link: <a href="${publicSecureLink}" style="color: #000000;">${publicSecureLink}</a>
                    </div>
                </div>
            `,
        });

        if (resendError) {
            console.error("Resend API Error:", resendError);
            return { success: false, error: resendError.message || "Email dispatch rejected by mail server." };
        }

        return { success: true, messageId: data?.id };
    } catch (error: any) {
        console.error("Resend engine automation failed execution:", error);
        return { success: false, error: error.message || "Failed to transmit notification message pipelines." };
    }
}