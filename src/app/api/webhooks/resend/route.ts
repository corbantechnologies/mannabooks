import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resend Webhook handler for email lifecycle tracking (Delivered, Opened, Bounced).
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, data } = body;

        if (!data || !data.email_id) {
            return NextResponse.json({ success: false, error: "Missing email_id in payload." }, { status: 400 });
        }

        const emailId = data.email_id;

        // Locate document with matching resendEmailId
        const doc = await db.query.documents.findFirst({
            where: eq(documents.resendEmailId, emailId),
        });

        if (!doc) {
            // Not tied to a document or already processed
            return NextResponse.json({ success: true, message: "Ignored (no matching document)." });
        }

        if (type === "email.delivered") {
            if (doc.emailDeliveryStatus !== "OPENED") {
                await db.update(documents)
                    .set({ emailDeliveryStatus: "DELIVERED" })
                    .where(eq(documents.id, doc.id));
            }
        } else if (type === "email.opened" || type === "email.clicked") {
            await db.update(documents)
                .set({
                    emailDeliveryStatus: "OPENED",
                    lastEmailOpenedAt: new Date(),
                    isReadByRecipient: true,
                })
                .where(eq(documents.id, doc.id));
        } else if (type === "email.bounced") {
            await db.update(documents)
                .set({ emailDeliveryStatus: "BOUNCED" })
                .where(eq(documents.id, doc.id));
        }

        return NextResponse.json({ success: true, processedType: type });
    } catch (err: any) {
        console.error("Resend webhook error:", err);
        return NextResponse.json({ success: false, error: err?.message || "Webhook processing error." }, { status: 500 });
    }
}
