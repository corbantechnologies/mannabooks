"use server";

import { db } from "@/db";
import {
    deals, dealActivities, clients, shops, users,
    dealStageEnum,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";
import { createNotificationAction } from "./notifications";

// ──────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────
export type DealStage = "LEAD" | "QUALIFIED" | "PROPOSAL_SENT" | "NEGOTIATION" | "WON" | "LOST";
export type DealActivityType = "NOTE" | "CALL" | "EMAIL" | "MEETING" | "STAGE_CHANGE" | "PROPOSAL_SENT" | "PROPOSAL_ACCEPTED" | "WON" | "LOST";

export interface CreateDealInput {
    shopId: string;
    shopSlug: string;
    title: string;
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    clientId?: string;
    estimatedValue?: number;
    winProbability?: number;
    expectedCloseDate?: Date;
    currency?: string;
    notes?: string;
}

export interface UpdateDealInput {
    dealId: string;
    shopId: string;
    shopSlug: string;
    title?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    clientId?: string;
    estimatedValue?: number;
    winProbability?: number;
    expectedCloseDate?: Date;
    currency?: string;
    notes?: string;
    lossReason?: string;
}

// ──────────────────────────────────────────
// CREATE DEAL
// ──────────────────────────────────────────
export async function createDealAction(input: CreateDealInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const [deal] = await db.insert(deals).values({
            shopId: input.shopId,
            clientId: input.clientId || null,
            assignedUserId: session.userId,
            title: input.title.trim(),
            contactName: input.contactName.trim(),
            contactEmail: input.contactEmail?.trim() || null,
            contactPhone: input.contactPhone?.trim() || null,
            stage: "LEAD",
            currency: input.currency || "KES",
            estimatedValue: String(input.estimatedValue || 0),
            winProbability: input.winProbability ?? 50,
            expectedCloseDate: input.expectedCloseDate || null,
            notes: input.notes?.trim() || null,
        }).returning();

        // Log creation activity
        await db.insert(dealActivities).values({
            dealId: deal.id,
            shopId: input.shopId,
            userId: session.userId,
            activityType: "NOTE",
            title: "Deal created",
            body: `Deal "${deal.title}" was created and entered the pipeline at Lead stage.`,
        });

        revalidatePath(`/workspaces/${input.shopSlug}/crm`);
        return { success: true, dealId: deal.id, deal };
    } catch (err: any) {
        console.error("createDealAction:", err);
        return { success: false, error: err.message || "Failed to create deal." };
    }
}

// ──────────────────────────────────────────
// UPDATE DEAL STAGE (Kanban drag-and-drop)
// ──────────────────────────────────────────
export async function updateDealStageAction(
    dealId: string,
    shopId: string,
    shopSlug: string,
    newStage: DealStage,
    lossReason?: string
) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const deal = await db.query.deals.findFirst({
            where: and(eq(deals.id, dealId), eq(deals.shopId, shopId)),
            with: { shop: { with: { owner: true } } },
        });
        if (!deal) return { success: false, error: "Deal not found." };

        const prevStage = deal.stage;
        await db.update(deals)
            .set({
                stage: newStage,
                lossReason: newStage === "LOST" ? (lossReason || null) : null,
                updatedAt: new Date(),
            })
            .where(and(eq(deals.id, dealId), eq(deals.shopId, shopId)));

        // Record the stage change
        const actType: DealActivityType = newStage === "WON" ? "WON" : newStage === "LOST" ? "LOST" : "STAGE_CHANGE";
        await db.insert(dealActivities).values({
            dealId,
            shopId,
            userId: session.userId,
            activityType: actType,
            title: `Stage moved: ${prevStage} → ${newStage}`,
            body: lossReason ? `Loss reason: ${lossReason}` : null,
        });

        // Notify owner on WON
        if (newStage === "WON") {
            try {
                await createNotificationAction({
                    userId: deal.shop.ownerId,
                    shopId,
                    title: `🏆 Deal WON: ${deal.title}`,
                    message: `"${deal.title}" has been marked as Won. Estimated value: ${deal.currency} ${deal.estimatedValue}.`,
                    type: "SYSTEM",
                    link: `/workspaces/${shopSlug}/crm/deals/${dealId}`,
                });
            } catch { /* non-fatal */ }
        }

        revalidatePath(`/workspaces/${shopSlug}/crm`);
        revalidatePath(`/workspaces/${shopSlug}/crm/deals/${dealId}`);
        return { success: true };
    } catch (err: any) {
        console.error("updateDealStageAction:", err);
        return { success: false, error: err.message || "Failed to update deal stage." };
    }
}

