"use server";

import { db } from "@/db";
import {
    approvalPolicies,
    approvalRequests,
    approvalTimeline,
    shops,
    users,
    shopMembers,
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface CreateApprovalRequestInput {
    shopId: string;
    requestType: "PURCHASE_REQUISITION" | "EXPENSE_CLAIM" | "CREDIT_NOTE" | "STOCK_ADJUSTMENT" | "BUDGET_OVERRUN";
    title: string;
    description?: string;
    amount?: number;
    currency?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    targetEntityType: string;
    targetEntityId: string;
    payloadSnapshot?: any;
}

async function getNextRequestNumber(shopId: string): Promise<string> {
    const year = new Date().getFullYear();
    const existing = await db.query.approvalRequests.findMany({
        where: eq(approvalRequests.shopId, shopId),
        columns: { requestNumber: true },
        orderBy: [desc(approvalRequests.createdAt)],
        limit: 1,
    });

    if (existing.length === 0) return `REQ-${year}-0001`;
    const last = existing[0].requestNumber;
    const match = last.match(/(\d+)$/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    return `REQ-${year}-${String(nextNum).padStart(4, "0")}`;
}

/**
 * Retrieves all approval policies configured for a workspace.
 */
export async function getApprovalPolicies(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    let policies = await db.query.approvalPolicies.findMany({
        where: eq(approvalPolicies.shopId, shopId),
        orderBy: [desc(approvalPolicies.createdAt)],
    });

    // Auto-seed default baseline policies if none exist
    if (policies.length === 0) {
        const defaultSeeds = [
            {
                shopId,
                requestType: "PURCHASE_REQUISITION" as const,
                name: "Purchase Orders > KES 20,000",
                minAmount: "20000.00",
                maxAmount: null,
                requiredRole: "MANAGER" as const,
                autoApproveBelow: "20000.00",
                isActive: true,
            },
            {
                shopId,
                requestType: "CREDIT_NOTE" as const,
                name: "Credit Notes & Refunds > KES 10,000",
                minAmount: "10000.00",
                maxAmount: null,
                requiredRole: "ADMIN" as const,
                autoApproveBelow: "10000.00",
                isActive: true,
            },
            {
                shopId,
                requestType: "STOCK_ADJUSTMENT" as const,
                name: "Inventory Write-Offs > KES 15,000",
                minAmount: "15000.00",
                maxAmount: null,
                requiredRole: "MANAGER" as const,
                autoApproveBelow: "15000.00",
                isActive: true,
            },
            {
                shopId,
                requestType: "EXPENSE_CLAIM" as const,
                name: "Employee Claims > KES 5,000",
                minAmount: "5000.00",
                maxAmount: null,
                requiredRole: "MANAGER" as const,
                autoApproveBelow: "5000.00",
                isActive: true,
            },
        ];

        await db.insert(approvalPolicies).values(defaultSeeds);
        policies = await db.query.approvalPolicies.findMany({
            where: eq(approvalPolicies.shopId, shopId),
        });
    }

    return policies;
}

/**
 * Updates or creates an approval policy.
 */
export async function upsertApprovalPolicyAction(input: {
    id?: string;
    shopId: string;
    requestType: "PURCHASE_REQUISITION" | "EXPENSE_CLAIM" | "CREDIT_NOTE" | "STOCK_ADJUSTMENT" | "BUDGET_OVERRUN";
    name: string;
    minAmount: number;
    autoApproveBelow: number;
    requiredRole: "OWNER" | "ADMIN" | "MANAGER";
    isActive?: boolean;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await enforcePermission(input.shopId, "manage_settings");

        if (input.id) {
            await db.update(approvalPolicies).set({
                name: input.name.trim(),
                requestType: input.requestType,
                minAmount: String(input.minAmount),
                autoApproveBelow: String(input.autoApproveBelow),
                requiredRole: input.requiredRole,
                isActive: input.isActive ?? true,
            }).where(and(eq(approvalPolicies.id, input.id), eq(approvalPolicies.shopId, input.shopId)));
        } else {
            await db.insert(approvalPolicies).values({
                shopId: input.shopId,
                name: input.name.trim(),
                requestType: input.requestType,
                minAmount: String(input.minAmount),
                autoApproveBelow: String(input.autoApproveBelow),
                requiredRole: input.requiredRole,
                isActive: true,
            });
        }

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, input.shopId) });
        if (shop) revalidatePath(`/workspaces/${shop.slug}/approvals`);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update policy." };
    }
}

/**
 * Retrieves approval requests for a workspace with full relations.
 */
