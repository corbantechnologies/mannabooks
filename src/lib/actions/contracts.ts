"use server";

import { db } from "@/db";
import {
    contracts, contractHoursLog, shops, clients, documents,
} from "@/db/schema";
import { eq, and, desc, lte, gte, sql, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";
import { createNotificationAction } from "./notifications";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
async function getNextContractNumber(shopId: string): Promise<string> {
    const year = new Date().getFullYear();
    const existing = await db.query.contracts.findMany({
        where: eq(contracts.shopId, shopId),
        columns: { contractNumber: true },
        orderBy: [desc(contracts.createdAt)],
        limit: 1,
    });
    if (existing.length === 0) return `CNT-${year}-001`;
    const last = existing[0].contractNumber;
    const match = last.match(/(\d+)$/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    return `CNT-${year}-${String(nextNum).padStart(3, "0")}`;
}

function addOneMonth(date: Date): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    return d;
}

// ──────────────────────────────────────────
// CREATE CONTRACT
// ──────────────────────────────────────────
export interface CreateContractInput {
    shopId: string;
    shopSlug: string;
    clientId?: string;
    dealId?: string;
    title: string;
    description?: string;
    currency?: string;
    monthlyFee?: number;
    isRetainerHours?: boolean;
    monthlyHoursAllocated?: number;
    hourlyRate?: number;
    autoInvoiceEnabled?: boolean;
    billingDayOfMonth?: number;
    startDate: string; // YYYY-MM-DD
    endDate?: string;
    termsAndConditions?: string;
}

export async function createContractAction(input: CreateContractInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const contractNumber = await getNextContractNumber(input.shopId);

        // Calculate first billing date
        const start = new Date(input.startDate);
        const billingDay = input.billingDayOfMonth || 1;
        const firstBilling = new Date(start.getFullYear(), start.getMonth() + 1, billingDay);

        const [contract] = await db.insert(contracts).values({
            shopId: input.shopId,
            clientId: input.clientId || null,
            dealId: input.dealId || null,
            contractNumber,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            currency: input.currency || "KES",
            status: "ACTIVE",
            monthlyFee: String(input.monthlyFee || 0),
            isRetainerHours: input.isRetainerHours || false,
            monthlyHoursAllocated: String(input.monthlyHoursAllocated || 0),
            hourlyRate: String(input.hourlyRate || 0),
            autoInvoiceEnabled: input.autoInvoiceEnabled || false,
            nextBillingDate: firstBilling.toISOString().split("T")[0],
            billingDayOfMonth: billingDay,
            startDate: input.startDate,
            endDate: input.endDate || null,
            termsAndConditions: input.termsAndConditions?.trim() || null,
        }).returning();

        revalidatePath(`/workspaces/${input.shopSlug}/crm/contracts`);
        return { success: true, contractId: contract.id, contractNumber };
    } catch (err: any) {
        console.error("createContractAction:", err);
        return { success: false, error: err.message || "Failed to create contract." };
    }
}

