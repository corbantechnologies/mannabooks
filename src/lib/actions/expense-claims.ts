// src/lib/actions/expense-claims.ts
"use server";

import { db } from "@/db";
import { expenseClaims, expenses, employees, shops, costCenters, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { enforcePermission } from "@/lib/actions/rbac";
import { revalidatePath } from "next/cache";
import { createJournalEntry } from "./gl";
import { EXPENSE_CATEGORY_ACCOUNT_MAP } from "../gl-constants";

export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'FUEL' | 'MARKETING' | 'SALARIES' | 'OFFICE_SUPPLIES' | 'OTHER';
export type ExpenseClaimStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED';

export interface CreateExpenseClaimData {
    shopId: string;
    employeeId: string;
    title: string;
    description?: string;
    amount: number;
    claimDate: Date | string;
    category: ExpenseCategory;
    costCenterId?: string;
    receiptUrl?: string;
    submitNow?: boolean;
}

/**
 * Generate a sequential/unique claim number e.g. CLM-2609-0012
 */
function generateClaimNumber(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    return `CLM-${yearMonth}-${randomHex}`;
}

/**
 * Create a new expense reimbursement claim
 */
export async function createExpenseClaim(data: CreateExpenseClaimData) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized. Please log in." };

    try {
        const claimNumber = generateClaimNumber();
        const dateObj = typeof data.claimDate === "string" ? new Date(data.claimDate) : data.claimDate;
        const formattedDate = dateObj.toISOString().split("T")[0];

        const [newClaim] = await db.insert(expenseClaims).values({
            shopId: data.shopId,
            employeeId: data.employeeId,
            claimNumber,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            amount: data.amount.toString(),
            claimDate: formattedDate,
            category: data.category,
            costCenterId: data.costCenterId || null,
            receiptUrl: data.receiptUrl || null,
            status: data.submitNow ? "SUBMITTED" : "DRAFT",
        }).returning();

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, data.shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/employees/claims`);
            revalidatePath(`/workspaces/${shop.slug}/ess`);
        }

        return { success: true, claim: newClaim };
    } catch (err: any) {
        console.error("Failed to create expense claim:", err);
        return { success: false, error: err.message || "Failed to create expense claim." };
    }
}

/**
 * Update an existing expense claim (allowed if in DRAFT or REJECTED status)
 */
export async function updateExpenseClaim(
    shopId: string,
    claimId: string,
    data: Partial<CreateExpenseClaimData>
) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized. Please log in." };

    try {
        const existingClaim = await db.query.expenseClaims.findFirst({
            where: and(
                eq(expenseClaims.id, claimId),
                eq(expenseClaims.shopId, shopId)
            ),
        });

        if (!existingClaim) {
            return { success: false, error: "Expense claim not found." };
        }

        if (existingClaim.status !== "DRAFT" && existingClaim.status !== "REJECTED") {
            return { success: false, error: "Only claims in DRAFT or REJECTED status can be modified." };
        }

        const updatePayload: Record<string, any> = {};
        if (data.title !== undefined) updatePayload.title = data.title.trim();
        if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
        if (data.amount !== undefined) updatePayload.amount = data.amount.toString();
        if (data.claimDate !== undefined) {
            const dateObj = typeof data.claimDate === "string" ? new Date(data.claimDate) : data.claimDate;
            updatePayload.claimDate = dateObj.toISOString().split("T")[0];
        }
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.costCenterId !== undefined) updatePayload.costCenterId = data.costCenterId || null;
        if (data.receiptUrl !== undefined) updatePayload.receiptUrl = data.receiptUrl || null;
        if (data.submitNow) updatePayload.status = "SUBMITTED";

        const [updated] = await db.update(expenseClaims)
            .set(updatePayload)
            .where(and(eq(expenseClaims.id, claimId), eq(expenseClaims.shopId, shopId)))
            .returning();

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/employees/claims`);
            revalidatePath(`/workspaces/${shop.slug}/ess`);
        }

        return { success: true, claim: updated };
    } catch (err: any) {
        console.error("Failed to update expense claim:", err);
        return { success: false, error: err.message || "Failed to update expense claim." };
    }
}

/**
 * Submit a draft or rejected claim for management review
 */
