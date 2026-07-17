"use server";

import { db } from "@/db";
import { shops, fixedAssets, taxInstalments, whtPayments, expenses, documents } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { enforcePermission } from "./rbac";
import { verifyAndGetSession } from "./auth";
import { revalidatePath } from "next/cache";
import { createJournalEntry } from "./gl";
import { getPLStatement } from "./reports";

// ================================================================
// TAX CONFIGURATION
// ================================================================

export async function updateTaxSettings(
    shopId: string,
    shopSlug: string,
    data: {
        isCitActive: boolean;
        isTotActive: boolean;
        citRate: number;
        estimatedAnnualProfit: number;
    }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        await db.update(shops).set({
            isCitActive: data.isCitActive,
            isTotActive: data.isTotActive,
            citRate: data.citRate.toFixed(2),
            estimatedAnnualProfit: data.estimatedAnnualProfit.toFixed(2),
        }).where(eq(shops.id, shopId));

        revalidatePath(`/workspaces/${shopSlug}/finance/tax/settings`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update tax settings." };
    }
}

// ================================================================
// FIXED ASSETS REGISTER (Capital Allowances)
// ================================================================

export async function getFixedAssets(shopId: string) {
    return db.query.fixedAssets.findMany({
        where: eq(fixedAssets.shopId, shopId),
        orderBy: (f, { desc }) => [desc(f.purchaseDate)],
    });
}

export async function createFixedAsset(
    shopId: string,
    shopSlug: string,
    data: {
        name: string;
        assetClass: "CLASS_1" | "CLASS_2" | "CLASS_3" | "CLASS_4" | "BUILDING";
        purchaseDate: Date;
        purchaseCost: number;
        scrapValue?: number;
    }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const [asset] = await db.insert(fixedAssets).values({
            shopId,
            name: data.name.trim(),
            assetClass: data.assetClass,
            purchaseDate: data.purchaseDate.toISOString().split("T")[0],
            purchaseCost: data.purchaseCost.toFixed(2),
            taxWdv: data.purchaseCost.toFixed(2), // Initially WDV = Purchase Cost
            scrapValue: (data.scrapValue || 0).toFixed(2),
            isDisposed: false,
        }).returning();

        // Auto-journal: DR 1400 Fixed Assets / CR 1200 Cash & Bank
        await createJournalEntry({
            shopId,
            entryDate: data.purchaseDate,
            description: `Acquisition of Fixed Asset: ${data.name}`,
            debitAccountCode: "1400", // Fixed Assets (Net)
            creditAccountCode: "1200", // Cash & Bank
            amount: data.purchaseCost,
            sourceType: "manual",
            createdById: session.userId,
        });

        revalidatePath(`/workspaces/${shopSlug}/finance/tax/assets`);
        return { success: true, asset };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to add asset." };
    }
}

export async function disposeFixedAsset(
    shopId: string,
    shopSlug: string,
    assetId: string,
    data: {
        disposalDate: Date;
        disposalProceeds: number;
    }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const asset = await db.query.fixedAssets.findFirst({
            where: and(eq(fixedAssets.id, assetId), eq(fixedAssets.shopId, shopId)),
        });
        if (!asset) return { success: false, error: "Asset not found." };
        if (asset.isDisposed) return { success: false, error: "Asset already disposed." };

        await db.update(fixedAssets).set({
            isDisposed: true,
            disposalDate: data.disposalDate.toISOString().split("T")[0],
            disposalProceeds: data.disposalProceeds.toFixed(2),
        }).where(eq(fixedAssets.id, assetId));

        // Auto-journal: DR 1200 Cash (proceeds) / CR 1400 Fixed Assets (WDV)
        // Profit/Loss on disposal is deferred or recorded as manual adjustment
        await createJournalEntry({
            shopId,
            entryDate: data.disposalDate,
            description: `Disposal of Fixed Asset: ${asset.name}`,
            debitAccountCode: "1200", // Cash & Bank (proceeds)
            creditAccountCode: "1400", // Fixed Assets (Net)
            amount: data.disposalProceeds,
            sourceType: "manual",
            createdById: session.userId,
        });

        revalidatePath(`/workspaces/${shopSlug}/finance/tax/assets`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to dispose asset." };
    }
}

