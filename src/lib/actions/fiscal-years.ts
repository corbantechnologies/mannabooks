"use server";

import { db } from "@/db";
import { fiscalYears, accountingPeriods, journalEntries, chartOfAccounts, shops } from "@/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";
import { createJournalEntry } from "./gl";

export async function getFiscalYears(shopId: string) {
    return db.query.fiscalYears.findMany({
        where: eq(fiscalYears.shopId, shopId),
        orderBy: (f, { desc }) => [desc(f.startDate)],
    });
}

export async function getActiveFiscalYear(shopId: string) {
    return db.query.fiscalYears.findFirst({
        where: and(eq(fiscalYears.shopId, shopId), eq(fiscalYears.isClosed, false)),
    });
}

export async function declareFiscalYear(shopId: string, shopSlug: string, data: {
    label: string;
    startDate: string;
    endDate: string;
}) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const label = data.label.trim();
        if (!label || !data.startDate || !data.endDate) {
            return { success: false, error: "Label, start date, and end date are required." };
        }

        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { success: false, error: "Invalid date formats." };
        }

        if (end <= start) {
            return { success: false, error: "End Date must be after Start Date." };
        }

        // 1. Enforce only one open fiscal year at a time
        const openFy = await db.query.fiscalYears.findFirst({
            where: and(eq(fiscalYears.shopId, shopId), eq(fiscalYears.isClosed, false)),
        });
        if (openFy) {
            return { success: false, error: `Only one fiscal year can be open at a time. Please close the active fiscal year "${openFy.label}" first.` };
        }

        // 2. Overlap check
        const allFy = await db.query.fiscalYears.findMany({
            where: eq(fiscalYears.shopId, shopId),
        });
        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];

        for (const fy of allFy) {
            if (startStr <= fy.endDate && endStr >= fy.startDate) {
                return { success: false, error: `The declared date range overlaps with an existing Fiscal Year: "${fy.label}" (${fy.startDate} to ${fy.endDate}).` };
            }
        }

        await db.transaction(async (tx) => {
            // 3. Create the Fiscal Year record
            const [createdFy] = await tx.insert(fiscalYears).values({
                shopId,
                label,
                startDate: startStr,
                endDate: endStr,
                isClosed: false,
            }).returning();

            // 4. Auto-generate monthly periods
            let current = new Date(start.getFullYear(), start.getMonth(), 1);
            while (current <= end) {
                const pStart = new Date(current.getFullYear(), current.getMonth(), 1);
                const actualStart = pStart < start ? start : pStart;
                
                const pEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
                const actualEnd = pEnd > end ? end : pEnd;

                const periodName = actualStart.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
                const actualStartStr = actualStart.toISOString().split("T")[0];

                const existing = await tx.query.accountingPeriods.findFirst({
                    where: and(
                        eq(accountingPeriods.shopId, shopId),
                        eq(accountingPeriods.startDate, actualStartStr)
                    ),
                });

                if (existing) {
                    await tx.update(accountingPeriods)
                        .set({ fiscalYearId: createdFy.id })
                        .where(eq(accountingPeriods.id, existing.id));
                } else {
                    await tx.insert(accountingPeriods).values({
                        shopId,
                        fiscalYearId: createdFy.id,
                        periodName,
                        startDate: actualStartStr,
                        endDate: actualEnd.toISOString().split("T")[0],
                        status: "OPEN",
                    });
                }

                current.setMonth(current.getMonth() + 1);
            }
        });

        revalidatePath(`/workspaces/${shopSlug}/finance/periods`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to declare fiscal year:", error);
        return { success: false, error: error.message || "Failed to declare fiscal year." };
    }
}

