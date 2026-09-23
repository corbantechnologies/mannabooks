"use server";

import { db } from "@/db";
import {
    proposals, proposalItems, proposalTokens, deals, clients, shops,
    documents, documentItems, documentTokens,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";
import { createNotificationAction } from "./notifications";
import { Resend } from "resend";
import { createDealAction, addDealActivityAction } from "./crm";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
function generateProposalToken(): string {
    return crypto.randomBytes(32).toString("hex"); // 64-char hex
}

async function getProposalByToken(token: string) {
    const tokenRec = await db.query.proposalTokens.findFirst({
        where: eq(proposalTokens.token, token),
        with: {
            proposal: {
                with: {
                    shop: { with: { owner: true } },
                    client: true,
                    deal: true,
                    items: { orderBy: [proposalItems.displayOrder] },
                },
            },
        },
    });
    return tokenRec?.proposal || null;
}

async function getNextProposalNumber(shopId: string): Promise<string> {
    const year = new Date().getFullYear();
    const existing = await db.query.proposals.findMany({
        where: eq(proposals.shopId, shopId),
        columns: { proposalNumber: true },
        orderBy: [desc(proposals.createdAt)],
        limit: 1,
    });
    if (existing.length === 0) return `PRP-${year}-001`;
    const last = existing[0].proposalNumber;
    const match = last.match(/(\d+)$/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    return `PRP-${year}-${String(nextNum).padStart(3, "0")}`;
}

// ──────────────────────────────────────────
// CREATE PROPOSAL
// ──────────────────────────────────────────
export interface ProposalItemInput {
    packageLabel?: string;
    description: string;
    notes?: string;
    quantity: number;
    unitPrice: number;
    displayOrder?: number;
}

export interface CreateProposalInput {
    shopId: string;
    shopSlug: string;
    dealId?: string;
    clientId?: string;
    title: string;
    executiveSummary?: string;
    scopeOfWork?: string;
    termsAndConditions?: string;
    validityDays?: number;
    currency?: string;
    items: ProposalItemInput[];
}

export async function createProposalAction(input: CreateProposalInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const proposalNumber = await getNextProposalNumber(input.shopId);
        const subtotal = input.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
        const token = generateProposalToken();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (input.validityDays || 30));

        const [proposal] = await db.transaction(async (tx) => {
            const [p] = await tx.insert(proposals).values({
                shopId: input.shopId,
                dealId: input.dealId || null,
                clientId: input.clientId || null,
                proposalNumber,
                title: input.title.trim(),
                executiveSummary: input.executiveSummary?.trim() || null,
                scopeOfWork: input.scopeOfWork?.trim() || null,
                termsAndConditions: input.termsAndConditions?.trim() || null,
                validityDays: input.validityDays || 30,
                currency: input.currency || "KES",
                subtotal: String(subtotal),
                status: "DRAFT",
                expiresAt,
            }).returning();

            // Insert items
            if (input.items.length > 0) {
                await tx.insert(proposalItems).values(
                    input.items.map((it, idx) => ({
                        proposalId: p.id,
                        packageLabel: it.packageLabel || null,
                        description: it.description,
                        notes: it.notes || null,
                        quantity: String(it.quantity),
                        unitPrice: String(it.unitPrice),
                        itemTotal: String(it.quantity * it.unitPrice),
                        displayOrder: it.displayOrder ?? idx,
                    }))
                );
            }

            // Mint secure token
            await tx.insert(proposalTokens).values({ proposalId: p.id, token });

            return [p];
        });

        // If linked to a deal, advance stage to PROPOSAL_SENT
        if (input.dealId) {
            await addDealActivityAction({
                dealId: input.dealId,
                shopId: input.shopId,
                shopSlug: input.shopSlug,
                activityType: "PROPOSAL_SENT",
                title: `Proposal created: ${proposalNumber}`,
                body: `Interactive proposal "${input.title}" drafted and ready to send.`,
            });
        }

        revalidatePath(`/workspaces/${input.shopSlug}/crm/proposals`);
        return { success: true, proposalId: proposal.id, proposalNumber, token };
    } catch (err: any) {
        console.error("createProposalAction:", err);
        return { success: false, error: err.message || "Failed to create proposal." };
    }
}