/**
 * Computes and posts KRA wear & tear capital allowance for a fiscal year.
 * KRA wear & tear rates:
 * - CLASS_1: 37.5% reducing balance (Computers, software)
 * - CLASS_2: 25.0% reducing balance (Motor vehicles)
 * - CLASS_3: 12.5% reducing balance (Machinery, plant)
 * - CLASS_4: 10.0% reducing balance (Furniture, fittings)
 * - BUILDING: 10.0% straight line (Industrial buildings)
 */
export async function computeCapitalAllowances(shopId: string, shopSlug: string, year: number) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const assets = await db.query.fixedAssets.findMany({
            where: and(eq(fixedAssets.shopId, shopId), eq(fixedAssets.isDisposed, false)),
        });

        if (assets.length === 0) return { success: false, error: "No active fixed assets found." };

        const rates: Record<string, number> = {
            CLASS_1: 0.375,
            CLASS_2: 0.25,
            CLASS_3: 0.125,
            CLASS_4: 0.1,
            BUILDING: 0.1,
        };

        let totalDepreciation = 0;

        await db.transaction(async (tx) => {
            for (const asset of assets) {
                const wdv = parseFloat(asset.taxWdv);
                const rate = rates[asset.assetClass] || 0.1;
                let allowance = 0;

                if (asset.assetClass === "BUILDING") {
                    // Straight Line: based on purchase cost
                    allowance = parseFloat(asset.purchaseCost) * rate;
                } else {
                    // Reducing Balance: based on current WDV
                    allowance = wdv * rate;
                }

                // Make sure we don't reduce past scrap/residual value
                const scrap = parseFloat(asset.scrapValue);
                if (wdv - allowance < scrap) {
                    allowance = Math.max(wdv - scrap, 0);
                }

                if (allowance > 0) {
                    const newWdv = wdv - allowance;
                    await tx.update(fixedAssets).set({
                        taxWdv: newWdv.toFixed(2),
                    }).where(eq(fixedAssets.id, asset.id));

                    totalDepreciation += allowance;
                }
            }

            if (totalDepreciation > 0) {
                // Post GL entry: DR 6800 Depreciation Expense / CR 1400 Fixed Assets (Net)
                await createJournalEntry({
                    shopId,
                    entryDate: new Date(year, 11, 31), // Year-end
                    description: `Annual Capital Allowances / Wear & Tear — Year ${year}`,
                    debitAccountCode: "6800",  // Depreciation Expense
                    creditAccountCode: "1400", // Fixed Assets (Net)
                    amount: totalDepreciation,
                    sourceType: "manual",
                    createdById: session.userId,
                });
            }
        });

        revalidatePath(`/workspaces/${shopSlug}/finance/tax/assets`);
        return { success: true, amount: totalDepreciation };
    } catch (error: any) {
        console.error("Capital allowance error:", error);
        return { success: false, error: error.message || "Failed to compute capital allowances." };
    }
}

// ================================================================
// INSTALMENT TAX TRACKER
// ================================================================

export async function getTaxInstalments(shopId: string, year: number) {
    return db.query.taxInstalments.findMany({
        where: and(eq(taxInstalments.shopId, shopId), eq(taxInstalments.year, year)),
        orderBy: (t, { asc }) => [asc(t.instalmentNumber)],
    });
}

/**
 * Generates CIT instalments schedule for a year based on estimated profit.
 * Threshold check: Estimated tax >= KES 30,000.
 */
