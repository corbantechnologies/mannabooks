import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { apiClient } from "@/lib/api/client";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

interface EmailPayload {
  documentId?: string;
  documentIds?: string[];
  recipientEmail?: string;
  isReminder?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: EmailPayload = await req.json();

    if (body.documentIds && Array.isArray(body.documentIds)) {
      // Bulk dispatch
      const results = { sent: 0, failed: 0, errors: [] as string[] };
      for (const id of body.documentIds) {
        try {
          const res = await sendSingleEmail(id, false, undefined);
          if (res.success) {
            results.sent++;
          } else {
            results.failed++;
            if (res.error) results.errors.push(res.error);
          }
        } catch (err: any) {
          results.failed++;
          results.errors.push(err.message || `Failed to email document ${id}`);
        }
      }
      return NextResponse.json(results);
    }

    if (!body.documentId) {
      return NextResponse.json({ success: false, error: "documentId is required" }, { status: 400 });
    }

    const res = await sendSingleEmail(body.documentId, body.isReminder, body.recipientEmail);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Email dispatch route error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to dispatch email." }, { status: 500 });
  }
}

async function sendSingleEmail(
  documentId: string,
  isReminder = false,
  recipientEmail?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // Fetch document with client/supplier/shop details from FastAPI
  const docRes = await apiClient.get<any>(`/v1/documents/${documentId}?full=true`);
  if (docRes.error || !docRes.data) {
    return { success: false, error: docRes.error || "Document not found." };
  }

  const doc = docRes.data;
  const recipient = doc.client || doc.supplier;
  const targetEmail = recipientEmail?.trim() || recipient?.email?.trim();

  if (!targetEmail) {
    return { success: false, error: "No recipient email address available for this document." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.co.ke";
  const token = doc.token_record?.token || doc.id;
  const publicSecureLink = `${appUrl}/portal/invoice/${token}`;

  const rawFrom = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
  const emailMatch = rawFrom.match(/<([^>]+)>/);
  const emailOnly = emailMatch ? emailMatch[1] : (rawFrom.includes("@") ? rawFrom.trim() : "billing@corbantechnologies.org");
  const shopName = doc.shop?.name || "Manna Books";
  const cleanShopName = shopName.replace(/[<>"']/g, "").trim();
  const fromAddress = `${cleanShopName} <${emailOnly}>`;

  const isPaidOrReceipt = doc.type === "RECEIPT" || doc.status === "PAID";
  const amountLabel = isPaidOrReceipt ? "AMOUNT SETTLED:" : "AMOUNT DUE:";

  const buttonText =
    doc.type === "RECEIPT" || doc.status === "PAID"
      ? "View Official Receipt →"
      : doc.type === "QUOTATION"
      ? "View Quotation Estimate →"
      : doc.type === "DELIVERY_NOTE"
      ? "View Delivery Note →"
      : doc.type === "CREDIT_NOTE"
      ? "View Credit Note →"
      : doc.type === "LPO" || doc.type === "PO"
      ? "View Purchase Order →"
      : "View & Settle Invoice →";

  const introText = isReminder
    ? `This is a polite reminder that your <strong>${doc.type}</strong> (Ref: <code>${doc.doc_number || doc.docNumber}</code>) is pending settlement.`
    : isPaidOrReceipt
    ? `An official <strong>${doc.type}</strong> (Ref: <code>${doc.doc_number || doc.docNumber}</code>) has been issued for your records.`
    : `A new <strong>${doc.type}</strong> (Ref: <code>${doc.doc_number || doc.docNumber}</code>) has been issued for your account.`;

  const brandColor = doc.shop?.primary_color || doc.shop?.primaryColor || "#000000";
  const currency = doc.currency || doc.shop?.currency || "KES";
  const grandTotal = doc.grand_total || doc.grandTotal || "0.00";
  const docNumber = doc.doc_number || doc.docNumber;

  const { data, error: resendError } = await resend.emails.send({
    from: fromAddress,
    to: [targetEmail],
    replyTo: doc.shop?.email ? [doc.shop.email.trim()] : undefined,
    subject: `${shopName} — ${doc.type} ${docNumber}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff; color: #000000; border: 1px solid ${brandColor}; border-radius: 8px;">
        <div style="border-bottom: 2px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; color: ${brandColor};">${shopName}</h1>
          <p style="font-family: monospace; font-size: 11px; color: #71717a; margin: 4px 0 0 0; text-transform: uppercase;">Official Billing Statement</p>
        </div>
        <p style="font-size: 14px; margin-bottom: 20px;">Dear <strong>${recipient?.name || "Valued Client"}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #3f3f46; margin-bottom: 24px;">${introText}</p>
        <div style="background-color: #f4f4f5; border: 1px solid ${brandColor}; padding: 20px; margin-bottom: 28px; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 13px;">
            <tr>
              <td style="color: #71717a; padding-bottom: 8px;">DOCUMENT:</td>
              <td style="text-align: right; font-weight: bold; padding-bottom: 8px;">${docNumber}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding-bottom: 8px;">TYPE:</td>
              <td style="text-align: right; font-weight: bold; padding-bottom: 8px;">${doc.type}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding-bottom: 8px;">${amountLabel}</td>
              <td style="text-align: right; font-weight: bold; font-size: 16px; color: ${brandColor}; padding-bottom: 8px;">${currency} ${grandTotal}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${publicSecureLink}" target="_blank" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; font-weight: bold; font-size: 13px; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 6px;">
            ${buttonText}
          </a>
        </div>
      </div>
    `,
  });

  if (resendError) {
    return { success: false, error: resendError.message || "Email dispatch rejected by mail server." };
  }

  return { success: true, messageId: data?.id };
}
