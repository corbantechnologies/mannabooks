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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.com";
        const publicSecureLink = `${appUrl}/portal/invoice/${matchToken.token}`;

        // 2. Dispatch the transaction details via Resend
        await resend.emails.send({
            from: `${doc.shop.name.replace(/[^a-zA-Z0-9]/g, "")} Ledger <billing@mannabooks.com>`,
            to: [doc.client.email],
            subject: `Document Notification // ${doc.shop.name} — ${doc.docNumber}`,
            text: `Hello ${doc.client.name},\n\n${doc.shop.name} has issued a new ${doc.type.toLowerCase()} execution tracker file: ${doc.docNumber}.\n\nTotal Balance: ${doc.grandTotal} ${doc.shop.currency}\n\nReview your statement and coordinate remittance instructions instantly through this secure portal link:\n${publicSecureLink}\n\nThank you.`,
        });

        return { success: true };
    } catch (error) {
        console.error("Resend engine automation failed execution:", error);
        return { success: false, error: "Failed to transmit notification message pipelines." };
    }
}