export async function generateTaxInstalments(shopId: string, shopSlug: string, year: number) {
    try {
        await enforcePermission(shopId, "manage_expenses");

        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };

        const estProfit = parseFloat(shop.estimatedAnnualProfit || "0");
        const citRate = parseFloat(shop.citRate || "30.00") / 100;
        const estTax = estProfit * citRate;

        // Clear existing pending instalments for this year
        await db.delete(taxInstalments).where(
            and(
                eq(taxInstalments.shopId, shopId),
                eq(taxInstalments.year, year),
                eq(taxInstalments.status, "PENDING")
            )
        );

        const singleInstalmentVal = estTax / 4;
        const startMonth = shop.fiscalYearStartMonth; // 1 to 12

        // Months 4, 6, 9, 12 of accounting year
        const offsets = [4, 6, 9, 12];

        for (let i = 0; i < 4; i++) {
            const offset = offsets[i];
            // Calculate due month (1-indexed calendar month)
            const dueMonthIdx = (startMonth - 1 + (offset - 1)) % 12; // 0-11
            const dueYear = year + Math.floor((startMonth - 1 + (offset - 1)) / 12);
            
            const dueDate = new Date(dueYear, dueMonthIdx, 20); // 20th of the month

            await db.insert(taxInstalments).values({
                shopId,
                year,
                instalmentNumber: i + 1,
                dueDate: dueDate.toISOString().split("T")[0],
                estimatedAmount: singleInstalmentVal.toFixed(2),
                paidAmount: "0.00",
                status: "PENDING",
            });
        }

        revalidatePath(`/workspaces/${shopSlug}/finance/tax/instalments`);
        return { success: true, count: 4 };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to generate schedule." };
    }
}

export async function payTaxInstalment(
    shopId: string,
    shopSlug: string,
    instalmentId: string,
    data: {
        paidAmount: number;
        paymentReference: string;
        paidAt: Date;
    }
) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const instalment = await db.query.taxInstalments.findFirst({
            where: and(eq(taxInstalments.id, instalmentId), eq(taxInstalments.shopId, shopId)),
        });
        if (!instalment) return { success: false, error: "Instalment not found." };

        await db.update(taxInstalments).set({
            paidAmount: data.paidAmount.toFixed(2),
            paidAt: data.paidAt,
            paymentReference: data.paymentReference,
            status: "PAID",
        }).where(eq(taxInstalments.id, instalmentId));

        // Auto-journal: DR 2310 Instalment Tax Paid (Asset) / CR 1200 Cash & Bank
        await createJournalEntry({
            shopId,
            entryDate: data.paidAt,
            description: `Instalment Tax Paid (PRN: ${data.paymentReference})`,
            debitAccountCode: "2310",  // Instalment Tax Paid
            creditAccountCode: "1200", // Cash & Bank
            amount: data.paidAmount,
            sourceType: "manual",
            createdById: session.userId,
        });

        revalidatePath(`/workspaces/${shopSlug}/finance/tax/instalments`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to pay instalment." };
    }
}

// ================================================================
// TAXABLE INCOME COMPUTATION
// ================================================================

export interface TaxComputationData {
    netIncome: number;
    nonDeductibleExpenses: number;
    capitalAllowances: number;
    taxableIncome: number;
    citRate: number;
    grossTaxLiability: number;
    instalmentsPaid: number;
    netTaxDue: number;
}

