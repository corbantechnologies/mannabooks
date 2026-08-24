"use server";

import { db } from "@/db";
import { chartOfAccounts, accountingPeriods, journalEntries, shops, fiscalYears } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

import { DEFAULT_ACCOUNTS, EXPENSE_CATEGORY_ACCOUNT_MAP } from "../gl-constants";

// ================================================================
// GL ACTIVATION
// ================================================================

/**
 * Activates the General Ledger for a workspace.
 * Seeds the Chart of Accounts, creates the initial Fiscal Year and its monthly periods,
 * and enables GL onboarding mode to allow backdating.
 */
export async function activateGeneralLedger(
    shopId: string,
    shopSlug: string,
    fyData?: { label: string; startDate: string; endDate: string }
) {
    try {
        await enforcePermission(shopId, "manage_expenses"); // Owner/Admin only
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };
        if (shop.isGlEnabled) return { success: false, error: "GL is already activated for this workspace." };

        // Determine default fiscal year if not provided (e.g. current calendar year)
        const label = fyData?.label.trim() || `Fiscal Year ${new Date().getFullYear()}`;
        const start = fyData?.startDate ? new Date(fyData.startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = fyData?.endDate ? new Date(fyData.endDate) : new Date(new Date().getFullYear(), 11, 31);

        if (end <= start) {
            return { success: false, error: "End Date must be after Start Date." };
        }

        await db.transaction(async (tx) => {
            // 1. Seed Chart of Accounts if none exist
            const existingAccounts = await tx.query.chartOfAccounts.findFirst({
                where: eq(chartOfAccounts.shopId, shopId),
            });
            if (!existingAccounts) {
                await tx.insert(chartOfAccounts).values(
                    DEFAULT_ACCOUNTS.map(a => ({ ...a, shopId }))
                );
            }

            // 2. Create the Fiscal Year if none exists, or reuse an open one
            const openFy = await tx.query.fiscalYears.findFirst({
                where: and(
                    eq(fiscalYears.shopId, shopId),
                    eq(fiscalYears.isClosed, false)
                )
            });
            let targetFyId = openFy?.id;
            if (!openFy) {
                const existingFy = await tx.query.fiscalYears.findFirst({
                    where: and(
                        eq(fiscalYears.shopId, shopId),
                        eq(fiscalYears.label, label)
                    )
                });
                if (existingFy) {
                    targetFyId = existingFy.id;
                } else {
                    const [createdFy] = await tx.insert(fiscalYears).values({
                        shopId,
                        label,
                        startDate: start.toISOString().split("T")[0],
                        endDate: end.toISOString().split("T")[0],
                        isClosed: false,
                    }).returning();
                    targetFyId = createdFy.id;
                }
            }

            // 3. Auto-populate monthly accounting periods
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
                        .set({ fiscalYearId: targetFyId })
                        .where(eq(accountingPeriods.id, existing.id));
                } else {
                    await tx.insert(accountingPeriods).values({
                        shopId,
                        fiscalYearId: targetFyId,
                        periodName,
                        startDate: actualStartStr,
                        endDate: actualEnd.toISOString().split("T")[0],
                        status: "OPEN",
                    });
                }

                current.setMonth(current.getMonth() + 1);
            }

            // 4. Enable GL + onboarding mode
            await tx.update(shops).set({
                isGlEnabled: true,
                glOnboardingMode: true,
            }).where(eq(shops.id, shopId));
        });

        revalidatePath(`/workspaces/${shopSlug}/finance`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to activate GL:", error);
        return { success: false, error: error.message || "Failed to activate General Ledger." };
    }
}

/**
 * Disables GL onboarding mode (locks backdating to standard period rules).
 */
export async function disableGlOnboardingMode(shopId: string, shopSlug: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        await db.update(shops).set({ glOnboardingMode: false }).where(eq(shops.id, shopId));
        revalidatePath(`/workspaces/${shopSlug}/finance`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ================================================================
// CHART OF ACCOUNTS
// ================================================================

export async function getChartOfAccounts(shopId: string) {
    return db.query.chartOfAccounts.findMany({
        where: eq(chartOfAccounts.shopId, shopId),
        orderBy: (a, { asc }) => [asc(a.code)],
    });
}

export async function createAccount(shopId: string, shopSlug: string, data: {
    code: string;
    name: string;
    accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    parentCode?: string;
}) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const [account] = await db.insert(chartOfAccounts).values({
            shopId,
            code: data.code.trim(),
            name: data.name.trim(),
            accountType: data.accountType,
            parentCode: data.parentCode?.trim() || null,
            isSystem: false,
        }).returning();
        revalidatePath(`/workspaces/${shopSlug}/finance/accounts`);
        return { success: true, account };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create account." };
    }
}

