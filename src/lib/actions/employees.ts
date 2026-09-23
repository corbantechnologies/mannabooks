// src/lib/actions/employees.ts
"use server";

import { db } from "@/db";
import { employees, shopMembers, users, shops } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { enforcePermission } from "@/lib/actions/rbac";
import { revalidatePath } from "next/cache";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

export interface UpdateEmployeeExtendedData {
    fullName?: string;
    email?: string;
    department?: string;
    designation?: string;
    employmentType?: EmploymentType;
    nationalId?: string;
    kraPin?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankBranch?: string;
    mpesaPhone?: string;
    baseSalary?: number;
    commissionRate?: number;
    isActive?: boolean;
}

/**
 * Update extended HR, payroll & banking details for an employee
 */
export async function updateEmployeeExtended(
    shopId: string,
    employeeId: string,
    data: UpdateEmployeeExtendedData
) {
    try {
        await enforcePermission(shopId, "manage_payroll");

        const updatePayload: Record<string, any> = {};

        if (data.fullName !== undefined) updatePayload.fullName = data.fullName.trim();
        if (data.email !== undefined) updatePayload.email = data.email?.trim() || null;
        if (data.department !== undefined) updatePayload.department = data.department?.trim() || null;
        if (data.designation !== undefined) updatePayload.designation = data.designation?.trim() || null;
        if (data.employmentType !== undefined) updatePayload.employmentType = data.employmentType;
        if (data.nationalId !== undefined) updatePayload.nationalId = data.nationalId?.trim() || null;
        if (data.kraPin !== undefined) updatePayload.kraPin = data.kraPin?.trim().toUpperCase() || null;
        if (data.bankName !== undefined) updatePayload.bankName = data.bankName?.trim() || null;
        if (data.bankAccountNumber !== undefined) updatePayload.bankAccountNumber = data.bankAccountNumber?.trim() || null;
        if (data.bankBranch !== undefined) updatePayload.bankBranch = data.bankBranch?.trim() || null;
        if (data.mpesaPhone !== undefined) updatePayload.mpesaPhone = data.mpesaPhone?.trim() || null;
        if (data.baseSalary !== undefined) updatePayload.baseSalary = data.baseSalary.toString();
        if (data.commissionRate !== undefined) updatePayload.commissionRate = data.commissionRate.toString();
        if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

        // Check national ID uniqueness if updated
        if (updatePayload.nationalId) {
            const existing = await db.query.employees.findFirst({
                where: and(
                    eq(employees.shopId, shopId),
                    eq(employees.nationalId, updatePayload.nationalId)
                ),
            });
            if (existing && existing.id !== employeeId) {
                return { success: false, error: `National ID "${updatePayload.nationalId}" is already used by another employee.` };
            }
        }

        // Check KRA PIN uniqueness if updated
        if (updatePayload.kraPin) {
            const existing = await db.query.employees.findFirst({
                where: and(
                    eq(employees.shopId, shopId),
                    eq(employees.kraPin, updatePayload.kraPin)
                ),
            });
            if (existing && existing.id !== employeeId) {
                return { success: false, error: `KRA PIN "${updatePayload.kraPin}" is already used by another employee.` };
            }
        }

        await db.update(employees)
            .set(updatePayload)
            .where(and(eq(employees.id, employeeId), eq(employees.shopId, shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/employees`);
            revalidatePath(`/workspaces/${shop.slug}/payroll`);
            revalidatePath(`/workspaces/${shop.slug}/payroll/employees/${employeeId}`);
        }

        return { success: true };
    } catch (err: any) {
        console.error("Failed to update employee extended details:", err);
        return { success: false, error: err.message || "Failed to update employee details." };
    }
}

/**
 * Link an employee profile to a workspace user account
 */
export async function linkEmployeeToUser(
    shopId: string,
    employeeId: string,
    userId: string
) {
    try {
        await enforcePermission(shopId, "manage_team");

        // Verify that target user belongs to this shop
        const membership = await db.query.shopMembers.findFirst({
            where: and(
                eq(shopMembers.shopId, shopId),
                eq(shopMembers.userId, userId),
                eq(shopMembers.isActive, true)
            ),
        });

        if (!membership) {
            return { success: false, error: "The selected user does not belong to this workspace." };
        }

        // Check if user is already linked to another employee in this shop
        const existingEmployee = await db.query.employees.findFirst({
            where: and(
                eq(employees.shopId, shopId),
                eq(employees.userId, userId)
            ),
        });

        if (existingEmployee && existingEmployee.id !== employeeId) {
            return {
                success: false,
                error: `This user account is already linked to employee "${existingEmployee.fullName}".`,
            };
        }

        await db.update(employees)
            .set({ userId })
            .where(and(eq(employees.id, employeeId), eq(employees.shopId, shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/employees`);
            revalidatePath(`/workspaces/${shop.slug}/ess`);
        }

        return { success: true };
    } catch (err: any) {
        console.error("Failed to link employee to user account:", err);
        return { success: false, error: err.message || "Failed to link user account." };
    }
}

/**
 * Unlink an employee profile from their user account
 */
export async function unlinkEmployeeFromUser(shopId: string, employeeId: string) {
    try {
        await enforcePermission(shopId, "manage_team");

        await db.update(employees)
            .set({ userId: null })
            .where(and(eq(employees.id, employeeId), eq(employees.shopId, shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/employees`);
            revalidatePath(`/workspaces/${shop.slug}/ess`);
        }

        return { success: true };
    } catch (err: any) {
        console.error("Failed to unlink employee from user account:", err);
        return { success: false, error: err.message || "Failed to unlink user account." };
    }
}

/**
 * Fetch linkable workspace users for this shop
 */
export async function getLinkableWorkspaceUsers(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    const members = await db.query.shopMembers.findMany({
        where: and(
            eq(shopMembers.shopId, shopId),
            eq(shopMembers.isActive, true)
        ),
        with: {
            user: true,
        },
    });

    const activeEmployees = await db.query.employees.findMany({
        where: eq(employees.shopId, shopId),
    });

    const linkedUserIds = new Set(
        activeEmployees.map((e) => e.userId).filter(Boolean)
    );

    return members.map((m) => ({
        id: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        isLinked: linkedUserIds.has(m.userId),
    }));
}
