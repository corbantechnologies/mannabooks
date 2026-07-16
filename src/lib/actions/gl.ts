"use server";

import { db } from "@/db";
import { chartOfAccounts, accountingPeriods, journalEntries, shops } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

// ================================================================
// DEFAULT CHART OF ACCOUNTS (seeded on GL activation)
// ================================================================
export const DEFAULT_ACCOUNTS = [
    { code: "1100", name: "Accounts Receivable",   accountType: "ASSET"     as const, isSystem: true },
    { code: "1200", name: "Cash & Bank",            accountType: "ASSET"     as const, isSystem: true },
    { code: "1300", name: "Inventory",              accountType: "ASSET"     as const, isSystem: true },
    { code: "2100", name: "Accounts Payable",       accountType: "LIABILITY" as const, isSystem: true },
    { code: "2200", name: "Payroll Payable",        accountType: "LIABILITY" as const, isSystem: true },
    { code: "3100", name: "Owner's Equity",         accountType: "EQUITY"    as const, isSystem: true },
    { code: "4100", name: "Sales Revenue",          accountType: "REVENUE"   as const, isSystem: true },
    { code: "4200", name: "Non-Operating Income",   accountType: "REVENUE"   as const, isSystem: true },
    { code: "5100", name: "Cost of Goods Sold",     accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6100", name: "Rent & Lease",           accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6200", name: "Utilities",              accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6300", name: "Salaries & Wages",       accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6400", name: "Fuel & Travel",          accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6500", name: "Marketing & Ads",        accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6600", name: "Office Supplies",        accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6900", name: "Other Expenses",         accountType: "EXPENSE"   as const, isSystem: true },
];

// Map expense categories to GL account codes
export const EXPENSE_CATEGORY_ACCOUNT_MAP: Record<string, string> = {
    RENT: "6100",
    UTILITIES: "6200",
    SALARIES: "6300",
    FUEL: "6400",
    MARKETING: "6500",
    OFFICE_SUPPLIES: "6600",
    OTHER: "6900",
};

// ================================================================
// GL ACTIVATION
// ================================================================

/**
 * Activates the General Ledger for a workspace.
 * Seeds the Chart of Accounts, creates the current accounting period,
 * and enables GL onboarding mode to allow backdating.
 */
export async function activateGeneralLedger(shopId: string, shopSlug: string) {
    try {
        await enforcePermission(shopId, "manage_expenses"); // Owner/Admin only
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };
        if (shop.isGlEnabled) return { success: false, error: "GL is already activated for this workspace." };

        await db.transaction(async (tx) => {
            // 1. Seed Chart of Accounts
            await tx.insert(chartOfAccounts).values(
                DEFAULT_ACCOUNTS.map(a => ({ ...a, shopId }))
            );

            // 2. Create current accounting period
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const periodName = now.toLocaleDateString("en-KE", { month: "long", year: "numeric" });

            await tx.insert(accountingPeriods).values({
                shopId,
                periodName,
                startDate: start.toISOString().split("T")[0],
                endDate: end.toISOString().split("T")[0],
                status: "OPEN",
            });

            // 3. Enable GL + onboarding mode (allows backdating for historical data entry)
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

    // Validate period access
    if (period?.status === "CLOSED") {
        // Only allow posting to closed periods in onboarding mode or for migrated entries
        const allowedToBackdate = shop.glOnboardingMode || input.sourceType === "migrated";
        if (!allowedToBackdate && !input.isBackdated) {
            console.warn(`Attempted to post to closed period ${period.periodName} — rejected.`);
            return;
        }
    }

    await db.insert(journalEntries).values({
        shopId: input.shopId,
        periodId: period?.id || null,
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
        with: { closedBy: true },
        orderBy: (p, { desc }) => [desc(p.startDate)],
    });
}

/**
 * Ensures an accounting period exists for the given month.
 * Creates it if it doesn't yet exist.
 */
export async function ensureAccountingPeriod(shopId: string, date: Date): Promise<string | null> {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const existing = await db.query.accountingPeriods.findFirst({
        where: and(eq(accountingPeriods.shopId, shopId), eq(accountingPeriods.startDate, startStr)),
    });

    if (existing) return existing.id;

    const periodName = date.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
    const [created] = await db.insert(accountingPeriods).values({
        shopId,
        periodName,
        startDate: startStr,
        endDate: endStr,
        status: "OPEN",
    }).returning();

    return created.id;
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