export async function deleteAccount(shopId: string, shopSlug: string, accountId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const account = await db.query.chartOfAccounts.findFirst({
            where: and(eq(chartOfAccounts.id, accountId), eq(chartOfAccounts.shopId, shopId)),
        });
        if (!account) return { success: false, error: "Account not found." };
        if (account.isSystem) return { success: false, error: "System accounts cannot be deleted." };

        await db.delete(chartOfAccounts).where(and(eq(chartOfAccounts.id, accountId), eq(chartOfAccounts.shopId, shopId)));
        revalidatePath(`/workspaces/${shopSlug}/finance/accounts`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete account." };
    }
}

// ================================================================
// JOURNAL ENTRIES
// ================================================================

interface JournalEntryInput {
    shopId: string;
    entryDate: Date;
    description: string;
    debitAccountCode: string;
    creditAccountCode: string;
    amount: number;
    sourceType: "document" | "expense" | "income" | "payroll" | "manual" | "migrated";
    sourceId?: string;
    createdById?: string;
    isBackdated?: boolean;
    backdatedReason?: string;
}

/**
 * Core journal entry creation. Validates period status and backdating rules.
 * Can be called from other server actions (expenses, documents, payroll).
 */
export async function createJournalEntry(input: JournalEntryInput) {
    const shop = await db.query.shops.findFirst({ where: eq(shops.id, input.shopId) });
    if (!shop || !shop.isGlEnabled) return; // GL not active — silently skip

    // Find the matching accounts
    const [debitAccount, creditAccount] = await Promise.all([
        db.query.chartOfAccounts.findFirst({
            where: and(eq(chartOfAccounts.shopId, input.shopId), eq(chartOfAccounts.code, input.debitAccountCode)),
        }),
        db.query.chartOfAccounts.findFirst({
            where: and(eq(chartOfAccounts.shopId, input.shopId), eq(chartOfAccounts.code, input.creditAccountCode)),
        }),
    ]);

    if (!debitAccount || !creditAccount) return; // Accounts not found — skip

    // Find or determine period
    const entryDateStr = input.entryDate.toISOString().split("T")[0];
    let period = await db.query.accountingPeriods.findFirst({
        where: and(
            eq(accountingPeriods.shopId, input.shopId),
            lte(accountingPeriods.startDate, entryDateStr),
            gte(accountingPeriods.endDate, entryDateStr),
        ),
    });

    if (!period) {
        throw new Error(`No active accounting period found for date ${entryDateStr}. Transaction date must fall within a declared Fiscal Year.`);
    }

    // Validate period access
    if (period.status === "CLOSED") {
        // Only allow posting to closed periods in onboarding mode or for migrated entries
        const allowedToBackdate = shop.glOnboardingMode || input.sourceType === "migrated";
        if (!allowedToBackdate) {
            throw new Error(`Accounting period "${period.periodName}" is closed. Postings to closed periods are locked.`);
        }
    }

    await db.insert(journalEntries).values({
        shopId: input.shopId,
        periodId: period.id,
        entryDate: input.entryDate,
        description: input.description,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        amount: input.amount.toFixed(2),
        sourceType: input.sourceType,
        sourceId: input.sourceId || null,
        createdById: input.createdById || null,
        isBackdated: input.isBackdated || false,
        backdatedReason: input.backdatedReason || null,
    });
}

