"use server";

import { Resend } from "resend";
import { db } from "@/db";
import { documents, documentTokens, documentNotes, shops, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

async function resolveDocByToken(token: string) {
  // 1. Look up token in documentTokens
  const tokenRec = await db.query.documentTokens.findFirst({
    where: eq(documentTokens.token, token),
    with: {
      document: {
        with: {
          client: true,
          supplier: true,
          shop: {
            with: { owner: true }
          }
        }
      }
    }
  });

  if (tokenRec?.document) return tokenRec.document;

  // 2. Direct lookup by ID
  const directDoc = await db.query.documents.findFirst({
    where: eq(documents.id, token),
    with: {
      client: true,
      supplier: true,
      shop: {
        with: { owner: true }
      }
    }
  });

  return directDoc || null;
}

/**
 * Action: Accept a quotation via client public portal.
 */
export async function acceptQuotationPortalAction(input: {
  token: string;
  clientName?: string;
  clientNotes?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const doc = await resolveDocByToken(input.token);
    if (!doc) {
      return { success: false, error: "Quotation record could not be resolved." };
    }

    if (doc.type !== "QUOTATION") {
      return { success: false, error: "Only quotations can be formally accepted." };
    }

    const partyName = input.clientName || doc.client?.name || "Client";
    const noteText = `[CLIENT PORTAL] Quotation was formally ACCEPTED by ${partyName}.${input.clientNotes ? ` Note: ${input.clientNotes}` : ""}`;

    await db.transaction(async (tx) => {
      await tx.update(documents)
        .set({
          clientPortalResponse: "ACCEPTED",
        })
        .where(eq(documents.id, doc.id));

      await tx.insert(documentNotes).values({
        documentId: doc.id,
        shopId: doc.shopId,
        userId: doc.shop.ownerId,
        note: noteText,
      });
    });

    // Notify Business Owner via Email
    try {
      const recipientEmail = doc.shop?.email || doc.shop?.owner?.email;
      if (recipientEmail && process.env.RESEND_API_KEY) {
        const rawFrom = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
        const emailMatch = rawFrom.match(/<([^>]+)>/);
        const emailOnly = emailMatch ? emailMatch[1] : (rawFrom.includes("@") ? rawFrom.trim() : "billing@corbantechnologies.org");
        const fromAddress = `${doc.shop?.name || "Manna Books"} <${emailOnly}>`;

        await resend.emails.send({
          from: fromAddress,
          to: [recipientEmail],
          subject: `🎉 Quotation Accepted: ${doc.docNumber} (${partyName})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
              <h2 style="color: #059669; margin-top: 0;">✓ Quotation Accepted by Client!</h2>
              <p style="font-size: 14px; color: #3f3f46;">
                Great news! <strong>${partyName}</strong> has officially accepted Quotation <strong>${doc.docNumber}</strong> for <strong>${doc.currency || doc.shop?.currency || "KES"} ${doc.grandTotal}</strong> via the public portal.
              </p>
              ${input.clientNotes ? `<div style="background: #f4f4f5; padding: 12px; border-radius: 6px; font-size: 13px; margin: 16px 0;"><strong>Client comments:</strong> ${input.clientNotes}</div>` : ""}
              <p style="font-size: 13px; color: #71717a;">
                You can now convert this quote into an Invoice directly inside your MannaBooks workspace.
              </p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("Could not dispatch acceptance email:", mailErr);
    }

    revalidatePath(`/portal/invoice/${input.token}`);
    if (doc.shop?.slug) {
      revalidatePath(`/workspaces/${doc.shop.slug}/documents/${doc.id}`);
    }

    return { success: true, message: "Quotation accepted! The merchant has been notified." };
  } catch (error: any) {
    console.error("Failed to accept quotation:", error);
    return { success: false, error: error.message || "Failed to process quotation acceptance." };
  }
}

/**
 * Action: Request amendment on quotation via client public portal.
 */
export async function requestQuotationAmendmentPortalAction(input: {
  token: string;
  clientName?: string;
  amendmentNotes: string;
  contactEmail?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    if (!input.amendmentNotes || input.amendmentNotes.trim() === "") {
      return { success: false, error: "Please describe the changes or amendments you require." };
    }

    const doc = await resolveDocByToken(input.token);
    if (!doc) {
      return { success: false, error: "Quotation record could not be resolved." };
    }

    const partyName = input.clientName || doc.client?.name || "Client";
    const noteText = `[CLIENT PORTAL] Amendment requested by ${partyName}: "${input.amendmentNotes.trim()}"${input.contactEmail ? ` (Contact: ${input.contactEmail})` : ""}`;

    await db.transaction(async (tx) => {
      await tx.update(documents)
        .set({
          clientPortalResponse: "AMENDMENT_REQUESTED",
          clientAmendmentNotes: input.amendmentNotes.trim(),
        })
        .where(eq(documents.id, doc.id));

      await tx.insert(documentNotes).values({
        documentId: doc.id,
        shopId: doc.shopId,
        userId: doc.shop.ownerId,
        note: noteText,
      });
    });

    // Notify Business Owner via Email
    try {
      const recipientEmail = doc.shop?.email || doc.shop?.owner?.email;
      if (recipientEmail && process.env.RESEND_API_KEY) {
        const rawFrom = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
        const emailMatch = rawFrom.match(/<([^>]+)>/);
        const emailOnly = emailMatch ? emailMatch[1] : (rawFrom.includes("@") ? rawFrom.trim() : "billing@corbantechnologies.org");
        const fromAddress = `${doc.shop?.name || "Manna Books"} <${emailOnly}>`;

        await resend.emails.send({
          from: fromAddress,
          to: [recipientEmail],
          subject: `📝 Quotation Amendment Requested: ${doc.docNumber} (${partyName})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
              <h2 style="color: #d97706; margin-top: 0;">Amendment Requested by Client</h2>
              <p style="font-size: 14px; color: #3f3f46;">
                <strong>${partyName}</strong> has requested modifications on Quotation <strong>${doc.docNumber}</strong>:
              </p>
              <div style="background: #fef3c7; border: 1px solid #fde68a; padding: 14px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 16px 0;">
                "${input.amendmentNotes.trim()}"
              </div>
              ${input.contactEmail ? `<p style="font-size: 13px; color: #71717a;">Client contact email: <strong>${input.contactEmail}</strong></p>` : ""}
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("Could not dispatch amendment notification email:", mailErr);
    }

    revalidatePath(`/portal/invoice/${input.token}`);
    if (doc.shop?.slug) {
      revalidatePath(`/workspaces/${doc.shop.slug}/documents/${doc.id}`);
    }

    return { success: true, message: "Your amendment request has been sent to the merchant." };
  } catch (error: any) {
    console.error("Failed to request amendment:", error);
    return { success: false, error: error.message || "Failed to submit amendment request." };
  }
}