export async function submitExpenseClaim(shopId: string, claimId: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.update(expenseClaims)
            .set({ status: "SUBMITTED" })
            .where(and(eq(expenseClaims.id, claimId), eq(expenseClaims.shopId, shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/employees/claims`);
            revalidatePath(`/workspaces/${shop.slug}/ess`);
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to submit claim." };
    }
}

/**
 * Manager approval or rejection of a submitted expense claim
 */
export async function reviewExpenseClaim(
    shopId: string,
    claimId: string,
    decision: "APPROVED" | "REJECTED",
    notes?: string
) {
    try {
        const { userId } = await enforcePermission(shopId, "manage_expenses");

        const claim = await db.query.expenseClaims.findFirst({
            where: and(
                eq(expenseClaims.id, claimId),
                eq(expenseClaims.shopId, shopId)
            ),
        });

        if (!claim) {
            return { success: false, error: "Expense claim not found." };
        }

        if (claim.status !== "SUBMITTED" && claim.status !== "APPROVED" && claim.status !== "REJECTED") {
            return { success: false, error: `Cannot review claim in status "${claim.status}".` };
        }

        await db.update(expenseClaims)
            .set({
                status: decision,
                approvedById: userId,
                approvedAt: new Date(),
                approvalNotes: notes?.trim() || null,
            })
            .where(and(eq(expenseClaims.id, claimId), eq(expenseClaims.shopId, shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/employees/claims`);
            revalidatePath(`/workspaces/${shop.slug}/ess`);
        }

        return { success: true };
    } catch (err: any) {
        console.error("Failed to review expense claim:", err);
        return { success: false, error: err.message || "Failed to review expense claim." };
    }
}

/**
 * Disburse an approved claim: records an expense and creates GL journal entry
 */
export async function disburseExpenseClaim(
    shopId: string,
    claimId: string,
    disbursementData: {
        paymentChannel: string;
        paymentReference?: string;
        paymentDate?: Date | string;
    }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const claim = await db.query.expenseClaims.findFirst({
            where: and(
                eq(expenseClaims.id, claimId),
                eq(expenseClaims.shopId, shopId)
            ),
            with: {
                employee: true,
            },
        });

        if (!claim) {
            return { success: false, error: "Claim not found." };
        }

        if (claim.status !== "APPROVED") {
            return { success: false, error: "Only approved claims can be disbursed." };
        }

        const paymentDate = disbursementData.paymentDate 
            ? (typeof disbursementData.paymentDate === "string" ? new Date(disbursementData.paymentDate) : disbursementData.paymentDate)
            : new Date();

        // 1. Create the official business expense record
        const [newExpense] = await db.insert(expenses).values({
            shopId,
            description: `Reimbursement [${claim.claimNumber}]: ${claim.title} (${claim.employee.fullName})`,
            amount: claim.amount,
            category: claim.category,
            expenseDate: paymentDate,
            paymentChannel: disbursementData.paymentChannel,
            paymentReference: disbursementData.paymentReference || claim.claimNumber,
            receiptUrl: claim.receiptUrl,
            isNonDeductible: false,
        }).returning();

        // 2. Post auto-journal: DR Expense Account / CR Cash & Bank
        const expenseAccountCode = EXPENSE_CATEGORY_ACCOUNT_MAP[claim.category] || "6900";
        await createJournalEntry({
            shopId,
            entryDate: paymentDate,
            description: `Disbursement ${claim.claimNumber} - ${claim.employee.fullName}`,
            debitAccountCode: expenseAccountCode,
            creditAccountCode: "1200", // Cash & Bank
            amount: parseFloat(claim.amount),
            sourceType: "expense",
            sourceId: newExpense.id,
        });

        // 3. Mark claim as DISBURSED
        await db.update(expenseClaims)
            .set({
                status: "DISBURSED",
                disbursedExpenseId: newExpense.id,
                disbursedAt: new Date(),
            })
            .where(and(eq(expenseClaims.id, claimId), eq(expenseClaims.shopId, shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/employees/claims`);
            revalidatePath(`/workspaces/${shop.slug}/expenses`);
            revalidatePath(`/workspaces/${shop.slug}/analytics`);
            revalidatePath(`/workspaces/${shop.slug}/ess`);
        }

        return { success: true, expenseId: newExpense.id };
    } catch (err: any) {
        console.error("Failed to disburse claim:", err);
        return { success: false, error: err.message || "Failed to disburse expense claim." };
    }
}

/**
 * Fetch all workspace expense claims with relational data
 */
export async function getWorkspaceExpenseClaims(shopId: string, filterStatus?: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const whereCondition = filterStatus && filterStatus !== "ALL"
            ? and(eq(expenseClaims.shopId, shopId), eq(expenseClaims.status, filterStatus as any))
            : eq(expenseClaims.shopId, shopId);

        const claims = await db.query.expenseClaims.findMany({
            where: whereCondition,
            with: {
                employee: true,
                costCenter: true,
                approvedBy: true,
                disbursedExpense: true,
            },
            orderBy: [desc(expenseClaims.createdAt)],
        });

        return { success: true, claims };
    } catch (err: any) {
        console.error("Failed to fetch claims:", err);
        return { success: false, claims: [], error: err.message };
    }
}
