import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { duplicateDocument, updateDocumentStatus } from "@/lib/actions/documents";
import { dispatchDocumentEmail } from "@/lib/actions/email";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Verify Vercel Cron Authentication
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized CRON request", { status: 401 });
    }

    try {
        const now = new Date();
        
        // 2. Fetch all recurring documents due for generation
        const pendingRecurring = await db.query.documents.findMany({
            where: and(
                eq(documents.isRecurring, true),
                lte(documents.nextRecurringDate, now)
            ),
            with: {
                client: true,
                supplier: true,
            }
        });

        const results = [];

        // 3. Process each document
        for (const doc of pendingRecurring) {
            // Clone the original document securely
            const duplicateRes = await duplicateDocument(doc.id, doc.shopId, doc.shopId); // using shopId for slug as placeholder, it only affects revalidatePath which is harmless
            
            if (duplicateRes.success && duplicateRes.documentId) {
                // Determine target status
                const defaultStatus = doc.type === "RECEIPT" || doc.type === "PAYMENT_VOUCHER" || doc.type === "PAYROLL_VOUCHER" ? "PAID" : "ISSUED";

                // Escalate document to ISSUED/PAID state
                await updateDocumentStatus({
                    documentId: duplicateRes.documentId,
                    shopId: doc.shopId,
                    shopSlug: "cron-engine", 
                    status: defaultStatus
                });

                // Auto-Dispatch via Email
                const recipient = doc.client || doc.supplier;
                const emailAddress = recipient ? recipient.email : null;
                let emailSent = false;
                
                if (emailAddress) {
                    const emailRes = await dispatchDocumentEmail({ documentId: duplicateRes.documentId });
                    emailSent = emailRes.success;
                }

                // 4. Advance Next Recurring Date
                const nextDate = new Date(doc.nextRecurringDate || now);
                switch(doc.recurringInterval) {
                    case "WEEKLY": 
                        nextDate.setDate(nextDate.getDate() + 7); 
                        break;
                    case "MONTHLY": 
                        nextDate.setMonth(nextDate.getMonth() + 1); 
                        break;
                    case "QUARTERLY": 
                        nextDate.setMonth(nextDate.getMonth() + 3); 
                        break;
                    case "YEARLY": 
                        nextDate.setFullYear(nextDate.getFullYear() + 1); 
                        break;
                    default:
                        nextDate.setMonth(nextDate.getMonth() + 1);
                }

                await db.update(documents)
                    .set({ nextRecurringDate: nextDate })
                    .where(eq(documents.id, doc.id));

                results.push({ 
                    originalDocId: doc.id, 
                    newDocId: duplicateRes.documentId, 
                    emailSent,
                    advancedDate: nextDate 
                });
            } else {
                results.push({ 
                    originalDocId: doc.id, 
                    error: duplicateRes.error 
                });
            }
        }

        return NextResponse.json({ 
            success: true, 
            processedCount: results.length, 
            engineLogs: results 
        });

    } catch (error: any) {
        console.error("Cron Engine Failure:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