export async function getApprovalRequests(shopId: string, filter?: { status?: string }) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    let conditions: any[] = [eq(approvalRequests.shopId, shopId)];

    if (filter?.status && filter.status !== "ALL") {
        conditions.push(eq(approvalRequests.status, filter.status as any));
    }

    return await db.query.approvalRequests.findMany({
        where: and(...conditions),
        orderBy: [desc(approvalRequests.createdAt)],
        with: {
            requester: true,
            decisionBy: true,
            policy: true,
            timeline: {
                with: { user: true },
                orderBy: (t, { asc }) => [asc(t.createdAt)],
            },
        },
    });
}

/**
 * Creates a formal approval ticket in the workspace.
 */
export async function createApprovalRequestAction(input: CreateApprovalRequestInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    try {
        const requestNumber = await getNextRequestNumber(input.shopId);
        const approvalToken = crypto.randomBytes(32).toString("hex");

        const [request] = await db.insert(approvalRequests).values({
            shopId: input.shopId,
            requestType: input.requestType,
            requestNumber,
            requesterUserId: session.userId,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            amount: String(input.amount || 0),
            currency: input.currency || "KES",
            priority: input.priority || "NORMAL",
            status: "PENDING",
            targetEntityType: input.targetEntityType,
            targetEntityId: input.targetEntityId,
            payloadSnapshot: input.payloadSnapshot || null,
            approvalToken,
        }).returning();

        // Log timeline entry
        await db.insert(approvalTimeline).values({
            requestId: request.id,
            userId: session.userId,
            action: "SUBMITTED",
            comment: `Request ${requestNumber} submitted for authorization.`,
        });

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, input.shopId) });
        if (shop) revalidatePath(`/workspaces/${shop.slug}/approvals`);

        return { success: true, requestId: request.id, requestNumber, approvalToken };
    } catch (err: any) {
        console.error("Failed to create approval request:", err);
        return { success: false, error: err.message || "Failed to create approval request." };
    }
}

/**
 * Decides an approval request (APPROVE or REJECT).
 */
export async function decideApprovalRequestAction(params: {
    shopId: string;
    requestId: string;
    decision: "APPROVE" | "REJECT";
    reason?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session." };

    try {
        // 1. Verify user membership role in this shop
        const membership = await db.query.shopMembers.findFirst({
            where: and(
                eq(shopMembers.shopId, params.shopId),
                eq(shopMembers.userId, session.userId),
                eq(shopMembers.isActive, true)
            ),
        });

        if (!membership && !session.user.isSuperAdmin) {
            return { success: false, error: "Access Denied. You are not a member of this workspace." };
        }

        const role = session.user.isSuperAdmin ? "OWNER" : membership!.role;
        if (role !== "OWNER" && role !== "ADMIN" && role !== "MANAGER") {
            return { success: false, error: "Access Denied. Only Managers, Admins, or Owners can decide approval requests." };
        }

        // 2. Fetch the target request
        const request = await db.query.approvalRequests.findFirst({
            where: and(
                eq(approvalRequests.id, params.requestId),
                eq(approvalRequests.shopId, params.shopId)
            ),
        });

        if (!request) {
            return { success: false, error: "Approval request not found." };
        }

        if (request.status !== "PENDING") {
            return { success: false, error: `This request has already been finalized as ${request.status}.` };
        }

        if (params.decision === "REJECT" && (!params.reason || params.reason.trim().length < 5)) {
            return { success: false, error: "A clear reason (at least 5 characters) is required when rejecting a request." };
        }

        const newStatus = params.decision === "APPROVE" ? "APPROVED" : "REJECTED";

        // 3. Atomically update request and log timeline
        await db.transaction(async (tx) => {
            await tx.update(approvalRequests).set({
                status: newStatus,
                decisionByUserId: session.userId,
                decisionAt: new Date(),
                decisionReason: params.reason?.trim() || (newStatus === "APPROVED" ? "Approved by authorized reviewer." : null),
                updatedAt: new Date(),
            }).where(eq(approvalRequests.id, request.id));

            await tx.insert(approvalTimeline).values({
                requestId: request.id,
                userId: session.userId,
                action: newStatus,
                comment: params.reason?.trim() || (newStatus === "APPROVED" ? "Request approved." : "Request rejected."),
            });
        });

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, params.shopId) });
        if (shop) revalidatePath(`/workspaces/${shop.slug}/approvals`);

        return { success: true };
    } catch (err: any) {
        console.error("Failed to decide approval request:", err);
        return { success: false, error: err.message || "Failed to finalize decision." };
    }
}
