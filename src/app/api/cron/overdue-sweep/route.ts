import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, shops, users } from "@/db/schema";
import { eq, and, isNotNull, lt, inArray } from "drizzle-orm";
import { Resend } from "resend";
import { formatCurrency } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.mannabooks.co.ke";

export async function GET(req: NextRequest) {
    return handleCron(req);
}

export async function POST(req: NextRequest) {
    return handleCron(req);
}

async function handleCron(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const urlSecret = req.nextUrl.searchParams.get("secret");

    // Allow execution if CRON_SECRET matches, or in development mode
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && urlSecret !== cronSecret) {
        return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
    }

    const now = new Date();

    const summary = {
        totalEvaluated: 0,
        markedOverdue: 0,
        notificationsSent: 0,
        errors: [] as string[],
    };

    try {
        // 1. Fetch all ISSUED documents with past due dates
        const overdueCandidates = await db.query.documents.findMany({
            where: and(
                eq(documents.status, "ISSUED"),
                isNotNull(documents.dueDate),
                lt(documents.dueDate, now)
            ),
            with: {
                shop: {
                    with: {
                        owner: true,
                    },
                },
                client: true,
            },
        });

        summary.totalEvaluated = overdueCandidates.length;

        if (overdueCandidates.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No overdue documents detected during sweep.",
                summary,
                timestamp: now.toISOString(),
            });
        }

        // 2. Batch update status to OVERDUE
        const docIdsToUpdate = overdueCandidates.map((d) => d.id);
        await db.update(documents)
            .set({ status: "OVERDUE" })
            .where(inArray(documents.id, docIdsToUpdate));

        summary.markedOverdue = docIdsToUpdate.length;

        // 3. Group by Shop to send notification to each shop owner
        const shopMap: Record<string, { shop: typeof overdueCandidates[0]["shop"]; docs: typeof overdueCandidates }> = {};
        for (const doc of overdueCandidates) {
            if (!doc.shop) continue;
            if (!shopMap[doc.shopId]) {
                shopMap[doc.shopId] = { shop: doc.shop, docs: [] };
            }
            shopMap[doc.shopId].docs.push(doc);
        }

        for (const shopId of Object.keys(shopMap)) {
            const { shop, docs } = shopMap[shopId];
            const ownerEmail = shop.owner?.email || shop.email;
            if (!ownerEmail) continue;

            const totalOverdueVal = docs.reduce((acc, d) => acc + parseFloat(d.grandTotal || "0"), 0);

            try {
                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: [ownerEmail],
                    subject: `⚠️ [${shop.name}] ${docs.length} Invoice${docs.length > 1 ? "s" : ""} Transitioned to Overdue`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b;">
                            <h2 style="font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0 0 12px 0;">
                                ${shop.name} — Automated Aging Sweep
                            </h2>
                            <p style="font-size: 13px; color: #52525b; line-height: 1.5;">
                                The daily aging monitor has identified <strong>${docs.length} invoice${docs.length > 1 ? "s" : ""}</strong> amounting to 
                                <strong>${formatCurrency(totalOverdueVal, shop.currency)}</strong> that passed their payment due date and have been transitioned to <code>OVERDUE</code>.
                            </p>

                            <div style="margin: 20px 0; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: monospace;">
                                    <thead>
                                        <tr style="background-color: #f4f4f5; text-align: left; border-bottom: 1px solid #e4e4e7;">
                                            <th style="padding: 8px 12px;">Invoice</th>
                                            <th style="padding: 8px 12px;">Client</th>
                                            <th style="padding: 8px 12px; text-align: right;">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${docs.slice(0, 10).map((d) => `
                                            <tr style="border-bottom: 1px solid #f4f4f5;">
                                                <td style="padding: 8px 12px; font-weight: bold;">${d.docNumber}</td>
                                                <td style="padding: 8px 12px;">${d.client?.name || "Walk-in"}</td>
                                                <td style="padding: 8px 12px; text-align: right;">${formatCurrency(d.grandTotal, shop.currency)}</td>
                                            </tr>
                                        `).join("")}
                                    </tbody>
                                </table>
                            </div>

                            <p style="margin-top: 24px;">
                                <a href="${APP_URL}/workspaces/${shop.slug}/documents?status=OVERDUE" style="background-color: #000000; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                                    View Overdue Invoices →
                                </a>
                            </p>
                        </div>
                    `,
                });
                summary.notificationsSent += 1;
            } catch (err: any) {
                summary.errors.push(`Email error for shop ${shop.name}: ${err?.message || "Unknown error"}`);
            }
        }

        return NextResponse.json({
            success: true,
            summary,
            timestamp: now.toISOString(),
        });
    } catch (err: any) {
        return NextResponse.json({
            success: false,
            error: err?.message || "Failed to run overdue status sweep.",
        }, { status: 500 });
    }
}
