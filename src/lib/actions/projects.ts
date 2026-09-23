"use server";

import { db } from "@/db";
import {
    projects, projectMembers, timesheets, projectMilestones, shops, clients, documents, users,
} from "@/db/schema";
import { eq, and, desc, inArray, sum, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";
import { createNotificationAction } from "./notifications";

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
async function getNextProjectCode(shopId: string): Promise<string> {
    const year = new Date().getFullYear();
    const existing = await db.query.projects.findMany({
        where: eq(projects.shopId, shopId),
        columns: { projectCode: true },
        orderBy: [desc(projects.createdAt)],
        limit: 1,
    });
    if (existing.length === 0) return `PROJ-${year}-001`;
    const last = existing[0].projectCode;
    const match = last.match(/(\d+)$/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    return `PROJ-${year}-${String(nextNum).padStart(3, "0")}`;
}

// ──────────────────────────────────────────
// CREATE PROJECT
// ──────────────────────────────────────────
export interface CreateProjectInput {
    shopId: string;
    shopSlug: string;
    clientId?: string;
    dealId?: string;
    contractId?: string;
    name: string;
    description?: string;
    currency?: string;
    budgetType?: "FIXED" | "TIME_AND_MATERIALS";
    budgetAmount?: number;
    budgetHours?: number;
    startDate?: string;
    endDate?: string;
}

export async function createProjectAction(input: CreateProjectInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const projectCode = await getNextProjectCode(input.shopId);

        const [project] = await db.insert(projects).values({
            shopId: input.shopId,
            clientId: input.clientId || null,
            dealId: input.dealId || null,
            contractId: input.contractId || null,
            projectCode,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            status: "PLANNING",
            currency: input.currency || "KES",
            budgetType: input.budgetType || "FIXED",
            budgetAmount: String(input.budgetAmount || 0),
            budgetHours: String(input.budgetHours || 0),
            startDate: input.startDate || null,
            endDate: input.endDate || null,
        }).returning();

        // Auto-add creator as project member
        await db.insert(projectMembers).values({
            projectId: project.id,
            shopId: input.shopId,
            userId: session.userId,
            role: "Project Lead",
            billableRatePerHour: "0",
            isActive: true,
        }).onConflictDoNothing();

        revalidatePath(`/workspaces/${input.shopSlug}/projects`);
        return { success: true, projectId: project.id, projectCode };
    } catch (err: any) {
        console.error("createProjectAction:", err);
        return { success: false, error: err.message || "Failed to create project." };
    }
}

// ──────────────────────────────────────────
// UPDATE PROJECT
// ──────────────────────────────────────────
export async function updateProjectAction(input: {
    projectId: string;
    shopId: string;
    shopSlug: string;
    name?: string;
    description?: string;
    status?: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
    budgetAmount?: number;
    budgetHours?: number;
    startDate?: string;
    endDate?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.update(projects).set({
            ...(input.name && { name: input.name.trim() }),
            description: input.description?.trim() || undefined,
            ...(input.status && { status: input.status }),
            ...(input.budgetAmount !== undefined && { budgetAmount: String(input.budgetAmount) }),
            ...(input.budgetHours !== undefined && { budgetHours: String(input.budgetHours) }),
            startDate: input.startDate || undefined,
            endDate: input.endDate || undefined,
            updatedAt: new Date(),
        }).where(and(eq(projects.id, input.projectId), eq(projects.shopId, input.shopId)));

        revalidatePath(`/workspaces/${input.shopSlug}/projects`);
        revalidatePath(`/workspaces/${input.shopSlug}/projects/${input.projectId}`);
        return { success: true };
    } catch (err: any) {
        console.error("updateProjectAction:", err);
        return { success: false, error: err.message || "Failed to update project." };
    }
}

// ──────────────────────────────────────────
// ADD PROJECT MEMBER
// ──────────────────────────────────────────
export async function addProjectMemberAction(input: {
    projectId: string;
    shopId: string;
    shopSlug: string;
    userId: string;
    role?: string;
    billableRatePerHour?: number;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.insert(projectMembers).values({
            projectId: input.projectId,
            shopId: input.shopId,
            userId: input.userId,
            role: input.role || "Team Member",
            billableRatePerHour: String(input.billableRatePerHour || 0),
            isActive: true,
        }).onConflictDoNothing();

        revalidatePath(`/workspaces/${input.shopSlug}/projects/${input.projectId}`);
        return { success: true };
    } catch (err: any) {
        console.error("addProjectMemberAction:", err);
        return { success: false, error: err.message || "Failed to add member." };
    }
}

// ──────────────────────────────────────────
// REMOVE PROJECT MEMBER
// ──────────────────────────────────────────
export async function removeProjectMemberAction(memberId: string, projectId: string, shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.delete(projectMembers).where(
            and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId))
        );
        revalidatePath(`/workspaces/${shopSlug}/projects/${projectId}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to remove member." };
    }
}

// ──────────────────────────────────────────
// LOG TIMESHEET ENTRY
// ──────────────────────────────────────────
export interface LogTimesheetInput {
    projectId: string;
    shopId: string;
    shopSlug: string;
    workDate: string; // YYYY-MM-DD
    hoursLogged: number;
    taskDescription: string;
    isBillable?: boolean;
}

export async function logTimesheetAction(input: LogTimesheetInput) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // Fetch billable rate from project member record
        const member = await db.query.projectMembers.findFirst({
            where: and(
                eq(projectMembers.projectId, input.projectId),
                eq(projectMembers.userId, session.userId)
            ),
        });

        const billableRate = parseFloat(String(member?.billableRatePerHour || "0"));
        const billableAmount = (input.isBillable !== false) ? input.hoursLogged * billableRate : 0;

        const [entry] = await db.insert(timesheets).values({
            projectId: input.projectId,
            shopId: input.shopId,
            userId: session.userId,
            workDate: input.workDate,
            hoursLogged: String(input.hoursLogged),
            taskDescription: input.taskDescription.trim(),
            isBillable: input.isBillable !== false,
            billableRate: String(billableRate),
            billableAmount: String(billableAmount),
            status: "DRAFT",
        }).returning();

        revalidatePath(`/workspaces/${input.shopSlug}/projects/${input.projectId}`);
        return { success: true, timesheetId: entry.id };
    } catch (err: any) {
        console.error("logTimesheetAction:", err);
        return { success: false, error: err.message || "Failed to log timesheet." };
    }
}

// ──────────────────────────────────────────
// SUBMIT TIMESHEET FOR APPROVAL
// ──────────────────────────────────────────
export async function submitTimesheetAction(timesheetId: string, shopId: string, shopSlug: string, projectId: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.update(timesheets).set({
            status: "SUBMITTED",
            updatedAt: new Date(),
        }).where(and(
            eq(timesheets.id, timesheetId),
            eq(timesheets.shopId, shopId),
            eq(timesheets.userId, session.userId)
        ));

        revalidatePath(`/workspaces/${shopSlug}/projects/${projectId}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to submit timesheet." };
    }
}

