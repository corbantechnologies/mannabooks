"use server";

import { Resend } from "resend";
import { db } from "@/db";
import { shops, clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getClientStatement } from "@/lib/actions/reports";
import { formatCurrency } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";

interface SendStatementInput {
    shopId: string;
    clientId: string;
    startDate?: Date;
    endDate?: Date;
    recipientEmail?: string;
    customNote?: string;
}

export async function sendClientStatementEmailAction({
    shopId,
    clientId,
    startDate,
    endDate,
    recipientEmail,
    customNote,
}: SendStatementInput) {
    try {
        const [shop, client] = await Promise.all([
            db.query.shops.findFirst({ where: eq(shops.id, shopId) }),
            db.query.clients.findFirst({ where: and(eq(clients.id, clientId), eq(clients.shopId, shopId)) }),
        ]);

        if (!shop || !client) {
            return { success: false, error: "Shop or Client record not found." };
        }

        const targetEmail = recipientEmail || client.email;
        if (!targetEmail) {
            return { success: false, error: "No destination email address found for this client." };
        }

        const statementResult = await getClientStatement(shopId, clientId, startDate, endDate);
        if (!statementResult.success || !statementResult.data) {
            return { success: false, error: "Could not compile statement data." };
        }

        const data = statementResult.data;
        const brandColor = shop.primaryColor || "#000000";

        const rawFrom = FROM_EMAIL;
        const emailMatch = rawFrom.match(/<([^>]+)>/);
        const emailOnly = emailMatch ? emailMatch[1] : (rawFrom.includes("@") ? rawFrom.trim() : "billing@corbantechnologies.org");
        const cleanShopName = (shop.name || "Manna Books").replace(/[<>"']/g, "").trim();
        const fromAddress = `${cleanShopName} <${emailOnly}>`;

        await resend.emails.send({
            from: fromAddress,
            to: [targetEmail],
            replyTo: shop.email ? [shop.email.trim()] : undefined,
            subject: `Statement of Account — ${shop.name} (${data.periodLabel})`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; padding: 32px; background-color: #ffffff; color: #18181b; border: 1px solid ${brandColor}; border-radius: 8px;">
                    <div style="border-bottom: 2px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; color: ${brandColor};">${shop.name}</h1>
                            <p style="font-family: monospace; font-size: 11px; color: #71717a; margin: 4px 0 0 0; text-transform: uppercase;">Official Statement of Account</p>
                        </div>
                    </div>

                    <p style="font-size: 14px; margin-bottom: 16px;">Dear <strong>${client.name}</strong>,</p>

                    <p style="font-size: 13px; line-height: 1.5; color: #3f3f46; margin-bottom: 20px;">
                        Please find below your official transaction statement for the period <strong>${data.periodLabel}</strong>.
                    </p>

                    ${customNote ? `
                        <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #713f12;">
                            ${customNote}
                        </div>
                    ` : ""}

                    <!-- SUMMARY CARDS -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; background-color: #f4f4f5; padding: 16px; border-radius: 6px; font-family: monospace;">
                        <div>
                            <span style="font-size: 10px; color: #71717a; text-transform: uppercase; display: block;">Total Invoiced:</span>
                            <span style="font-size: 14px; font-weight: bold; color: #000000;">${formatCurrency(data.totalDebits, data.currency)}</span>
                        </div>
                        <div>
                            <span style="font-size: 10px; color: #71717a; text-transform: uppercase; display: block;">Total Paid:</span>
                            <span style="font-size: 14px; font-weight: bold; color: #059669;">${formatCurrency(data.totalCredits, data.currency)}</span>
                        </div>
                        <div>
                            <span style="font-size: 10px; color: #71717a; text-transform: uppercase; display: block;">Outstanding Balance:</span>
                            <span style="font-size: 14px; font-weight: bold; color: ${data.closingBalance > 0 ? '#dc2626' : '#000000'};">${formatCurrency(data.closingBalance, data.currency)}</span>
                        </div>
                    </div>

                    <!-- TRANSACTION TABLE -->
                    <div style="border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden; margin-bottom: 28px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: monospace;">
                            <thead>
                                <tr style="background-color: #f4f4f5; text-align: left; border-bottom: 1px solid #e4e4e7;">
                                    <th style="padding: 8px 10px;">Date</th>
                                    <th style="padding: 8px 10px;">Ref</th>
                                    <th style="padding: 8px 10px;">Type</th>
                                    <th style="padding: 8px 10px; text-align: right;">Billed</th>
                                    <th style="padding: 8px 10px; text-align: right;">Paid</th>
                                    <th style="padding: 8px 10px; text-align: right;">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.lines.map((l) => `
                                    <tr style="border-bottom: 1px solid #f4f4f5;">
                                        <td style="padding: 6px 10px;">${l.date}</td>
                                        <td style="padding: 6px 10px; font-weight: bold;">${l.reference}</td>
                                        <td style="padding: 6px 10px;">${l.docType}</td>
                                        <td style="padding: 6px 10px; text-align: right;">${l.debit > 0 ? formatCurrency(l.debit, data.currency) : "—"}</td>
                                        <td style="padding: 6px 10px; text-align: right; color: #059669;">${l.credit > 0 ? formatCurrency(l.credit, data.currency) : "—"}</td>
                                        <td style="padding: 6px 10px; text-align: right; font-weight: bold;">${formatCurrency(l.runningBalance, data.currency)}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>

                    <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 16px;">
                        ${shop.phone ? `Phone: ${shop.phone} · ` : ""}${shop.email ? `Email: ${shop.email} · ` : ""}Thank you for your business.
                    </p>
                </div>
            `,
        });

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to dispatch statement email." };
    }
}