// ──────────────────────────────────────────
// SEND PROPOSAL (mint token + dispatch email)
// ──────────────────────────────────────────
export async function sendProposalAction(proposalId: string, shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const proposal = await db.query.proposals.findFirst({
            where: and(eq(proposals.id, proposalId), eq(proposals.shopId, shopId)),
            with: {
                shop: { with: { owner: true } },
                client: true,
                deal: true,
                token: true,
            },
        });
        if (!proposal) return { success: false, error: "Proposal not found." };

        const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.mannabooks.co.ke"}/portal/proposal/${proposal.token?.token}`;

        await db.update(proposals).set({
            status: "SENT",
            sentAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(proposals.id, proposalId));

        // Advance linked deal to PROPOSAL_SENT stage
        if (proposal.dealId) {
            await addDealActivityAction({
                dealId: proposal.dealId,
                shopId,
                shopSlug,
                activityType: "PROPOSAL_SENT",
                title: `Proposal ${proposal.proposalNumber} dispatched`,
                body: `Portal link sent to client. URL: ${portalUrl}`,
            });
        }

        // Email client if available
        const recipientEmail = proposal.client?.email || proposal.deal?.contactEmail;
        const recipientName = proposal.client?.name || proposal.deal?.contactName || "Valued Client";
        const shopName = proposal.shop?.name || "Manna Books";

        if (recipientEmail && process.env.RESEND_API_KEY) {
            try {
                const rawFrom = process.env.RESEND_FROM_EMAIL || `Manna Books <billing@corbantechnologies.org>`;
                const emailMatch = rawFrom.match(/<([^>]+)>/);
                const emailOnly = emailMatch ? emailMatch[1] : (rawFrom.includes("@") ? rawFrom.trim() : "billing@corbantechnologies.org");
                const fromAddress = `${shopName} <${emailOnly}>`;

                await resend.emails.send({
                    from: fromAddress,
                    to: [recipientEmail],
                    subject: `📋 Proposal from ${shopName}: ${proposal.title}`,
                    html: `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;border:1px solid #e4e4e7;border-radius:12px;">
                            <h2 style="color:#1e1e2e;margin-top:0;">New Proposal: ${proposal.title}</h2>
                            <p style="color:#52525b;font-size:14px;">Dear ${recipientName},</p>
                            <p style="color:#52525b;font-size:14px;">${shopName} has prepared a detailed proposal for your review. Please click the button below to open your interactive proposal, review the scope, pricing, and terms, and formally accept or request changes.</p>
                            <div style="text-align:center;margin:32px 0;">
                                <a href="${portalUrl}" style="background:#059669;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                                    📋 View & Respond to Proposal
                                </a>
                            </div>
                            <p style="color:#71717a;font-size:12px;">This proposal is valid for ${proposal.validityDays} days. If you have questions, please contact us directly.</p>
                            <hr style="border:none;border-top:1px solid #f4f4f5;margin:24px 0;">
                            <p style="color:#a1a1aa;font-size:11px;">Powered by Manna Books · Corban Technologies</p>
                        </div>
                    `,
                });
            } catch (mailErr) {
                console.warn("Proposal email dispatch failed:", mailErr);
            }
        }

        revalidatePath(`/workspaces/${shopSlug}/crm/proposals`);
        revalidatePath(`/workspaces/${shopSlug}/crm/proposals/${proposalId}`);
        return { success: true, portalUrl };
    } catch (err: any) {
        console.error("sendProposalAction:", err);
        return { success: false, error: err.message || "Failed to send proposal." };
    }
}