// ──────────────────────────────────────────
// APPROVE / REJECT TIMESHEET (Manager)
// ──────────────────────────────────────────
export async function reviewTimesheetAction(input: {
    timesheetId: string;
    shopId: string;
    shopSlug: string;
    projectId: string;
    action: "APPROVED" | "REJECTED";
    reviewNotes?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const entry = await db.query.timesheets.findFirst({
            where: and(eq(timesheets.id, input.timesheetId), eq(timesheets.shopId, input.shopId)),
            with: { user: true },
        });
        if (!entry) return { success: false, error: "Timesheet not found." };

        await db.update(timesheets).set({
            status: input.action,
            reviewedByUserId: session.userId,
            reviewNotes: input.reviewNotes?.trim() || null,
            updatedAt: new Date(),
        }).where(eq(timesheets.id, input.timesheetId));

        // Notify submitter
        if (entry.userId) {
            await createNotificationAction({
                userId: entry.userId,
                shopId: input.shopId,
                title: `Timesheet ${input.action === "APPROVED" ? "✅ Approved" : "❌ Rejected"}`,
                message: `Your timesheet for ${entry.workDate} (${entry.hoursLogged}h) was ${input.action.toLowerCase()}${input.reviewNotes ? `: "${input.reviewNotes}"` : "."}`,
                type: "SYSTEM",
                link: `/workspaces/${input.shopSlug}/projects/${input.projectId}`,
            });
        }

        revalidatePath(`/workspaces/${input.shopSlug}/projects/${input.projectId}`);
        return { success: true };
    } catch (err: any) {
        console.error("reviewTimesheetAction:", err);
        return { success: false, error: err.message || "Failed to review timesheet." };
    }
}