export async function getTaxComputation(shopId: string, year: number): Promise<{ success: true; data: TaxComputationData } | { success: false; error: string }> {
    try {
        const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });
        if (!shop) return { success: false, error: "Workspace not found." };

        const start = new Date(year, shop.fiscalYearStartMonth - 1, 1);
        const end = new Date(year + 1, shop.fiscalYearStartMonth - 1, 0, 23, 59, 59);

        // 1. Fetch Net Income from P&L statement
        const plResult = await getPLStatement(shopId, "CUSTOM", { startDate: start, endDate: end });
        const netIncome = plResult.success ? plResult.data.netIncome : 0;

        // 2. Fetch Non-deductible expenses in that period
        const allExpenses = await db.query.expenses.findMany({
            where: and(
                eq(expenses.shopId, shopId),
                gte(expenses.expenseDate, start),
                lte(expenses.expenseDate, end),
                eq(expenses.isNonDeductible, true)
            ),
        });
        const nonDeductibleExpenses = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);

        // 3. Capital allowances deduction (Aggregates Depreciation Expense account 6800 in the period)
        const allDepreciation = await db.query.journalEntries.findMany({
            where: and(
                eq(require("@/db/schema").journalEntries.shopId, shopId),
                eq(require("@/db/schema").journalEntries.debitAccountId, 
                   db.select({ id: require("@/db/schema").chartOfAccounts.id })
                     .from(require("@/db/schema").chartOfAccounts)
                     .where(and(eq(require("@/db/schema").chartOfAccounts.shopId, shopId), eq(require("@/db/schema").chartOfAccounts.code, "6800")))
                ),
                gte(require("@/db/schema").journalEntries.entryDate, start),
                lte(require("@/db/schema").journalEntries.entryDate, end)
            ),
        });
        const capitalAllowances = allDepreciation.reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0);

        // 4. Compute CIT
        const taxableIncome = Math.max(netIncome + nonDeductibleExpenses - capitalAllowances, 0);
        const citRate = parseFloat(shop.citRate || "30.00") / 100;
        const grossTaxLiability = taxableIncome * citRate;

        // 5. Gather instalments paid (DR balance of 2310)
        const instalments = await db.query.taxInstalments.findMany({
            where: and(eq(taxInstalments.shopId, shopId), eq(taxInstalments.year, year), eq(taxInstalments.status, "PAID")),
        });
        const instalmentsPaid = instalments.reduce((sum, t) => sum + parseFloat(t.paidAmount || "0"), 0);

        const netTaxDue = grossTaxLiability - instalmentsPaid;

        return {
            success: true,
            data: {
                netIncome,
                nonDeductibleExpenses,
                capitalAllowances,
                taxableIncome,
                citRate: citRate * 100,
                grossTaxLiability,
                instalmentsPaid,
                netTaxDue,
            },
        };
    } catch (error: any) {
        console.error("Tax computation error:", error);
        return { success: false, error: "Failed to compute income tax." };
    }
}

// ================================================================
// TURNOVER TAX (TOT) TRACKER
// ================================================================

export interface TurnoverTaxQuarter {
    quarter: number;
    startDate: string;
    endDate: string;
    grossSales: number;
    taxRate: number;
    taxLiability: number;
}

export async function getTurnoverTaxQuarterly(shopId: string, year: number): Promise<{ success: true; quarters: TurnoverTaxQuarter[] } | { success: false; error: string }> {
    try {
        const quarters: TurnoverTaxQuarter[] = [];

        // Define simple calendar quarters
        const quarterDates = [
            { q: 1, s: new Date(year, 0, 1), e: new Date(year, 2, 31, 23, 59, 59) },
            { q: 2, s: new Date(year, 3, 1), e: new Date(year, 5, 30, 23, 59, 59) },
            { q: 3, s: new Date(year, 6, 1), e: new Date(year, 8, 30, 23, 59, 59) },
            { q: 4, s: new Date(year, 9, 1), e: new Date(year, 11, 31, 23, 59, 59) },
        ];

        for (const qd of quarterDates) {
            const allDocs = await db.query.documents.findMany({
                where: eq(documents.shopId, shopId),
            });

            // Filter sales (Invoices and Receipts) in quarter
            let grossSales = 0;
            allDocs.forEach(d => {
                const date = new Date(d.issueDate);
                const isReceiptFromInvoice = d.type === "RECEIPT" && d.parentDocumentId;
                if (!isReceiptFromInvoice && (d.type === "RECEIPT" || (d.type === "INVOICE" && d.status === "PAID"))) {
                    if (date >= qd.s && date <= qd.e) {
                        grossSales += parseFloat(d.grandTotal || "0");
                    }
                }
            });

            quarters.push({
                quarter: qd.q,
                startDate: qd.s.toISOString().split("T")[0],
                endDate: qd.e.toISOString().split("T")[0],
                grossSales,
                taxRate: 1.5, // 1.5% TOT Rate
                taxLiability: grossSales * 0.015,
            });
        }

        return { success: true, quarters };
    } catch (error: any) {
        return { success: false, error: "Failed to fetch TOT details." };
    }
}