// ──────────────────────────────────────────
// PORTAL: Mark as VIEWED (telemetry bump)
// ──────────────────────────────────────────
export async function markProposalViewedAction(token: string) {
    try {
        const tokenRec = await db.query.proposalTokens.findFirst({
            where: eq(proposalTokens.token, token),
        });
        if (!tokenRec) return;

        await db.update(proposals).set({
            status: "VIEWED",
            viewedAt: new Date(),
            viewCount: sql`view_count + 1`,
        }).where(
            and(
                eq(proposals.id, tokenRec.proposalId),
                // Only bump if currently SENT or VIEWED (not terminal statuses)
                sql`status IN ('SENT', 'VIEWED')`
            )
        );
    } catch (err) {
        console.warn("markProposalViewedAction failed:", err);
    }
}

// ──────────────────────────────────────────
// PORTAL: Client ACCEPTS proposal (with optional e-signature)
// ──────────────────────────────────────────
export async function acceptProposalPortalAction(input: {
    token: string;
    signerName: string;
    signatureDataUrl?: string; // Base64 PNG from canvas
}) {
    try {
        if (!input.signerName?.trim()) {
            return { success: false, error: "Please provide your name to sign." };
        }

        const proposal = await getProposalByToken(input.token);
        if (!proposal) return { success: false, error: "Proposal not found." };
        if (["ACCEPTED", "DECLINED"].includes(proposal.status)) {
            return { success: false, error: "This proposal has already been responded to." };
        }

        await db.update(proposals).set({
            status: "ACCEPTED",
            respondedAt: new Date(),
            signerName: input.signerName.trim(),
            signatureDataUrl: input.signatureDataUrl || null,
            updatedAt: new Date(),
        }).where(eq(proposals.id, proposal.id));

        // Advance deal to NEGOTIATION (owner can promote to WON manually)
        if (proposal.dealId) {
            await addDealActivityAction({
                dealId: proposal.dealId,
                shopId: proposal.shopId,
                shopSlug: proposal.shop?.slug || "",
                activityType: "PROPOSAL_ACCEPTED",
                title: `Proposal ${proposal.proposalNumber} ACCEPTED`,
                body: `Signed by: ${input.signerName.trim()}.`,
            });
        }

        // Notify owner
        if (proposal.shop?.ownerId) {
            await createNotificationAction({
                userId: proposal.shop.ownerId,
                shopId: proposal.shopId,
                title: `🎉 Proposal Accepted: ${proposal.proposalNumber}`,
                message: `${input.signerName.trim()} formally accepted "${proposal.title}" (${proposal.currency} ${proposal.subtotal}).`,
                type: "QUOTE_ACCEPTED",
                link: proposal.shop?.slug ? `/workspaces/${proposal.shop.slug}/crm/proposals/${proposal.id}` : null,
            });
        }

        // Email owner (shop.email is the business contact; fallback to ownerId lookup is skipped for brevity)
        if (proposal.shop?.email) {
            try {
                const rawFrom = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
                const emailMatch = rawFrom.match(/<([^>]+)>/);
                const emailOnly = emailMatch ? emailMatch[1] : "billing@corbantechnologies.org";
                const fromAddress = `${proposal.shop.name || "Manna Books"} <${emailOnly}>`;

                await resend.emails.send({
                    from: fromAddress,
                    to: [proposal.shop.email],
                    subject: `✅ Proposal Accepted: ${proposal.proposalNumber} — ${input.signerName}`,
                    html: `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;border:1px solid #e4e4e7;border-radius:12px;">
                            <h2 style="color:#059669;margin-top:0;">✅ Proposal Accepted!</h2>
                            <p style="color:#52525b;font-size:14px;"><strong>${input.signerName}</strong> has formally accepted Proposal <strong>${proposal.proposalNumber}</strong> — <em>${proposal.title}</em>.</p>
                            <p style="color:#52525b;font-size:14px;">Proposal value: <strong>${proposal.currency} ${parseFloat(proposal.subtotal).toLocaleString()}</strong></p>
                            <p style="color:#71717a;font-size:13px;">You can now convert this proposal into a Quotation or Invoice from your CRM dashboard.</p>
                        </div>
                    `,
                });
            } catch { /* non-fatal */ }
        }

        return { success: true, message: "Proposal accepted! The merchant has been notified." };
    } catch (err: any) {
        console.error("acceptProposalPortalAction:", err);
        return { success: false, error: err.message || "Failed to accept proposal." };
    }
}

