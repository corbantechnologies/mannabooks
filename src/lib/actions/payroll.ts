// src/lib/actions/payroll.ts
"use server";

import { db } from "@/db";
import { employees, documents, documentItems, documentTokens, shops } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { computeKenyanDeductions, PayrollMode } from "@/lib/payroll-utils";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function getEmployees(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return [];

    return await db.query.employees.findMany({
        where: eq(employees.shopId, shopId),
        orderBy: [desc(employees.createdAt)],
    });
}

export async function registerNewEmployee(formData: {
    shopId: string;
    fullName: string;
    nationalId?: string;
    kraPin?: string;
    baseSalary: number;
    commissionRate: number;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized operation context." };

    try {
        const trimmedId = formData.nationalId?.trim();
        const trimmedPin = formData.kraPin?.trim().toUpperCase();

        // 1. Validate uniqueness for National ID
        if (trimmedId) {
            const existingId = await db.query.employees.findFirst({
                where: and(
                    eq(employees.shopId, formData.shopId),
                    eq(employees.nationalId, trimmedId)
                ),
            });
            if (existingId) {
                return { success: false, error: `An employee with National ID "${trimmedId}" is already registered in this workspace.` };
            }
        }

        // 2. Validate uniqueness for KRA PIN
        if (trimmedPin) {
            const existingPin = await db.query.employees.findFirst({
                where: and(
                    eq(employees.shopId, formData.shopId),
                    eq(employees.kraPin, trimmedPin)
                ),
            });
            if (existingPin) {
                return { success: false, error: `An employee with KRA PIN "${trimmedPin}" is already registered in this workspace.` };
            }
        }

        await db.insert(employees).values({
            shopId: formData.shopId,
            fullName: formData.fullName.trim(),
            nationalId: trimmedId || null,
            kraPin: trimmedPin || null,
            baseSalary: formData.baseSalary.toString(),
            commissionRate: formData.commissionRate.toString(),
        });

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, formData.shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/payroll`);
            revalidatePath(`/workspaces/${shop.slug}/employees`);
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to commit employee creation." };
    }
}

export async function updateEmployee(formData: {
    id: string;
    shopId: string;
    fullName: string;
    nationalId?: string;
    kraPin?: string;
    baseSalary: number;
    commissionRate: number;
    isActive?: boolean;
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized operation context." };

    try {
        await db.update(employees)
            .set({
                fullName: formData.fullName,
                nationalId: formData.nationalId || null,
                kraPin: formData.kraPin || null,
                baseSalary: formData.baseSalary.toString(),
                commissionRate: formData.commissionRate.toString(),
                isActive: formData.isActive ?? true,
            })
            .where(and(eq(employees.id, formData.id), eq(employees.shopId, formData.shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, formData.shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/payroll`);
            revalidatePath(`/workspaces/${shop.slug}/employees`);
            revalidatePath(`/workspaces/${shop.slug}/payroll/employees/${formData.id}`);
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update employee details." };
    }
}

