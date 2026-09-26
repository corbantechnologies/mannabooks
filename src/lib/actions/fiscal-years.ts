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

export async function getFiscalYearDetails(shopId: string, fyId: string) {
    try {
        const fy = await db.query.fiscalYears.findFirst({
            where: and(eq(fiscalYears.id, fyId), eq(fiscalYears.shopId, shopId)),
            with: {
                periods: {
                    with: {
                        closedBy: true,
                    },
                    orderBy: (p, { asc }) => [asc(p.startDate)],
                },
            },
        });

        if (!fy) {
            return { success: false, error: "Fiscal Year not found." };
        }

        // Calendar days calculations
        const startDate = new Date(fy.startDate);
        const endDate = new Date(fy.endDate);
        const now = new Date();
        const totalDurationMs = Math.max(1, endDate.getTime() - startDate.getTime() + 86400000);
        const daysTotal = Math.round(totalDurationMs / (1000 * 60 * 60 * 24));
        const elapsedMs = Math.max(0, Math.min(now.getTime() - startDate.getTime(), totalDurationMs));
        const daysElapsed = Math.round(elapsedMs / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, daysTotal - daysElapsed);
        const calendarProgressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / daysTotal) * 100)));

        // Retained Earnings account check
        let retainedEarningsAccount = await db.query.chartOfAccounts.findFirst({
            where: and(eq(chartOfAccounts.shopId, shopId), eq(chartOfAccounts.code, "3300")),
        });
        if (!retainedEarningsAccount) {
            retainedEarningsAccount = await db.query.chartOfAccounts.findFirst({
                where: and(eq(chartOfAccounts.shopId, shopId), eq(chartOfAccounts.code, "3100")),
            });
        }

        const periodIds = fy.periods.map(p => p.id);
        const entries = periodIds.length > 0
            ? await db.query.journalEntries.findMany({
                where: and(
                    eq(journalEntries.shopId, shopId),
                    inArray(journalEntries.periodId, periodIds)
                ),
                with: {
                    debitAccount: true,
                    creditAccount: true,
                    createdBy: true,
                },
                orderBy: (j, { asc }) => [asc(j.entryDate)],
            })
            : [];

        // Aggregators for top revenue & expense accounts
        const revenueAccountsMap: Record<string, { code: string; name: string; amount: number }> = {};
        const expenseAccountsMap: Record<string, { code: string; name: string; amount: number }> = {};

        // Period-specific map
        type PeriodStat = {
            revenue: number;
            expenses: number;
            totalDebits: number;
            totalCredits: number;
            entryCount: number;
            sourceCounts: Record<string, number>;
            revenueByAcc: Record<string, { code: string; name: string; amount: number }>;
            expenseByAcc: Record<string, { code: string; name: string; amount: number }>;
        };

        const periodStatsMap: Record<string, PeriodStat> = {};
        for (const p of fy.periods) {
            periodStatsMap[p.id] = {
                revenue: 0,
                expenses: 0,
                totalDebits: 0,
                totalCredits: 0,
                entryCount: 0,
                sourceCounts: { document: 0, expense: 0, income: 0, payroll: 0, manual: 0, migrated: 0 },
                revenueByAcc: {},
                expenseByAcc: {},
            };
        }

        let totalDebits = 0;
        let totalCredits = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;

        for (const entry of entries) {
            const amt = parseFloat(entry.amount || "0");
            const isClosingEntry = entry.description.startsWith("Year-end closing entry:");

            const pStat = entry.periodId ? periodStatsMap[entry.periodId] : null;

            totalDebits += amt;
            totalCredits += amt;
            if (pStat) {
                pStat.totalDebits += amt;
                pStat.totalCredits += amt;
                pStat.entryCount += 1;
                const src = entry.sourceType || "manual";
                pStat.sourceCounts[src] = (pStat.sourceCounts[src] || 0) + 1;
            }

            // Exclude closing entries from operating revenue and expense calculations
            if (!isClosingEntry) {
                // Revenue tracking
                if (entry.creditAccount?.accountType === "REVENUE") {
                    totalRevenue += amt;
                    const code = entry.creditAccount.code;
                    const name = entry.creditAccount.name;
                    if (!revenueAccountsMap[code]) revenueAccountsMap[code] = { code, name, amount: 0 };
                    revenueAccountsMap[code].amount += amt;

                    if (pStat) {
                        pStat.revenue += amt;
                        if (!pStat.revenueByAcc[code]) pStat.revenueByAcc[code] = { code, name, amount: 0 };
                        pStat.revenueByAcc[code].amount += amt;
                    }
                } else if (entry.debitAccount?.accountType === "REVENUE") {
                    totalRevenue -= amt;
                    const code = entry.debitAccount.code;
                    const name = entry.debitAccount.name;
                    if (!revenueAccountsMap[code]) revenueAccountsMap[code] = { code, name, amount: 0 };
                    revenueAccountsMap[code].amount -= amt;

                    if (pStat) {
                        pStat.revenue -= amt;
                        if (!pStat.revenueByAcc[code]) pStat.revenueByAcc[code] = { code, name, amount: 0 };
                        pStat.revenueByAcc[code].amount -= amt;
                    }
                }

                // Expense tracking
                if (entry.debitAccount?.accountType === "EXPENSE") {
                    totalExpenses += amt;
                    const code = entry.debitAccount.code;
                    const name = entry.debitAccount.name;
                    if (!expenseAccountsMap[code]) expenseAccountsMap[code] = { code, name, amount: 0 };
                    expenseAccountsMap[code].amount += amt;

                    if (pStat) {
                        pStat.expenses += amt;
                        if (!pStat.expenseByAcc[code]) pStat.expenseByAcc[code] = { code, name, amount: 0 };
                        pStat.expenseByAcc[code].amount += amt;
                    }
                } else if (entry.creditAccount?.accountType === "EXPENSE") {
                    totalExpenses -= amt;
                    const code = entry.creditAccount.code;
                    const name = entry.creditAccount.name;
                    if (!expenseAccountsMap[code]) expenseAccountsMap[code] = { code, name, amount: 0 };
                    expenseAccountsMap[code].amount -= amt;

                    if (pStat) {
                        pStat.expenses -= amt;
                        if (!pStat.expenseByAcc[code]) pStat.expenseByAcc[code] = { code, name, amount: 0 };
                        pStat.expenseByAcc[code].amount -= amt;
                    }
                }
            }
        }

        const netProfit = totalRevenue - totalExpenses;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const closedPeriodsCount = fy.periods.filter(p => p.status === "CLOSED").length;
        const totalPeriodsCount = fy.periods.length;
        const lockProgressPercent = totalPeriodsCount > 0 ? Math.round((closedPeriodsCount / totalPeriodsCount) * 100) : 0;

        // Top Revenue Accounts
        const topRevenueAccounts = Object.values(revenueAccountsMap)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(acc => ({
                ...acc,
                percentage: totalRevenue > 0 ? Math.max(0, (acc.amount / totalRevenue) * 100) : 0,
            }));

        // Top Expense Accounts
        const topExpenseAccounts = Object.values(expenseAccountsMap)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(acc => ({
                ...acc,
                percentage: totalExpenses > 0 ? Math.max(0, (acc.amount / totalExpenses) * 100) : 0,
            }));

        // Build Periods list with metrics
        const formattedPeriods = fy.periods.map((p, idx) => {
            const stat = periodStatsMap[p.id];
            const pNet = stat.revenue - stat.expenses;
            const pMargin = stat.revenue > 0 ? (pNet / stat.revenue) * 100 : 0;
            const isBalanced = Math.abs(stat.totalDebits - stat.totalCredits) < 0.01;

            const topExpenses = Object.values(stat.expenseByAcc)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3);

            const topRevenue = Object.values(stat.revenueByAcc)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3);

            return {
                id: p.id,
                periodName: p.periodName,
                monthIndex: idx + 1,
                startDate: p.startDate,
                endDate: p.endDate,
                status: p.status as "OPEN" | "CLOSED",
                closedAt: p.closedAt ? p.closedAt.toISOString() : null,
                closedByName: p.closedBy ? p.closedBy.name : null,
                revenue: stat.revenue,
                expenses: stat.expenses,
                netProfit: pNet,
                netMargin: pMargin,
                totalDebits: stat.totalDebits,
                totalCredits: stat.totalCredits,
                isBalanced,
                entryCount: stat.entryCount,
                sourceCounts: {
                    document: stat.sourceCounts.document || 0,
                    expense: stat.sourceCounts.expense || 0,
                    income: stat.sourceCounts.income || 0,
                    payroll: stat.sourceCounts.payroll || 0,
                    manual: stat.sourceCounts.manual || 0,
                    migrated: stat.sourceCounts.migrated || 0,
                },
                topExpenses,
                topRevenue,
            };
        });

        // Group into Quarters (Q1: months 1-3, Q2: 4-6, Q3: 7-9, Q4: 10-12)
        const quarters = [
            { name: "Q1", range: [0, 3], label: "Quarter 1 (Months 1–3)" },
            { name: "Q2", range: [3, 6], label: "Quarter 2 (Months 4–6)" },
            { name: "Q3", range: [6, 9], label: "Quarter 3 (Months 7–9)" },
            { name: "Q4", range: [9, 12], label: "Quarter 4 (Months 10–12)" },
        ].map(qDef => {
            const qPeriods = formattedPeriods.slice(qDef.range[0], qDef.range[1]);
            const qRev = qPeriods.reduce((sum, p) => sum + p.revenue, 0);
            const qExp = qPeriods.reduce((sum, p) => sum + p.expenses, 0);
            const qEntries = qPeriods.reduce((sum, p) => sum + p.entryCount, 0);
            const allClosed = qPeriods.length > 0 && qPeriods.every(p => p.status === "CLOSED");
            const noneClosed = qPeriods.every(p => p.status === "OPEN");

            return {
                quarter: qDef.name,
                label: qDef.label,
                months: qPeriods.map(p => p.periodName),
                revenue: qRev,
                expenses: qExp,
                netProfit: qRev - qExp,
                entryCount: qEntries,
                status: allClosed ? ("ALL_CLOSED" as const) : noneClosed ? ("OPEN" as const) : ("PARTIAL" as const),
            };
        });

        const unclosedPeriodNames = fy.periods.filter(p => p.status === "OPEN").map(p => p.periodName);
        const allPeriodsClosed = unclosedPeriodNames.length === 0;

        return {
            success: true,
            data: {
                fiscalYear: {
                    id: fy.id,
                    label: fy.label,
                    startDate: fy.startDate,
                    endDate: fy.endDate,
                    isClosed: fy.isClosed,
                    daysTotal,
                    daysElapsed,
                    daysRemaining,
                    progressPercent: calendarProgressPercent,
                },
                kpis: {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    netMargin,
                    totalDebits,
                    totalCredits,
                    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
                    totalEntries: entries.length,
                    closedPeriodsCount,
                    totalPeriodsCount,
                    lockProgressPercent,
                },
                quarters,
                topRevenueAccounts,
                topExpenseAccounts,
                periods: formattedPeriods,
                closingChecklist: {
                    allPeriodsClosed,
                    unclosedCount: unclosedPeriodNames.length,
                    unclosedPeriodNames,
                    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
                    retainedEarningsAccount: retainedEarningsAccount ? { code: retainedEarningsAccount.code, name: retainedEarningsAccount.name } : null,
                    canCloseYear: allPeriodsClosed && !!retainedEarningsAccount && !fy.isClosed,
                },
            },
        };
    } catch (error: any) {
        console.error("Failed to load fiscal year details:", error);
        return { success: false, error: error.message || "Failed to load fiscal year details." };
    }
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
        revalidatePath(`/workspaces/${shopSlug}/finance/fiscal-years/${fyId}`);
        revalidatePath(`/workspaces/${shopSlug}/finance/tax/settings`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to close fiscal year:", error);
        return { success: false, error: error.message || "Failed to close fiscal year." };
    }
}

