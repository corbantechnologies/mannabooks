// src/lib/actions/ess.ts
"use server";

import { db } from "@/db";
import { employees, expenseClaims, documents, shops } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";

export interface ParsedPayslip {
    voucherId: string;
    docNumber: string;
    issueDate: Date;
    period: string;
    staffName: string;
    baseSalary: number;
    allowances: number;
    commissions: number;
    totalDeductions: number;
    paye: number;
    shif: number;
    housingLevy: number;
    nssf: number;
    advance: number;
    netPay: number;
}

function parsePayslipDescription(desc: string) {
    try {
        const periodMatch = desc.match(/\[Payroll Run:\s*([^\]]+)\]/);
        const staffMatch = desc.match(/Staff:\s*([^|]+)/);
        const baseMatch = desc.match(/Base:\s*([\d.]+)/);
        const allowMatch = desc.match(/Allow:\s*([\d.]+)/);
        const commMatch = desc.match(/Comm:\s*([\d.]+)/);
        const deductionsMatch = desc.match(/Deductions:\s*([\d.]+)/);
        const payeMatch = desc.match(/PAYE:\s*([\d.]+)/);
        const shifMatch = desc.match(/SHIF:\s*([\d.]+)/);
        const ahlMatch = desc.match(/AHL:\s*([\d.]+)/);
        const nssfMatch = desc.match(/NSSF:\s*([\d.]+)/);
        const advMatch = desc.match(/Adv:\s*([\d.]+)/);
        const netMatch = desc.match(/Net:\s*([\d.]+)/);

        return {
            period: periodMatch ? periodMatch[1].trim() : "Current",
            staffName: staffMatch ? staffMatch[1].trim() : "",
            baseSalary: baseMatch ? parseFloat(baseMatch[1]) : 0,
            allowances: allowMatch ? parseFloat(allowMatch[1]) : 0,
            commissions: commMatch ? parseFloat(commMatch[1]) : 0,
            totalDeductions: deductionsMatch ? parseFloat(deductionsMatch[1]) : 0,
            paye: payeMatch ? parseFloat(payeMatch[1]) : 0,
            shif: shifMatch ? parseFloat(shifMatch[1]) : 0,
            housingLevy: ahlMatch ? parseFloat(ahlMatch[1]) : 0,
            nssf: nssfMatch ? parseFloat(nssfMatch[1]) : 0,
            advance: advMatch ? parseFloat(advMatch[1]) : 0,
            netPay: netMatch ? parseFloat(netMatch[1]) : 0,
        };
    } catch {
        return null;
    }
}

/**
 * Resolve current logged-in employee profile for the target workspace
 */
export async function getCurrentEmployeeProfile(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return { isLinked: false, employee: null };

    const employee = await db.query.employees.findFirst({
        where: and(
            eq(employees.shopId, shopId),
            eq(employees.userId, session.userId)
        ),
    });

    if (!employee) {
        return { isLinked: false, employee: null, userId: session.userId };
    }

    return {
        isLinked: true,
        employee,
        userId: session.userId,
    };
}

/**
 * Fetch personal payslip history for the linked employee
 */
export async function getEmployeeSelfPayslips(shopId: string) {
    const { isLinked, employee } = await getCurrentEmployeeProfile(shopId);
    if (!isLinked || !employee) {
        return { success: false, payslips: [], error: "No linked employee profile found for your account." };
    }

    const payrollDocs = await db.query.documents.findMany({
        where: and(
            eq(documents.shopId, shopId),
            eq(documents.type, "PAYROLL_VOUCHER")
        ),
        orderBy: [desc(documents.issueDate)],
        with: {
            items: true,
        },
    });

    const payslips: ParsedPayslip[] = [];

    for (const doc of payrollDocs) {
        for (const item of doc.items) {
            if (
                item.description.toLowerCase().includes(employee.fullName.toLowerCase()) ||
                item.description.includes(employee.id)
            ) {
                const parsed = parsePayslipDescription(item.description);
                if (parsed) {
                    payslips.push({
                        voucherId: doc.id,
                        docNumber: doc.docNumber,
                        issueDate: doc.issueDate,
                        ...parsed,
                    });
                }
            }
        }
    }

    return { success: true, employee, payslips };
}

/**
 * Fetch personal expense reimbursement claims for the linked employee
 */
export async function getEmployeeSelfClaims(shopId: string) {
    const { isLinked, employee } = await getCurrentEmployeeProfile(shopId);
    if (!isLinked || !employee) {
        return { success: false, claims: [], error: "No linked employee profile found." };
    }

    const claims = await db.query.expenseClaims.findMany({
        where: and(
            eq(expenseClaims.shopId, shopId),
            eq(expenseClaims.employeeId, employee.id)
        ),
        with: {
            costCenter: true,
            approvedBy: true,
            disbursedExpense: true,
        },
        orderBy: [desc(expenseClaims.createdAt)],
    });

    return { success: true, employee, claims };
}

/**
 * Fetch employee self-service dashboard summary metrics
 */
export async function getEmployeeSelfDashboard(shopId: string) {
    const { isLinked, employee } = await getCurrentEmployeeProfile(shopId);
    if (!isLinked || !employee) {
        return { isLinked: false, employee: null };
    }

    const [payslipRes, claimsRes] = await Promise.all([
        getEmployeeSelfPayslips(shopId),
        getEmployeeSelfClaims(shopId),
    ]);

    const payslips = payslipRes.payslips || [];
    const claims = claimsRes.claims || [];

    const totalNetEarnings = payslips.reduce((sum, p) => sum + p.netPay, 0);
    const totalClaimsAmount = claims.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const totalReimbursed = claims
        .filter((c) => c.status === "DISBURSED")
        .reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const pendingClaimsCount = claims.filter(
        (c) => c.status === "SUBMITTED" || c.status === "DRAFT"
    ).length;

    const latestPayslip = payslips.length > 0 ? payslips[0] : null;

    return {
        isLinked: true,
        employee,
        summary: {
            totalNetEarnings,
            totalClaimsAmount,
            totalReimbursed,
            pendingClaimsCount,
            latestPayslip,
            payslipsCount: payslips.length,
            claimsCount: claims.length,
        },
        recentPayslips: payslips.slice(0, 5),
        recentClaims: claims.slice(0, 5),
    };
}