// ──────────────────────────────────────────
// UPDATE DEAL DETAILS
// ──────────────────────────────────────────
export async function updateDealAction(input: UpdateDealInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.update(deals)
            .set({
                ...(input.title && { title: input.title.trim() }),
                ...(input.contactName && { contactName: input.contactName.trim() }),
                contactEmail: input.contactEmail?.trim() || undefined,
                contactPhone: input.contactPhone?.trim() || undefined,
                clientId: input.clientId || undefined,
                ...(input.estimatedValue !== undefined && { estimatedValue: String(input.estimatedValue) }),
                ...(input.winProbability !== undefined && { winProbability: input.winProbability }),
                expectedCloseDate: input.expectedCloseDate || undefined,
                currency: input.currency || undefined,
                notes: input.notes?.trim() || undefined,
                updatedAt: new Date(),
            })
            .where(and(eq(deals.id, input.dealId), eq(deals.shopId, input.shopId)));

        revalidatePath(`/workspaces/${input.shopSlug}/crm`);
        revalidatePath(`/workspaces/${input.shopSlug}/crm/deals/${input.dealId}`);
        return { success: true };
    } catch (err: any) {
        console.error("updateDealAction:", err);
        return { success: false, error: err.message || "Failed to update deal." };
    }
}

// ──────────────────────────────────────────
// DELETE DEAL
// ──────────────────────────────────────────
export async function deleteDealAction(dealId: string, shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.delete(deals).where(and(eq(deals.id, dealId), eq(deals.shopId, shopId)));
        revalidatePath(`/workspaces/${shopSlug}/crm`);
        return { success: true };
    } catch (err: any) {
        console.error("deleteDealAction:", err);
        return { success: false, error: err.message || "Failed to delete deal." };
    }
}

// ──────────────────────────────────────────
// ADD DEAL ACTIVITY (timeline log)
// ──────────────────────────────────────────
export async function addDealActivityAction(input: {
    dealId: string;
    shopId: string;
    shopSlug: string;
    activityType: DealActivityType;
    title: string;
    body?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const [activity] = await db.insert(dealActivities).values({
            dealId: input.dealId,
            shopId: input.shopId,
            userId: session.userId,
            activityType: input.activityType,
            title: input.title.trim(),
            body: input.body?.trim() || null,
        }).returning();

        // Also bump deal updatedAt
        await db.update(deals)
            .set({ updatedAt: new Date() })
            .where(eq(deals.id, input.dealId));

        revalidatePath(`/workspaces/${input.shopSlug}/crm/deals/${input.dealId}`);
        return { success: true, activity };
    } catch (err: any) {
        console.error("addDealActivityAction:", err);
        return { success: false, error: err.message || "Failed to log activity." };
    }
}

// ──────────────────────────────────────────
// GET DEALS BY SHOP (for Kanban board)
// ──────────────────────────────────────────
export async function getDealsByShopAction(shopId: string) {
    try {
        const allDeals = await db.query.deals.findMany({
            where: eq(deals.shopId, shopId),
            orderBy: [desc(deals.updatedAt)],
            with: {
                client: true,
                assignedUser: true,
                proposals: {
                    columns: { id: true, status: true, proposalNumber: true },
                    orderBy: [desc(deals.createdAt)],
                },
            },
        });
        return { success: true, deals: allDeals };
    } catch (err: any) {
        console.error("getDealsByShopAction:", err);
        return { success: false, error: err.message, deals: [] };
    }
}

// ──────────────────────────────────────────
// GET SINGLE DEAL (full detail with timeline)
// ──────────────────────────────────────────
export async function getDealByIdAction(dealId: string, shopId: string) {
    try {
        const deal = await db.query.deals.findFirst({
            where: and(eq(deals.id, dealId), eq(deals.shopId, shopId)),
            with: {
                client: true,
                assignedUser: true,
                activities: {
                    orderBy: [desc(dealActivities.createdAt)],
                    with: { user: true },
                },
                proposals: {
                    orderBy: [desc(deals.createdAt)],
                    with: { items: true, token: true },
                },
                contracts: true,
                projects: true,
            },
        });
        if (!deal) return { success: false, error: "Deal not found.", deal: null };
        return { success: true, deal };
    } catch (err: any) {
        console.error("getDealByIdAction:", err);
        return { success: false, error: err.message, deal: null };
    }
}

// ──────────────────────────────────────────
// PIPELINE FORECAST METRICS
// ──────────────────────────────────────────
export async function getPipelineForecastAction(shopId: string) {
    try {
        const allDeals = await db.query.deals.findMany({
            where: eq(deals.shopId, shopId),
            columns: {
                stage: true,
                estimatedValue: true,
                winProbability: true,
                currency: true,
            },
        });

        const stages: DealStage[] = ["LEAD", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];
        const stageSummary: Record<string, { count: number; totalValue: number; weightedValue: number }> = {};
        stages.forEach(s => { stageSummary[s] = { count: 0, totalValue: 0, weightedValue: 0 }; });

        let totalWeightedPipeline = 0;
        let totalWonRevenue = 0;

        for (const d of allDeals) {
            const val = parseFloat(d.estimatedValue || "0");
            const prob = d.winProbability / 100;
            const s = d.stage as DealStage;
            stageSummary[s].count += 1;
            stageSummary[s].totalValue += val;
            stageSummary[s].weightedValue += val * prob;
            if (s !== "LOST") totalWeightedPipeline += val * prob;
            if (s === "WON") totalWonRevenue += val;
        }

        return {
            success: true,
            stageSummary,
            totalWeightedPipeline,
            totalWonRevenue,
            totalDeals: allDeals.length,
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