export async function reopenFiscalYear(shopId: string, shopSlug: string, fyId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const fy = await db.query.fiscalYears.findFirst({
            where: and(eq(fiscalYears.id, fyId), eq(fiscalYears.shopId, shopId)),
            with: { periods: true },
        });
        if (!fy) return { success: false, error: "Fiscal Year not found." };
        if (!fy.isClosed) return { success: false, error: "Fiscal Year is already open." };

        // Ensure no other fiscal year is currently open
        const openFy = await db.query.fiscalYears.findFirst({
            where: and(eq(fiscalYears.shopId, shopId), eq(fiscalYears.isClosed, false)),
        });
        if (openFy) {
            return {
                success: false,
                error: `Cannot reopen "${fy.label}". Fiscal Year "${openFy.label}" is currently open. Only one fiscal year can be open at a time.`,
            };
        }

        const periodIds = fy.periods.map(p => p.id);

        await db.transaction(async (tx) => {
            // Delete the automated year-end closing entries that were generated when closing
            if (periodIds.length > 0) {
                const closingEntries = await tx.query.journalEntries.findMany({
                    where: and(
                        eq(journalEntries.shopId, shopId),
                        inArray(journalEntries.periodId, periodIds)
                    ),
                });

                const closingEntryIds = closingEntries
                    .filter(e => e.description.startsWith("Year-end closing entry:"))
                    .map(e => e.id);

                if (closingEntryIds.length > 0) {
                    await tx.delete(journalEntries).where(
                        and(
                            eq(journalEntries.shopId, shopId),
                            inArray(journalEntries.id, closingEntryIds)
                        )
                    );
                }
            }

            // Mark Fiscal Year as OPEN
            await tx.update(fiscalYears)
                .set({ isClosed: false })
                .where(eq(fiscalYears.id, fyId));
        });

        revalidatePath(`/workspaces/${shopSlug}/finance/periods`);
        revalidatePath(`/workspaces/${shopSlug}/finance/fiscal-years/${fyId}`);
        revalidatePath(`/workspaces/${shopSlug}/finance/tax/settings`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to reopen fiscal year:", error);
        return { success: false, error: error.message || "Failed to reopen fiscal year." };
    }
}

export async function deleteFiscalYear(shopId: string, shopSlug: string, fyId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const fy = await db.query.fiscalYears.findFirst({
            where: and(eq(fiscalYears.id, fyId), eq(fiscalYears.shopId, shopId)),
            with: { periods: true },
        });
        if (!fy) return { success: false, error: "Fiscal Year not found." };

        const periodIds = fy.periods.map(p => p.id);

        await db.transaction(async (tx) => {
            // 1. Delete all journal entries belonging to the periods of this fiscal year first
            if (periodIds.length > 0) {
                await tx.delete(journalEntries).where(
                    and(
                        eq(journalEntries.shopId, shopId),
                        inArray(journalEntries.periodId, periodIds)
                    )
                );
            }

            // 2. Perform deletion (cascade deletes the periods)
            await tx.delete(fiscalYears).where(eq(fiscalYears.id, fyId));
        });

        revalidatePath(`/workspaces/${shopSlug}/finance/periods`);
        revalidatePath(`/workspaces/${shopSlug}/finance/tax/settings`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete fiscal year:", error);
        return { success: false, error: error.message || "Failed to delete fiscal year." };
    }
}