// ──────────────────────────────────────────
// PORTAL: Client requests AMENDMENT
// ──────────────────────────────────────────
export async function requestProposalAmendmentAction(input: {
    token: string;
    clientName: string;
    amendmentNotes: string;
    contactEmail?: string;
}) {
    try {
        if (!input.amendmentNotes?.trim()) {
            return { success: false, error: "Please describe the changes you require." };
        }

        const proposal = await getProposalByToken(input.token);
        if (!proposal) return { success: false, error: "Proposal not found." };

        await db.update(proposals).set({
            status: "AMENDMENT_REQUESTED",
            respondedAt: new Date(),
            amendmentNotes: input.amendmentNotes.trim(),
            updatedAt: new Date(),
        }).where(eq(proposals.id, proposal.id));

        if (proposal.dealId) {
            await addDealActivityAction({
                dealId: proposal.dealId,
                shopId: proposal.shopId,
                shopSlug: proposal.shop?.slug || "",
                activityType: "NOTE",
                title: `Amendment requested on ${proposal.proposalNumber}`,
                body: `"${input.amendmentNotes.trim()}"${input.contactEmail ? ` — Contact: ${input.contactEmail}` : ""}`,
            });
        }

        if (proposal.shop?.ownerId) {
            await createNotificationAction({
                userId: proposal.shop.ownerId,
                shopId: proposal.shopId,
                title: `📝 Amendment Requested: ${proposal.proposalNumber}`,
                message: `${input.clientName}: "${input.amendmentNotes.trim()}"`,
                type: "SYSTEM",
                link: proposal.shop?.slug ? `/workspaces/${proposal.shop.slug}/crm/proposals/${proposal.id}` : null,
            });
        }

        return { success: true, message: "Your amendment request has been sent to the merchant." };
    } catch (err: any) {
        console.error("requestProposalAmendmentAction:", err);
        return { success: false, error: err.message || "Failed to submit amendment request." };
    }
}

// ──────────────────────────────────────────
// PORTAL: Client DECLINES proposal
// ──────────────────────────────────────────
export async function declineProposalPortalAction(input: {
    token: string;
    clientName?: string;
    reason?: string;
}) {
    try {
        const proposal = await getProposalByToken(input.token);
        if (!proposal) return { success: false, error: "Proposal not found." };

        await db.update(proposals).set({
            status: "DECLINED",
            respondedAt: new Date(),
            amendmentNotes: input.reason || null,
            updatedAt: new Date(),
        }).where(eq(proposals.id, proposal.id));

        if (proposal.dealId && input.reason) {
            await addDealActivityAction({
                dealId: proposal.dealId,
                shopId: proposal.shopId,
                shopSlug: proposal.shop?.slug || "",
                activityType: "LOST",
                title: `Proposal ${proposal.proposalNumber} declined`,
                body: input.reason,
            });
        }

        if (proposal.shop?.ownerId) {
            await createNotificationAction({
                userId: proposal.shop.ownerId,
                shopId: proposal.shopId,
                title: `❌ Proposal Declined: ${proposal.proposalNumber}`,
                message: input.reason || "Client declined the proposal.",
                type: "SYSTEM",
            });
        }

        return { success: true, message: "Proposal declined." };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to decline proposal." };
    }
}

