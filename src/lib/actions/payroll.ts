// src/lib/actions/payroll.ts
"use server";

import { db } from "@/db";
import { employees, documents, documentItems, documentTokens, shops } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { computeKenyanDeductions, PayrollMode } from "@/lib/payroll-utils";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

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
    email?: string;
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
            email: formData.email?.trim() || null,
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
    email?: string;
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
                email: formData.email?.trim() || null,
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
    issueDate?: Date;
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
                issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
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
      period: periodMatch ? periodMatch[1].trim() : "",
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
  } catch (e) {
    return null;
  }
}

export async function emailPayslipsAction(voucherId: string, shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context." };

    try {
        const voucher = await db.query.documents.findFirst({
            where: and(eq(documents.id, voucherId), eq(documents.shopId, shopId), eq(documents.type, "PAYROLL_VOUCHER")),
            with: {
                items: true,
                shop: true,
            },
        });

        if (!voucher) {
            return { success: false, error: "Payroll voucher not found." };
        }

        const staffList = await db.query.employees.findMany({
            where: eq(employees.shopId, shopId),
        });

        const fromAddress = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
        let countSent = 0;
        let countSkipped = 0;

        for (const item of voucher.items) {
            const parsed = parsePayslipDescription(item.description);
            if (!parsed) {
                countSkipped++;
                continue;
            }

            const emp = staffList.find(e => e.fullName.toLowerCase().trim() === parsed.staffName.toLowerCase().trim());
            if (!emp || !emp.email) {
                countSkipped++;
                continue;
            }

            const grossSalary = parsed.baseSalary + parsed.allowances + parsed.commissions;

            const htmlContent = `
                <div style="font-family: monospace, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; background-color: #ffffff; color: #18181b;">
                    <div style="border-bottom: 2px solid #000000; padding-bottom: 16px; margin-bottom: 24px;">
                        <span style="font-size: 10px; color: #a1a1aa; text-transform: uppercase; font-weight: bold;">Official Payout Voucher Payslip</span>
                        <h2 style="font-family: sans-serif; font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 4px 0 0 0; color: #000000;">${voucher.shop.name}</h2>
                    </div>

                    <div style="margin-bottom: 24px; line-height: 1.5; font-size: 12px;">
                        <p style="margin: 4px 0;"><strong>Employee Name:</strong> ${emp.fullName}</p>
                        ${emp.nationalId ? `<p style="margin: 4px 0;"><strong>National ID:</strong> ${emp.nationalId}</p>` : ""}
                        ${emp.kraPin ? `<p style="margin: 4px 0;"><strong>KRA PIN:</strong> ${emp.kraPin}</p>` : ""}
                        <p style="margin: 4px 0;"><strong>Payroll Period:</strong> ${parsed.period}</p>
                        <p style="margin: 4px 0;"><strong>Voucher Reference:</strong> ${voucher.docNumber}</p>
                    </div>

                    <h3 style="font-family: sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 24px 0 8px 0; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; color: #000000;">1. Compensation & Additions</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
                        <tr style="border-b: 1px solid #f4f4f5;">
                            <td style="padding: 6px 0; color: #52525b;">Base Contractual Salary:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold;">${voucher.shop.currency} ${parsed.baseSalary.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-b: 1px solid #f4f4f5;">
                            <td style="padding: 6px 0; color: #52525b;">Allowances:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold;">${voucher.shop.currency} ${parsed.allowances.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-b: 1px solid #f4f4f5;">
                            <td style="padding: 6px 0; color: #52525b;">Commissions Earned:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold;">${voucher.shop.currency} ${parsed.commissions.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-top: 1px solid #000000;">
                            <td style="padding: 8px 0; font-weight: bold; color: #000000;">GROSS WAGES:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #000000;">${voucher.shop.currency} ${grossSalary.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    </table>

                    <h3 style="font-family: sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 24px 0 8px 0; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; color: #000000;">2. Statutory Reserves & Deductions</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
                        <tr style="border-b: 1px solid #f4f4f5;">
                            <td style="padding: 6px 0; color: #52525b;">PAYE (Income Tax):</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #e11d48;">-${voucher.shop.currency} ${parsed.paye.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-b: 1px solid #f4f4f5;">
                            <td style="padding: 6px 0; color: #52525b;">SHIF (Health Insurance):</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #e11d48;">-${voucher.shop.currency} ${parsed.shif.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-b: 1px solid #f4f4f5;">
                            <td style="padding: 6px 0; color: #52525b;">AHL (Housing Levy):</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #e11d48;">-${voucher.shop.currency} ${parsed.housingLevy.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-b: 1px solid #f4f4f5;">
                            <td style="padding: 6px 0; color: #52525b;">NSSF (Pension Fund):</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #e11d48;">-${voucher.shop.currency} ${parsed.nssf.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-b: 1px solid #f4f4f5;">
                            <td style="padding: 6px 0; color: #52525b;">Salary Advances / Customs:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #e11d48;">-${voucher.shop.currency} ${parsed.advance.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-top: 1px solid #000000;">
                            <td style="padding: 8px 0; font-weight: bold; color: #000000;">TOTAL DEDUCTIONS:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #e11d48;">-${voucher.shop.currency} ${parsed.totalDeductions.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    </table>

                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Net Cash Disbursed Take-home</span>
                        <span style="font-size: 20px; font-weight: 800; color: #047857;">${voucher.shop.currency} ${parsed.netPay.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div style="border-top: 1px dashed #e4e4e7; pt: 12px; text-align: center; font-size: 10px; color: #a1a1aa; line-height: 1.4;">
                        <p style="margin: 0;">This is a system-generated payslip matching your official employment contract.</p>
                        <p style="margin: 4px 0 0 0;">Manna Books ERP • Secure Ledger Node</p>
                    </div>
                </div>
            `;

            await resend.emails.send({
                from: fromAddress,
                to: emp.email,
                subject: `Manna Books Payslip - ${parsed.period} - ${parsed.staffName}`,
                html: htmlContent,
            });

            countSent++;
        }

        return { success: true, countSent, countSkipped };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to dispatch email payslips." };
    }
}