// ──────────────────────────────────────────
// GENERATE INVOICE FROM APPROVED TIMESHEETS
// ──────────────────────────────────────────
export async function generateInvoiceFromTimesheetsAction(input: {
    projectId: string;
    shopId: string;
    shopSlug: string;
    timesheetIds: string[];
    clientId?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const project = await db.query.projects.findFirst({
            where: and(eq(projects.id, input.projectId), eq(projects.shopId, input.shopId)),
            with: { client: true },
        });
        if (!project) return { success: false, error: "Project not found." };

        const entries = await db.query.timesheets.findMany({
            where: and(
                eq(timesheets.projectId, input.projectId),
                eq(timesheets.shopId, input.shopId),
                eq(timesheets.status, "APPROVED"),
                eq(timesheets.isBillable, true)
            ),
            with: { user: true },
        });

        const selectedEntries = input.timesheetIds.length > 0
            ? entries.filter(e => input.timesheetIds.includes(e.id))
            : entries;

        if (selectedEntries.length === 0) {
            return { success: false, error: "No approved billable timesheet entries selected." };
        }

        const { createBillingDocument } = await import("./documents");

        const result = await createBillingDocument({
            shopId: input.shopId,
            shopSlug: input.shopSlug,
            clientId: input.clientId || project.clientId || undefined,
            type: "INVOICE",
            notes: `Time & Materials Invoice — Project: ${project.projectCode} ${project.name}`,
            currency: project.currency,
            items: selectedEntries.map(e => ({
                description: `${e.user?.name || "Team Member"} — ${e.taskDescription} (${e.workDate})`,
                quantity: parseFloat(String(e.hoursLogged)),
                unitPrice: parseFloat(String(e.billableRate)),
                taxType: "EXEMPT" as const,
            })),
        });

        if (!result.success) {
            return { success: false, error: result.error || "Invoice creation failed." };
        }
        if (!result.documentId) {
            return { success: false, error: "Invoice creation failed." };
        }

        // Mark entries as invoiced
        await db.update(timesheets).set({
            invoicedDocumentId: result.documentId,
            updatedAt: new Date(),
        }).where(inArray(timesheets.id, selectedEntries.map(e => e.id)));

        revalidatePath(`/workspaces/${input.shopSlug}/projects/${input.projectId}`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        return { success: true, documentId: result.documentId };
    } catch (err: any) {
        console.error("generateInvoiceFromTimesheetsAction:", err);
        return { success: false, error: err.message || "Failed to generate invoice." };
    }
}

// ──────────────────────────────────────────
// CREATE MILESTONE
// ──────────────────────────────────────────
export async function createMilestoneAction(input: {
    projectId: string;
    shopId: string;
    shopSlug: string;
    title: string;
    description?: string;
    amount: number;
    currency?: string;
    percentageOfTotal?: number;
    dueDate?: string;
    displayOrder?: number;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const [milestone] = await db.insert(projectMilestones).values({
            projectId: input.projectId,
            shopId: input.shopId,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            amount: String(input.amount),
            currency: input.currency || "KES",
            percentageOfTotal: String(input.percentageOfTotal || 0),
            dueDate: input.dueDate || null,
            status: "PENDING",
            displayOrder: input.displayOrder || 0,
        }).returning();

        revalidatePath(`/workspaces/${input.shopSlug}/projects/${input.projectId}`);
        return { success: true, milestoneId: milestone.id };
    } catch (err: any) {
        console.error("createMilestoneAction:", err);
        return { success: false, error: err.message || "Failed to create milestone." };
    }
}

// ──────────────────────────────────────────
// UPDATE MILESTONE STATUS
// ──────────────────────────────────────────
export async function updateMilestoneStatusAction(
    milestoneId: string,
    projectId: string,
    shopId: string,
    shopSlug: string,
    newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "INVOICED"
) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.update(projectMilestones).set({
            status: newStatus,
            completedAt: newStatus === "COMPLETED" || newStatus === "INVOICED" ? new Date() : null,
            updatedAt: new Date(),
        }).where(and(eq(projectMilestones.id, milestoneId), eq(projectMilestones.projectId, projectId)));

        revalidatePath(`/workspaces/${shopSlug}/projects/${projectId}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update milestone." };
    }
}

// ──────────────────────────────────────────
// CONVERT MILESTONE → INVOICE
// ──────────────────────────────────────────
export async function convertMilestoneToInvoiceAction(input: {
    milestoneId: string;
    projectId: string;
    shopId: string;
    shopSlug: string;
    clientId?: string;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const milestone = await db.query.projectMilestones.findFirst({
            where: and(eq(projectMilestones.id, input.milestoneId), eq(projectMilestones.projectId, input.projectId)),
        });
        if (!milestone) return { success: false, error: "Milestone not found." };
        if (milestone.status === "INVOICED") return { success: false, error: "This milestone has already been invoiced." };

        const project = await db.query.projects.findFirst({
            where: and(eq(projects.id, input.projectId), eq(projects.shopId, input.shopId)),
        });
        if (!project) return { success: false, error: "Project not found." };

        const { createBillingDocument } = await import("./documents");

        const result = await createBillingDocument({
            shopId: input.shopId,
            shopSlug: input.shopSlug,
            clientId: input.clientId || project.clientId || undefined,
            type: "INVOICE",
            notes: `Milestone Invoice — Project: ${project.projectCode} ${project.name}`,
            currency: milestone.currency,
            items: [{
                description: milestone.description
                    ? `${milestone.title}: ${milestone.description}`
                    : milestone.title,
                quantity: 1,
                unitPrice: parseFloat(String(milestone.amount)),
                taxType: "EXEMPT" as const,
            }],
        });

        if (!result.success) {
            return { success: false, error: result.error || "Invoice creation failed." };
        }
        if (!result.documentId) {
            return { success: false, error: "Invoice creation failed." };
        }

        // Mark milestone as invoiced
        await db.update(projectMilestones).set({
            status: "INVOICED",
            invoicedDocumentId: result.documentId,
            completedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(projectMilestones.id, input.milestoneId));

        revalidatePath(`/workspaces/${input.shopSlug}/projects/${input.projectId}`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        return { success: true, documentId: result.documentId };
    } catch (err: any) {
        console.error("convertMilestoneToInvoiceAction:", err);
        return { success: false, error: err.message || "Failed to convert milestone to invoice." };
    }
}

// ──────────────────────────────────────────
// GET PROJECTS BY SHOP
// ──────────────────────────────────────────
export async function getProjectsByShopAction(shopId: string) {
    try {
        const data = await db.query.projects.findMany({
            where: eq(projects.shopId, shopId),
            orderBy: [desc(projects.updatedAt)],
            with: {
                client: true,
                members: { with: { user: true } },
                milestones: { orderBy: [projectMilestones.displayOrder] },
            },
        });
        return { success: true, projects: data };
    } catch (err: any) {
        return { success: false, error: err.message, projects: [] };
    }
}

// ──────────────────────────────────────────
// GET SINGLE PROJECT (full detail)
// ──────────────────────────────────────────
export async function getProjectByIdAction(projectId: string, shopId: string) {
    try {
        const project = await db.query.projects.findFirst({
            where: and(eq(projects.id, projectId), eq(projects.shopId, shopId)),
            with: {
                client: true,
                deal: true,
                contract: true,
                members: { with: { user: true }, orderBy: [projectMembers.joinedAt] },
                timesheets: {
                    orderBy: [desc(timesheets.workDate)],
                    with: { user: true },
                },
                milestones: {
                    orderBy: [projectMilestones.displayOrder],
                    with: { invoicedDocument: { columns: { id: true, docNumber: true, status: true } } },
                },
            },
        });
        if (!project) return { success: false, error: "Project not found.", project: null };

        // Compute budget metrics
        const approvedHours = project.timesheets
            .filter(t => t.status === "APPROVED" && t.isBillable)
            .reduce((s, t) => s + parseFloat(String(t.hoursLogged)), 0);
        const totalBillable = project.timesheets
            .filter(t => t.status === "APPROVED" && t.isBillable)
            .reduce((s, t) => s + parseFloat(String(t.billableAmount)), 0);
        const totalMilestoneValue = project.milestones.reduce((s, m) => s + parseFloat(String(m.amount)), 0);
        const invoicedMilestones = project.milestones.filter(m => m.status === "INVOICED").reduce((s, m) => s + parseFloat(String(m.amount)), 0);

        return {
            success: true,
            project,
            metrics: {
                approvedHours,
                totalBillable,
                totalMilestoneValue,
                invoicedMilestones,
                remainingMilestones: totalMilestoneValue - invoicedMilestones,
            },
        };
    } catch (err: any) {
        console.error("getProjectByIdAction:", err);
        return { success: false, error: err.message, project: null, metrics: null };
    }
}