// ──────────────────────────────────────────
// CONVERT PROPOSAL → QUOTATION (or INVOICE)
// ──────────────────────────────────────────
export async function convertProposalToDocumentAction(input: {
    proposalId: string;
    shopId: string;
    shopSlug: string;
    targetType: "QUOTATION" | "INVOICE";
    clientId?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const proposal = await db.query.proposals.findFirst({
            where: and(eq(proposals.id, input.proposalId), eq(proposals.shopId, input.shopId)),
            with: { items: true, deal: true, shop: true },
        });
        if (!proposal) return { success: false, error: "Proposal not found." };

        // Dynamically import to avoid circular deps
        const { createBillingDocument } = await import("./documents");

        const result = await createBillingDocument({
            shopId: input.shopId,
            shopSlug: input.shopSlug,
            clientId: input.clientId || proposal.clientId || undefined,
            type: input.targetType,
            notes: `Converted from Proposal ${proposal.proposalNumber}: ${proposal.title}`,
            termsAndConditions: proposal.termsAndConditions || undefined,
            currency: proposal.currency,
            items: proposal.items.map((it) => ({
                description: it.packageLabel ? `[${it.packageLabel}] ${it.description}` : it.description,
                notes: it.notes || undefined,
                quantity: parseFloat(String(it.quantity)),
                unitPrice: parseFloat(String(it.unitPrice)),
                taxType: "EXEMPT" as const, // Proposals don't include tax; operator adjusts after conversion
            })),
        });

        if (!result.success) {
            return { success: false, error: result.error || "Document creation failed." };
        }
        if (!result.documentId) {
            return { success: false, error: "Document creation failed." };
        }

        // Link converted document back to proposal
        await db.update(proposals).set({
            convertedDocumentId: result.documentId,
            updatedAt: new Date(),
        }).where(eq(proposals.id, input.proposalId));

        // Mark deal as WON automatically on conversion
        if (proposal.dealId) {
            const { updateDealStageAction } = await import("./crm");
            await updateDealStageAction(proposal.dealId, input.shopId, input.shopSlug, "WON");
        }

        revalidatePath(`/workspaces/${input.shopSlug}/crm/proposals/${input.proposalId}`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        return { success: true, documentId: result.documentId };
    } catch (err: any) {
        console.error("convertProposalToDocumentAction:", err);
        return { success: false, error: err.message || "Conversion failed." };
    }
}

// ──────────────────────────────────────────
// GET PROPOSALS LIST
// ──────────────────────────────────────────
export async function getProposalsByShopAction(shopId: string) {
    try {
        const data = await db.query.proposals.findMany({
            where: eq(proposals.shopId, shopId),
            orderBy: [desc(proposals.createdAt)],
            with: { client: true, deal: true, token: true },
        });
        return { success: true, proposals: data };
    } catch (err: any) {
        return { success: false, error: err.message, proposals: [] };
    }
}

// ──────────────────────────────────────────
// GET SINGLE PROPOSAL (operator view)
// ──────────────────────────────────────────
export async function getProposalByIdAction(proposalId: string, shopId: string) {
    try {
        const proposal = await db.query.proposals.findFirst({
            where: and(eq(proposals.id, proposalId), eq(proposals.shopId, shopId)),
            with: {
                client: true,
                deal: true,
                items: { orderBy: [proposalItems.displayOrder] },
                token: true,
                convertedDocument: { columns: { id: true, docNumber: true, type: true, status: true } },
            },
        });
        if (!proposal) return { success: false, error: "Proposal not found.", proposal: null };
        return { success: true, proposal };
    } catch (err: any) {
        return { success: false, error: err.message, proposal: null };
    }
}

// ──────────────────────────────────────────
// GET PROPOSAL BY TOKEN (public portal)
// ──────────────────────────────────────────
export async function getProposalByTokenAction(token: string) {
    try {
        const proposal = await getProposalByToken(token);
        if (!proposal) return { success: false, error: "Proposal not found.", proposal: null };
        return { success: true, proposal };
    } catch (err: any) {
        return { success: false, error: err.message, proposal: null };
    }
}