// ──────────────────────────────────────────
// UPDATE CONTRACT
// ──────────────────────────────────────────
export async function updateContractAction(input: {
    contractId: string;
    shopId: string;
    shopSlug: string;
    title?: string;
    description?: string;
    status?: "ACTIVE" | "PAUSED" | "EXPIRED" | "CANCELLED";
    monthlyFee?: number;
    isRetainerHours?: boolean;
    monthlyHoursAllocated?: number;
    hourlyRate?: number;
    autoInvoiceEnabled?: boolean;
    endDate?: string;
    termsAndConditions?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.update(contracts).set({
            ...(input.title && { title: input.title.trim() }),
            description: input.description?.trim() || undefined,
            ...(input.status && { status: input.status }),
            ...(input.monthlyFee !== undefined && { monthlyFee: String(input.monthlyFee) }),
            ...(input.isRetainerHours !== undefined && { isRetainerHours: input.isRetainerHours }),
            ...(input.monthlyHoursAllocated !== undefined && { monthlyHoursAllocated: String(input.monthlyHoursAllocated) }),
            ...(input.hourlyRate !== undefined && { hourlyRate: String(input.hourlyRate) }),
            ...(input.autoInvoiceEnabled !== undefined && { autoInvoiceEnabled: input.autoInvoiceEnabled }),
            endDate: input.endDate || undefined,
            termsAndConditions: input.termsAndConditions?.trim() || undefined,
            updatedAt: new Date(),
        }).where(and(eq(contracts.id, input.contractId), eq(contracts.shopId, input.shopId)));

        revalidatePath(`/workspaces/${input.shopSlug}/crm/contracts`);
        revalidatePath(`/workspaces/${input.shopSlug}/crm/contracts/${input.contractId}`);
        return { success: true };
    } catch (err: any) {
        console.error("updateContractAction:", err);
        return { success: false, error: err.message || "Failed to update contract." };
    }
}

// ──────────────────────────────────────────
// LOG HOURS AGAINST RETAINER (burn-down)
// ──────────────────────────────────────────
export async function logContractHoursAction(input: {
    contractId: string;
    shopId: string;
    shopSlug: string;
    hoursUsed: number;
    description: string;
    logDate: string; // YYYY-MM-DD
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const billingMonth = input.logDate.substring(0, 7); // "YYYY-MM"
        await db.insert(contractHoursLog).values({
            contractId: input.contractId,
            shopId: input.shopId,
            loggedByUserId: session.userId,
            billingMonth,
            hoursUsed: String(input.hoursUsed),
            description: input.description.trim(),
            logDate: input.logDate,
        });

        revalidatePath(`/workspaces/${input.shopSlug}/crm/contracts/${input.contractId}`);
        return { success: true };
    } catch (err: any) {
        console.error("logContractHoursAction:", err);
        return { success: false, error: err.message || "Failed to log hours." };
    }
}

// ──────────────────────────────────────────
// GET BURN-DOWN SUMMARY FOR A CONTRACT
// ──────────────────────────────────────────
export async function getContractBurndownAction(contractId: string, shopId: string, billingMonth?: string) {
    try {
        const contract = await db.query.contracts.findFirst({
            where: and(eq(contracts.id, contractId), eq(contracts.shopId, shopId)),
            with: { client: true },
        });
        if (!contract) return { success: false, error: "Contract not found.", data: null };

        const month = billingMonth || new Date().toISOString().substring(0, 7);

        const logs = await db.query.contractHoursLog.findMany({
            where: and(
                eq(contractHoursLog.contractId, contractId),
                eq(contractHoursLog.billingMonth, month)
            ),
            orderBy: [desc(contractHoursLog.createdAt)],
            with: { loggedBy: true },
        });

        const usedThisMonth = logs.reduce((s, l) => s + parseFloat(l.hoursUsed), 0);
        const allocated = parseFloat(String(contract.monthlyHoursAllocated));
        const remaining = Math.max(0, allocated - usedThisMonth);
        const overrun = Math.max(0, usedThisMonth - allocated);
        const pctUsed = allocated > 0 ? Math.min(100, (usedThisMonth / allocated) * 100) : 0;

        return {
            success: true,
            data: {
                contract,
                billingMonth: month,
                logs,
                allocated,
                usedThisMonth,
                remaining,
                overrun,
                pctUsed: Math.round(pctUsed),
            },
        };
    } catch (err: any) {
        console.error("getContractBurndownAction:", err);
        return { success: false, error: err.message, data: null };
    }
}

// ──────────────────────────────────────────
// GET CONTRACTS BY SHOP
// ──────────────────────────────────────────
export async function getContractsByShopAction(shopId: string) {
    try {
        const data = await db.query.contracts.findMany({
            where: eq(contracts.shopId, shopId),
            orderBy: [desc(contracts.createdAt)],
            with: { client: true, deal: true },
        });
        return { success: true, contracts: data };
    } catch (err: any) {
        return { success: false, error: err.message, contracts: [] };
    }
}