export async function getJournalEntries(shopId: string, filters?: {
    accountId?: string;
    periodId?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    return db.query.journalEntries.findMany({
        where: eq(journalEntries.shopId, shopId),
        with: {
            debitAccount: true,
            creditAccount: true,
            period: true,
            createdBy: true,
        },
        orderBy: (j, { desc }) => [desc(j.entryDate), desc(j.createdAt)],
    });
}

// ================================================================
// ACCOUNTING PERIODS
// ================================================================

export async function getAccountingPeriods(shopId: string) {
    return db.query.accountingPeriods.findMany({
        where: eq(accountingPeriods.shopId, shopId),
        with: { closedBy: true, fiscalYear: true },
        orderBy: (p, { desc }) => [desc(p.startDate)],
    });
}

/**
 * Ensures an accounting period exists for the given month.
 * Creates it if it doesn't yet exist.
 */
export async function ensureAccountingPeriod(shopId: string, date: Date): Promise<string | null> {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const startStr = start.toISOString().split("T")[0];

    const existing = await db.query.accountingPeriods.findFirst({
        where: and(eq(accountingPeriods.shopId, shopId), eq(accountingPeriods.startDate, startStr)),
    });

    if (existing) return existing.id;

    throw new Error(`Accounting period starting ${startStr} is not defined. Please declare a Fiscal Year covering this period.`);
}

export async function closePeriod(shopId: string, shopSlug: string, periodId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        await db.update(accountingPeriods).set({
            status: "CLOSED",
            closedAt: new Date(),
            closedById: session.userId,
        }).where(and(eq(accountingPeriods.id, periodId), eq(accountingPeriods.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/finance/periods`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function reopenPeriod(shopId: string, shopSlug: string, periodId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        await db.update(accountingPeriods).set({
            status: "OPEN",
            closedAt: null,
            closedById: null,
        }).where(and(eq(accountingPeriods.id, periodId), eq(accountingPeriods.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/finance/periods`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ================================================================
// OPENING BALANCES
// ================================================================

export interface OpeningBalanceLine {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    debitBalance: number;  // Enter as positive; system posts as DR
    creditBalance: number; // Enter as positive; system posts as CR
}

/**
 * Posts opening balance journal entries for all accounts.
 * Uses account 3200 "Opening Balances" as the contra account.
 * Each line creates one DR or CR journal entry.
 *
 * Standard convention:
 *   Assets/Expenses with positive balance → DR Account / CR Opening Balances
 *   Liabilities/Equity/Revenue with positive balance → DR Opening Balances / CR Account
 */
export async function postOpeningBalances(
    shopId: string,
    shopSlug: string,
    asOfDate: Date,
    lines: Array<{ accountId: string; accountCode: string; debitAmount: number; creditAmount: number }>
) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop?.isGlEnabled) return { success: false, error: "GL not activated." };

        // Find the Opening Balances contra account (3200)
        const openingBalancesAccount = await db.query.chartOfAccounts.findFirst({
            where: and(eq(chartOfAccounts.shopId, shopId), eq(chartOfAccounts.code, "3200")),
        });
        if (!openingBalancesAccount) return { success: false, error: "Opening Balances account (3200) not found in Chart of Accounts." };

        let posted = 0;
        for (const line of lines) {
            const targetAccount = await db.query.chartOfAccounts.findFirst({
                where: and(eq(chartOfAccounts.id, line.accountId), eq(chartOfAccounts.shopId, shopId)),
            });
            if (!targetAccount) continue;

            // Post debit-side opening balance
            if (line.debitAmount > 0) {
                await createJournalEntry({
                    shopId,
                    entryDate: asOfDate,
                    description: `Opening Balance: ${targetAccount.name} (as of ${asOfDate.toLocaleDateString("en-KE")})`,
                    debitAccountCode: targetAccount.code,
                    creditAccountCode: "3200",
                    amount: line.debitAmount,
                    sourceType: "manual",
                    createdById: session.userId,
                    isBackdated: asOfDate < new Date(),
                    backdatedReason: "GL onboarding — opening balance",
                });
                posted++;
            }

            // Post credit-side opening balance
            if (line.creditAmount > 0) {
                await createJournalEntry({
                    shopId,
                    entryDate: asOfDate,
                    description: `Opening Balance: ${targetAccount.name} (as of ${asOfDate.toLocaleDateString("en-KE")})`,
                    debitAccountCode: "3200",
                    creditAccountCode: targetAccount.code,
                    amount: line.creditAmount,
                    sourceType: "manual",
                    createdById: session.userId,
                    isBackdated: asOfDate < new Date(),
                    backdatedReason: "GL onboarding — opening balance",
                });
                posted++;
            }
        }

        revalidatePath(`/workspaces/${shopSlug}/finance`);
        return { success: true, posted };
    } catch (error: any) {
        console.error("Opening balance error:", error);
        return { success: false, error: error.message || "Failed to post opening balances." };
    }
}

// ================================================================
// MANUAL JOURNAL ENTRIES (Option B — historical transaction entry)
// ================================================================

export async function postManualJournalEntry(
    shopId: string,
    shopSlug: string,
    data: {
        entryDate: Date;
        description: string;
        debitAccountId: string;
        creditAccountId: string;
        amount: number;
        isBackdated?: boolean;
        backdatedReason?: string;
    }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop?.isGlEnabled) return { success: false, error: "GL not activated." };

        const [debitAccount, creditAccount] = await Promise.all([
            db.query.chartOfAccounts.findFirst({ where: and(eq(chartOfAccounts.id, data.debitAccountId), eq(chartOfAccounts.shopId, shopId)) }),
            db.query.chartOfAccounts.findFirst({ where: and(eq(chartOfAccounts.id, data.creditAccountId), eq(chartOfAccounts.shopId, shopId)) }),
        ]);

        if (!debitAccount || !creditAccount) return { success: false, error: "One or both accounts not found." };
        if (debitAccount.id === creditAccount.id) return { success: false, error: "Debit and credit accounts must be different." };
        if (data.amount <= 0) return { success: false, error: "Amount must be greater than zero." };

        await createJournalEntry({
            shopId,
            entryDate: data.entryDate,
            description: data.description,
            debitAccountCode: debitAccount.code,
            creditAccountCode: creditAccount.code,
            amount: data.amount,
            sourceType: "manual",
            createdById: session.userId,
            isBackdated: data.isBackdated || data.entryDate < new Date(new Date().setHours(0, 0, 0, 0)),
            backdatedReason: data.backdatedReason || (data.entryDate < new Date() ? "Manual historical entry" : undefined),
        });

        revalidatePath(`/workspaces/${shopSlug}/finance/ledger`);
        return { success: true };
    } catch (error: any) {
        console.error("Manual journal entry error:", error);
        return { success: false, error: error.message || "Failed to post journal entry." };
    }
}