export async function closeFiscalYear(shopId: string, shopSlug: string, fyId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const fy = await db.query.fiscalYears.findFirst({
            where: and(eq(fiscalYears.id, fyId), eq(fiscalYears.shopId, shopId)),
            with: { periods: true },
        });
        if (!fy) return { success: false, error: "Fiscal Year not found." };
        if (fy.isClosed) return { success: false, error: "Fiscal Year is already closed." };

        // 1. Ensure all monthly periods within this fiscal year are CLOSED
        const openPeriods = fy.periods.filter(p => p.status === "OPEN");
        if (openPeriods.length > 0) {
            return {
                success: false,
                error: `All monthly periods must be closed first. The following periods are still open: ${openPeriods.map(p => p.periodName).join(", ")}.`
            };
        }

        // 2. Perform year-end closing entries:
        // Query Retained Earnings (3300). If not found, use Owner's Equity (3100)
        let retainedEarningsAccount = await db.query.chartOfAccounts.findFirst({
            where: and(eq(chartOfAccounts.shopId, shopId), eq(chartOfAccounts.code, "3300")),
        });
        if (!retainedEarningsAccount) {
            retainedEarningsAccount = await db.query.chartOfAccounts.findFirst({
                where: and(eq(chartOfAccounts.shopId, shopId), eq(chartOfAccounts.code, "3100")),
            });
        }
        if (!retainedEarningsAccount) {
            return { success: false, error: "Retained Earnings (3300) or Owner's Equity (3100) account not found in Chart of Accounts." };
        }

        const periodIds = fy.periods.map(p => p.id);
        if (periodIds.length > 0) {
            // Find all journal entries belonging to these periods
            const entries = await db.query.journalEntries.findMany({
                where: and(
                    eq(journalEntries.shopId, shopId),
                    inArray(journalEntries.periodId, periodIds)
                ),
            });

            // Calculate current net balance of each REVENUE and EXPENSE account
            const balanceMap: Record<string, { code: string; accountType: string; debits: number; credits: number }> = {};
            const accounts = await db.query.chartOfAccounts.findMany({ where: eq(chartOfAccounts.shopId, shopId) });
            accounts.forEach(acc => {
                balanceMap[acc.id] = { code: acc.code, accountType: acc.accountType, debits: 0, credits: 0 };
            });

            entries.forEach(je => {
                const amt = parseFloat(je.amount || "0");
                if (balanceMap[je.debitAccountId]) balanceMap[je.debitAccountId].debits += amt;
                if (balanceMap[je.creditAccountId]) balanceMap[je.creditAccountId].credits += amt;
            });

            const fyEnd = new Date(fy.endDate);

            // We close all REVENUE and EXPENSE accounts
            for (const [accountId, bal] of Object.entries(balanceMap)) {
                if (bal.accountType === "REVENUE") {
                    const balance = bal.credits - bal.debits;
                    if (Math.abs(balance) > 0.001) {
                        // Debit REVENUE, Credit Retained Earnings
                        await createJournalEntry({
                            shopId,
                            entryDate: fyEnd,
                            description: `Year-end closing entry: reset ${bal.code} to Retained Earnings`,
                            debitAccountCode: bal.code,
                            creditAccountCode: retainedEarningsAccount.code,
                            amount: Math.abs(balance),
                            sourceType: "manual",
                            createdById: session.userId,
                        });
                    }
                } else if (bal.accountType === "EXPENSE") {
                    const balance = bal.debits - bal.credits;
                    if (Math.abs(balance) > 0.001) {
                        // Credit EXPENSE, Debit Retained Earnings
                        await createJournalEntry({
                            shopId,
                            entryDate: fyEnd,
                            description: `Year-end closing entry: reset ${bal.code} to Retained Earnings`,
                            debitAccountCode: retainedEarningsAccount.code,
                            creditAccountCode: bal.code,
                            amount: Math.abs(balance),
                            sourceType: "manual",
                            createdById: session.userId,
                        });
                    }
                }
            }
        }

        // 3. Mark the Fiscal Year as CLOSED
        await db.update(fiscalYears)
            .set({ isClosed: true })
            .where(eq(fiscalYears.id, fyId));

        revalidatePath(`/workspaces/${shopSlug}/finance/periods`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to close fiscal year:", error);
        return { success: false, error: error.message || "Failed to close fiscal year." };
    }
}