// ──────────────────────────────────────────
// GET SINGLE CONTRACT
// ──────────────────────────────────────────
export async function getContractByIdAction(contractId: string, shopId: string) {
    try {
        const contract = await db.query.contracts.findFirst({
            where: and(eq(contracts.id, contractId), eq(contracts.shopId, shopId)),
            with: {
                client: true,
                deal: true,
                hoursLog: {
                    orderBy: [desc(contractHoursLog.logDate)],
                    with: { loggedBy: true },
                },
                projects: true,
            },
        });
        if (!contract) return { success: false, error: "Contract not found.", contract: null };
        return { success: true, contract };
    } catch (err: any) {
        return { success: false, error: err.message, contract: null };
    }
}

// ──────────────────────────────────────────
// AUTO-INVOICE: Called by cron for contracts with autoInvoiceEnabled
// Returns created document IDs for logging
// ──────────────────────────────────────────
export async function processAutoContractInvoicesAction(): Promise<{
    processed: number;
    errors: string[];
}> {
    const today = new Date().toISOString().split("T")[0];
    const errors: string[] = [];
    let processed = 0;

    try {
        const dueContracts = await db.query.contracts.findMany({
            where: and(
                eq(contracts.status, "ACTIVE"),
                eq(contracts.autoInvoiceEnabled, true),
                lte(contracts.nextBillingDate, today)
            ),
            with: { shop: true, client: true },
        });

        for (const contract of dueContracts) {
            try {
                // Generate invoice via existing document system
                const { createBillingDocument } = await import("./documents");
                const fee = parseFloat(String(contract.monthlyFee));
                const billingMonth = contract.nextBillingDate?.substring(0, 7) || today.substring(0, 7);
                const [year, mo] = (billingMonth).split("-");
                const monthName = new Date(parseInt(year), parseInt(mo) - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

                const result = await createBillingDocument({
                    shopId: contract.shopId,
                    shopSlug: contract.shop?.slug || "",
                    clientId: contract.clientId || undefined,
                    type: "INVOICE",
                    notes: `Auto-generated monthly retainer invoice for ${monthName} under Contract ${contract.contractNumber}.`,
                    termsAndConditions: contract.termsAndConditions || undefined,
                    currency: contract.currency,
                    items: [{
                        description: `Retainer / SLA Fee — ${monthName} (${contract.title})`,
                        quantity: 1,
                        unitPrice: fee,
                        taxType: "EXEMPT" as const,
                    }],
                });

                if (result.success) {
                    // Advance nextBillingDate by one month
                    const nextDate = addOneMonth(new Date(contract.nextBillingDate!));
                    const nextDay = contract.billingDayOfMonth;
                    nextDate.setDate(nextDay);

                    await db.update(contracts).set({
                        nextBillingDate: nextDate.toISOString().split("T")[0],
                        updatedAt: new Date(),
                    }).where(eq(contracts.id, contract.id));

                    // Notify owner
                    if (contract.shop?.ownerId) {
                        await createNotificationAction({
                            userId: contract.shop.ownerId,
                            shopId: contract.shopId,
                            title: `🧾 Auto-Invoice: ${contract.contractNumber}`,
                            message: `Monthly retainer invoice for ${monthName} (${contract.currency} ${fee.toLocaleString()}) was created for ${contract.client?.name || "client"}.`,
                            type: "PAYMENT_RECEIVED",
                            link: contract.shop?.slug ? `/workspaces/${contract.shop.slug}/documents/${result.documentId}` : null,
                        });
                    }
                    processed++;
                } else {
                    errors.push(`Contract ${contract.contractNumber}: ${result.error}`);
                }
            } catch (err: any) {
                errors.push(`Contract ${contract.contractNumber}: ${err.message}`);
            }
        }
    } catch (err: any) {
        errors.push(`Fatal: ${err.message}`);
    }

    return { processed, errors };
}

// ──────────────────────────────────────────
// SEND EXPIRY ALERTS (30 / 60 days out)
// ──────────────────────────────────────────
export async function sendContractExpiryAlertsAction(): Promise<{ sent: number }> {
    const today = new Date();
    let sent = 0;

    const addDays = (d: Date, n: number) => {
        const r = new Date(d);
        r.setDate(r.getDate() + n);
        return r;
    };

    try {
        const activeContracts = await db.query.contracts.findMany({
            where: and(eq(contracts.status, "ACTIVE")),
            with: { shop: { with: { owner: true } }, client: true },
        });

        for (const contract of activeContracts) {
            if (!contract.endDate) continue;
            const end = new Date(contract.endDate);
            const daysLeft = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // 60-day alert
            if (daysLeft <= 60 && daysLeft > 30 && !contract.alert60DaySentAt) {
                await _sendExpiryAlert(contract, 60, daysLeft);
                await db.update(contracts).set({ alert60DaySentAt: new Date() }).where(eq(contracts.id, contract.id));
                sent++;
            }

            // 30-day alert
            if (daysLeft <= 30 && daysLeft > 0 && !contract.alert30DaySentAt) {
                await _sendExpiryAlert(contract, 30, daysLeft);
                await db.update(contracts).set({ alert30DaySentAt: new Date() }).where(eq(contracts.id, contract.id));
                sent++;
            }

            // Auto-expire
            if (daysLeft <= 0 && contract.status === "ACTIVE") {
                await db.update(contracts).set({ status: "EXPIRED", updatedAt: new Date() }).where(eq(contracts.id, contract.id));
            }
        }
    } catch (err) {
        console.error("sendContractExpiryAlertsAction:", err);
    }

    return { sent };
}

async function _sendExpiryAlert(contract: any, threshold: number, daysLeft: number) {
    try {
        if (contract.shop?.ownerId) {
            await createNotificationAction({
                userId: contract.shop.ownerId,
                shopId: contract.shopId,
                title: `⚠️ Contract Expiring in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}`,
                message: `Contract "${contract.title}" (${contract.contractNumber}) with ${contract.client?.name || "client"} expires on ${contract.endDate}.`,
                type: "SYSTEM",
                link: contract.shop?.slug ? `/workspaces/${contract.shop.slug}/crm/contracts/${contract.id}` : null,
            });
        }

        const recipientEmail = contract.shop?.email || contract.shop?.owner?.email;
        if (recipientEmail && process.env.RESEND_API_KEY) {
            const rawFrom = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
            const emailMatch = rawFrom.match(/<([^>]+)>/);
            const emailOnly = emailMatch ? emailMatch[1] : "billing@corbantechnologies.org";
            await resend.emails.send({
                from: `${contract.shop.name || "Manna Books"} <${emailOnly}>`,
                to: [recipientEmail],
                subject: `⚠️ Contract Expiring Soon: ${contract.contractNumber} (${daysLeft} days left)`,
                html: `
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;border:1px solid #e4e4e7;border-radius:12px;">
                        <h2 style="color:#d97706;margin-top:0;">Contract Expiring in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}</h2>
                        <p style="color:#52525b;font-size:14px;">Contract <strong>${contract.contractNumber}</strong> — <em>${contract.title}</em> with client <strong>${contract.client?.name || "N/A"}</strong> is scheduled to expire on <strong>${contract.endDate}</strong>.</p>
                        <p style="color:#52525b;font-size:14px;">Please review and renew or conclude this contract in your Manna Books workspace.</p>
                    </div>
                `,
            });
        }
    } catch (err) {
        console.warn(`Expiry alert for ${contract.contractNumber} failed:`, err);
    }
}