export async function deleteEmployee(employeeId: string, shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized operation context." };

    try {
        await db.delete(employees)
            .where(and(eq(employees.id, employeeId), eq(employees.shopId, shopId)));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/payroll`);
            revalidatePath(`/workspaces/${shop.slug}/employees`);
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to delete employee entry." };
    }
}

export async function getEmployeeById(employeeId: string, shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return null;

    const employee = await db.query.employees.findFirst({
        where: and(eq(employees.id, employeeId), eq(employees.shopId, shopId)),
    });

    if (!employee) return null;

    // Fetch all historical payroll voucher runs containing this employee's name/ID
    const allPayrollDocs = await db.query.documents.findMany({
        where: and(eq(documents.shopId, shopId), eq(documents.type, "PAYROLL_VOUCHER")),
        orderBy: [desc(documents.issueDate)],
        with: {
            items: true,
        },
    });

    // Filter items related to this employee
    const payrollHistory = allPayrollDocs.flatMap((doc) => {
        const matchingItems = doc.items.filter((item) =>
            item.description.includes(employee.fullName) || item.description.includes(employee.id)
        );

        return matchingItems.map((item) => ({
            voucherId: doc.id,
            docNumber: doc.docNumber,
            issueDate: doc.issueDate,
            description: item.description,
            netPay: item.unitPrice,
        }));
    });

    return {
        ...employee,
        payrollHistory,
    };
}

export async function commitPayrollVoucherRun(input: {
    shopId: string;
    payrollPeriodCode: string; // e.g. "JULY-2026"
    mode?: PayrollMode;
    status?: "DRAFT" | "PAID";
    lines: {
        employeeId?: string;
        employeeName: string;
        baseSalary: number;
        allowances: number;
        commissions: number;
        customDeductions?: number;
    }[];
}) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session authority." };

    try {
        return await db.transaction(async (tx) => {
            let globalSubTotal = 0;
            let globalTaxPool = 0;
            let globalGrandTotal = 0;

            const mode = input.mode || "KENYA_STATUTORY";
            const targetStatus = input.status || "DRAFT";

            // 1. Pre-calculate line totals
            const processedLines = input.lines.map((line) => {
                const calcs = computeKenyanDeductions({
                    baseSalary: line.baseSalary,
                    allowances: line.allowances,
                    commissions: line.commissions,
                    customDeductions: line.customDeductions || 0,
                    mode,
                });

                globalSubTotal += calcs.grossSalary;
                globalTaxPool += calcs.totalDeductions;
                globalGrandTotal += calcs.netPay;

                return { line, calcs };
            });

            // 2. Commit single master payroll voucher document
            const voucherDocNumber = `PAY-${input.payrollPeriodCode.toUpperCase().replace(/\s+/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`;

            const [voucher] = await tx.insert(documents).values({
                shopId: input.shopId,
                clientId: null,
                docNumber: voucherDocNumber,
                type: "PAYROLL_VOUCHER",
                status: targetStatus,
                subTotal: globalSubTotal.toString(),
                taxAmount: globalTaxPool.toString(),
                grandTotal: globalGrandTotal.toString(),
            }).returning();

            // 3. Insert document items for each employee line in this run
            const itemsPayload = processedLines.map(({ line, calcs }) => ({
                documentId: voucher.id,
                description: `[Payroll Run: ${input.payrollPeriodCode}] Staff: ${line.employeeName} | Base: ${line.baseSalary} | Allow: ${line.allowances} | Comm: ${line.commissions} | Deductions: ${calcs.totalDeductions} (PAYE: ${calcs.paye}, SHIF: ${calcs.shif}, AHL: ${calcs.housingLevy}, NSSF: ${calcs.nssf}, Adv: ${calcs.customDeductions}) | Net: ${calcs.netPay}`,
                quantity: "1.00",
                unitPrice: calcs.netPay.toString(),
                taxType: "EXEMPT" as const,
                itemTotal: calcs.netPay.toString(),
            }));

            await tx.insert(documentItems).values(itemsPayload);

            // 4. Provision secure PDF gateway token
            const secureHexToken = crypto.randomBytes(32).toString("hex");
            await tx.insert(documentTokens).values({
                documentId: voucher.id,
                token: secureHexToken,
            });

            const shop = await tx.query.shops.findFirst({ where: eq(shops.id, input.shopId) });
            if (shop) {
                revalidatePath(`/workspaces/${shop.slug}/payroll`);
                revalidatePath(`/workspaces/${shop.slug}/documents`);
            }

            return { success: true, docNumber: voucherDocNumber, voucherId: voucher.id, status: targetStatus };
        });
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to finalize payroll voucher execution." };
    }
}

export async function updatePayrollVoucherStatus(voucherId: string, shopId: string, status: "DRAFT" | "PAID") {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context." };

    try {
        await db.update(documents)
            .set({ status })
            .where(and(eq(documents.id, voucherId), eq(documents.shopId, shopId), eq(documents.type, "PAYROLL_VOUCHER")));

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (shop) {
            revalidatePath(`/workspaces/${shop.slug}/payroll`);
            revalidatePath(`/workspaces/${shop.slug}/payroll/${voucherId}`);
            revalidatePath(`/workspaces/${shop.slug}/documents`);
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update voucher status." };
    }
}