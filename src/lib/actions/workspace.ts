"use server";

import { db } from "@/db";
import {
    shops,
    shopMembers,
    shopInvitations,
    paymentMethods,
    shopTerms,
    shopCurrencies,
    products,
    productLocationStock,
    stockLocations,
    stockLedger,
    stockTransfers,
    stockTransferItems,
    clients,
    suppliers,
    documents,
    documentItems,
    documentTokens,
    documentPayments,
    documentNotes,
    vendorBills,
    vendorBillItems,
    expenses,
    expenseClaims,
    incomes,
    employees,
    chartOfAccounts,
    fiscalYears,
    accountingPeriods,
    journalEntries,
    costCenters,
    budgets,
    fixedAssets,
    taxInstalments,
    whtPayments,
    ledgerSnapshots,
    notifications,
    loyaltyPrograms,
    membershipTiers,
    clientLoyaltyAccounts,
    loyaltyLedger,
    deals,
    dealActivities,
    proposals,
    proposalItems,
    proposalTokens,
    contracts,
    contractHoursLog,
    projects,
    projectMembers,
    timesheets,
    projectMilestones,
    approvalPolicies,
    approvalRequests,
    approvalTimeline,
    storageBins,
    productBatches,
    billOfMaterials,
    bomItems,
    productionOrders,
    stocktakes,
    stocktakeItems,
    groupMemberships,
    interCompanyTransactions,
    users,
} from "@/db/schema";
import { and, eq, ne, inArray, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifyAndGetSession } from "./auth";
import { revalidatePath } from "next/cache";
import { generateUniqueShopCode } from "./shopCode";
import { apiClient } from "@/lib/api/client";

import { cache } from "react";

import { isApiModuleEnabled } from "@/lib/api/flags";

/**
 * Server-side security guard that extracts session credentials, 
 * verifies tenant membership, and returns the active shop context.
 */
export const getActiveWorkspaceContext = cache(async function getActiveWorkspaceContext(slug: string) {
    // 1. Authenticate the active session cookie
    const sessionRecord = await verifyAndGetSession();
    if (!sessionRecord) {
        redirect("/logout");
    }

    // FASTAPI STRANGLER ROUTING:
    if (isApiModuleEnabled("workspaces")) {
        const res = await apiClient<{ success: boolean; role: any; shop: any }>(`/v1/workspaces/by-slug/${slug}/context`);
        if (res.data?.success && res.data.shop) {
            return {
                user: sessionRecord.user,
                shop: res.data.shop,
                role: res.data.role,
            };
        }
    }

    // 2. Locate the requested shop profile by its unique URL slug
    const shopProfile = await db.query.shops.findFirst({
        where: eq(shops.slug, slug),
    });

    if (!shopProfile) {
        redirect("/workspaces");
    }

    // 3. Super Admin bypass — always permitted with full OWNER role
    if (sessionRecord.user.isSuperAdmin) {
        return {
            user: sessionRecord.user,
            shop: shopProfile,
            role: "OWNER" as const,
        };
    }

    // 4. Direct Shop Owner check — auto-heal membership if needed
    if (shopProfile.ownerId === sessionRecord.userId) {
        const membership = await db.query.shopMembers.findFirst({
            where: and(
                eq(shopMembers.shopId, shopProfile.id),
                eq(shopMembers.userId, sessionRecord.userId)
            ),
        });

        if (!membership) {
            try {
                await db.insert(shopMembers).values({
                    shopId: shopProfile.id,
                    userId: sessionRecord.userId,
                    role: "OWNER",
                    isActive: true,
                });
            } catch (e) {}
        } else if (!membership.isActive) {
            try {
                await db.update(shopMembers).set({ isActive: true, role: "OWNER" }).where(eq(shopMembers.id, membership.id));
            } catch (e) {}
        }

        return {
            user: sessionRecord.user,
            shop: shopProfile,
            role: "OWNER" as const,
        };
    }

    // 5. Verify that this specific user is an active member of this shop
    const membership = await db.query.shopMembers.findFirst({
        where: and(
            eq(shopMembers.shopId, shopProfile.id),
            eq(shopMembers.userId, sessionRecord.userId),
            eq(shopMembers.isActive, true)
        ),
    });

    if (!membership) {
        redirect("/workspaces"); // Bounce to multi-workspace directory, avoiding /dashboard redirect loop
    }

    return {
        user: sessionRecord.user,
        shop: shopProfile,
        role: membership.role,
    };
});

interface UpdateShopSettingsInput {
    shopId: string;
    name: string;
    shortName?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    primaryColor?: string;
    taxPin?: string;
    email?: string;
    isVatRegistered: boolean;
    vatNumber?: string;
    currency: string;
    fiscalYearStartMonth: number;
    autoStockDeductionEnabled?: boolean;
    businessMode?: "SERVICES" | "RETAIL" | "HYBRID";
    loyaltyEngineMode?: "OFF" | "POINTS_ONLY" | "TIERS_ONLY" | "HYBRID";
}

/**
 * Persists modifications to the merchant's brand and compliance criteria.
 */
export async function updateShopSettings(input: UpdateShopSettingsInput) {
    try {
        let primaryColor = input.primaryColor?.trim() || "#000000";
        if (primaryColor && !primaryColor.startsWith("#")) {
            primaryColor = `#${primaryColor}`;
        }

        const payload: Record<string, any> = {
            name: input.name.trim(),
            short_name: input.shortName?.trim() || null,
            phone: input.phone?.trim() || null,
            website: input.website?.trim() || null,
            logo_url: input.logoUrl?.trim() || null,
            primary_color: primaryColor,
            tax_pin: input.taxPin?.trim() || null,
            email: input.email?.trim() || null,
            is_vat_registered: input.isVatRegistered,
            vat_number: input.isVatRegistered ? (input.vatNumber?.trim() || null) : null,
            currency: input.currency.toUpperCase().trim(),
            fiscal_year_start_month: input.fiscalYearStartMonth,
        };

        if (input.autoStockDeductionEnabled !== undefined) {
            payload.auto_stock_deduction_enabled = input.autoStockDeductionEnabled;
        }

        if (input.businessMode !== undefined) {
            payload.business_mode = input.businessMode;
        }

        if (input.loyaltyEngineMode !== undefined) {
            payload.loyalty_engine_mode = input.loyaltyEngineMode;
        }

        const res = await apiClient.patch(`/v1/workspaces/${input.shopId}/settings`, payload);

        if (res.error) {
            return { success: false, error: res.error };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to commit shop settings changes via FastAPI:", error);
        return { success: false, error: error.message || "Failed to persist compliance updates." };
    }
}

/**
 * Server action to create an additional shop
 */
export async function createAdditionalShop(input: { userId: string; businessName: string; currency: string }) {
    const baseSlug = input.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const existingSlug = await db.query.shops.findFirst({ where: eq(shops.slug, baseSlug) });
    const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const shopCode = await generateUniqueShopCode(db);
    const user = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
    const isLifetime = Boolean(user?.isLifetimePro || user?.isSuperAdmin);

    const [newShop] = await db.insert(shops).values({
        ownerId: input.userId,
        name: input.businessName.trim(),
        slug: finalSlug,
        code: shopCode,
        currency: input.currency,
        primaryColor: "#000000",
        isVatRegistered: false,
        isLifetimePro: isLifetime,
        plan: isLifetime ? "PRO" : "FREE",
        subscriptionStatus: isLifetime ? "LIFETIME_FREE" : "ACTIVE",
    }).returning();

    await db.insert(shopMembers).values({
        shopId: newShop.id,
        userId: input.userId,
        role: "OWNER",
        isActive: true,
    });

    return { success: true as const, shopSlug: newShop.slug };
}

export async function disableOnboardingGuideAction(shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context." };

    try {
        await db.update(shops)
            .set({ hideOnboarding: true })
            .where(eq(shops.id, shopId));

        revalidatePath(`/workspaces/${shopSlug}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to dismiss guide." };
    }
}

/**
 * Low-level transactional helper that sweeps all records belonging to a workspace
 * in strict reverse-dependency order, and finally deletes the shop itself.
 */
export async function purgeShopDataComplete(tx: any, shopId: string) {
    // 1. Inter-company transactions
    await tx.delete(interCompanyTransactions).where(
        or(eq(interCompanyTransactions.sourceShopId, shopId), eq(interCompanyTransactions.targetShopId, shopId))
    );

    // 2. Group memberships
    await tx.delete(groupMemberships).where(eq(groupMemberships.shopId, shopId));

    // 3. Approval Engine (Timeline -> Requests -> Policies)
    const appReqs = await tx.query.approvalRequests.findMany({
        where: eq(approvalRequests.shopId, shopId),
        columns: { id: true }
    });
    const appReqIds = appReqs.map((r: any) => r.id);
    if (appReqIds.length > 0) {
        await tx.delete(approvalTimeline).where(inArray(approvalTimeline.requestId, appReqIds));
    }
    await tx.delete(approvalRequests).where(eq(approvalRequests.shopId, shopId));
    await tx.delete(approvalPolicies).where(eq(approvalPolicies.shopId, shopId));

    // 4. Proposals (Tokens -> Items -> Proposals)
    const props = await tx.query.proposals.findMany({
        where: eq(proposals.shopId, shopId),
        columns: { id: true }
    });
    const propIds = props.map((p: any) => p.id);
    if (propIds.length > 0) {
        await tx.delete(proposalTokens).where(inArray(proposalTokens.proposalId, propIds));
        await tx.delete(proposalItems).where(inArray(proposalItems.proposalId, propIds));
    }
    await tx.delete(proposals).where(eq(proposals.shopId, shopId));

    // 5. CRM Deals & Activities
    await tx.delete(dealActivities).where(eq(dealActivities.shopId, shopId));
    await tx.delete(deals).where(eq(deals.shopId, shopId));

    // 6. Contracts & Timesheets
    await tx.delete(contractHoursLog).where(eq(contractHoursLog.shopId, shopId));
    await tx.delete(contracts).where(eq(contracts.shopId, shopId));

    // 7. Projects, Milestones, Members & Timesheets
    await tx.delete(timesheets).where(eq(timesheets.shopId, shopId));
    await tx.delete(projectMilestones).where(eq(projectMilestones.shopId, shopId));
    await tx.delete(projectMembers).where(eq(projectMembers.shopId, shopId));
    await tx.delete(projects).where(eq(projects.shopId, shopId));

    // 8. Stocktakes & Items
    const stList = await tx.query.stocktakes.findMany({
        where: eq(stocktakes.shopId, shopId),
        columns: { id: true }
    });
    const stIds = stList.map((s: any) => s.id);
    if (stIds.length > 0) {
        await tx.delete(stocktakeItems).where(inArray(stocktakeItems.stocktakeId, stIds));
    }
    await tx.delete(stocktakes).where(eq(stocktakes.shopId, shopId));

    // 9. Production Orders & BOM (Items -> BOM)
    await tx.delete(productionOrders).where(eq(productionOrders.shopId, shopId));
    const boms = await tx.query.billOfMaterials.findMany({
        where: eq(billOfMaterials.shopId, shopId),
        columns: { id: true }
    });
    const bomIds = boms.map((b: any) => b.id);
    if (bomIds.length > 0) {
        await tx.delete(bomItems).where(inArray(bomItems.bomId, bomIds));
    }
    await tx.delete(billOfMaterials).where(eq(billOfMaterials.shopId, shopId));

    // 10. Storage Bins & Batches
    await tx.delete(productBatches).where(eq(productBatches.shopId, shopId));
    await tx.delete(storageBins).where(eq(storageBins.shopId, shopId));

    // 11. Stock Transfers & Items
    const transfers = await tx.query.stockTransfers.findMany({
        where: eq(stockTransfers.shopId, shopId),
        columns: { id: true }
    });
    const transferIds = transfers.map((t: any) => t.id);
    if (transferIds.length > 0) {
        await tx.delete(stockTransferItems).where(inArray(stockTransferItems.transferId, transferIds));
    }
    await tx.delete(stockTransfers).where(eq(stockTransfers.shopId, shopId));

    // 12. Stock Ledger & Product Location Stock & Locations
    await tx.delete(productLocationStock).where(eq(productLocationStock.shopId, shopId));
    await tx.delete(stockLedger).where(eq(stockLedger.shopId, shopId));
    await tx.delete(stockLocations).where(eq(stockLocations.shopId, shopId));

    // 13. Vendor Bills & Items
    const vBills = await tx.query.vendorBills.findMany({
        where: eq(vendorBills.shopId, shopId),
        columns: { id: true }
    });
    const vBillIds = vBills.map((b: any) => b.id);
    if (vBillIds.length > 0) {
        await tx.delete(vendorBillItems).where(inArray(vendorBillItems.billId, vBillIds));
    }
    await tx.delete(vendorBills).where(eq(vendorBills.shopId, shopId));

    // 14. Documents, Items, Tokens, Payments, Notes
    const docs = await tx.query.documents.findMany({
        where: eq(documents.shopId, shopId),
        columns: { id: true }
    });
    const docIds = docs.map((d: any) => d.id);
    if (docIds.length > 0) {
        await tx.delete(documentTokens).where(inArray(documentTokens.documentId, docIds));
        await tx.delete(documentItems).where(inArray(documentItems.documentId, docIds));
    }
    await tx.delete(documentNotes).where(eq(documentNotes.shopId, shopId));
    await tx.delete(documentPayments).where(eq(documentPayments.shopId, shopId));
    await tx.delete(documents).where(eq(documents.shopId, shopId));

    // 15. General Ledger, Budgets, Fixed Assets, Taxes
    await tx.delete(journalEntries).where(eq(journalEntries.shopId, shopId));
    await tx.delete(budgets).where(eq(budgets.shopId, shopId));
    await tx.delete(fixedAssets).where(eq(fixedAssets.shopId, shopId));
    await tx.delete(taxInstalments).where(eq(taxInstalments.shopId, shopId));
    await tx.delete(whtPayments).where(eq(whtPayments.shopId, shopId));
    await tx.delete(accountingPeriods).where(eq(accountingPeriods.shopId, shopId));
    await tx.delete(fiscalYears).where(eq(fiscalYears.shopId, shopId));
    await tx.delete(ledgerSnapshots).where(eq(ledgerSnapshots.shopId, shopId));

    // 16. Incomes, Expenses, Expense Claims
    await tx.delete(expenseClaims).where(eq(expenseClaims.shopId, shopId));
    await tx.delete(expenses).where(eq(expenses.shopId, shopId));
    await tx.delete(incomes).where(eq(incomes.shopId, shopId));

    // 17. Master Data: Products, Clients, Suppliers, Employees, Accounts, Cost Centers
    await tx.delete(employees).where(eq(employees.shopId, shopId));
    await tx.delete(products).where(eq(products.shopId, shopId));
    await tx.delete(clients).where(eq(clients.shopId, shopId));
    await tx.delete(suppliers).where(eq(suppliers.shopId, shopId));
    await tx.delete(costCenters).where(eq(costCenters.shopId, shopId));
    await tx.delete(chartOfAccounts).where(eq(chartOfAccounts.shopId, shopId));

    // 18. Loyalty Program
    await tx.delete(loyaltyLedger).where(eq(loyaltyLedger.shopId, shopId));
    await tx.delete(clientLoyaltyAccounts).where(eq(clientLoyaltyAccounts.shopId, shopId));
    await tx.delete(membershipTiers).where(eq(membershipTiers.shopId, shopId));
    await tx.delete(loyaltyPrograms).where(eq(loyaltyPrograms.shopId, shopId));

    // 19. Shop Settings & Configuration
    await tx.delete(shopCurrencies).where(eq(shopCurrencies.shopId, shopId));
    await tx.delete(shopTerms).where(eq(shopTerms.shopId, shopId));
    await tx.delete(paymentMethods).where(eq(paymentMethods.shopId, shopId));
    await tx.delete(notifications).where(eq(notifications.shopId, shopId));
    await tx.delete(shopInvitations).where(eq(shopInvitations.shopId, shopId));
    await tx.delete(shopMembers).where(eq(shopMembers.shopId, shopId));

    // 20. Finally, delete the shop tenant row itself!
    await tx.delete(shops).where(eq(shops.id, shopId));
}

/**
 * Permanently and irrevocably purges a workspace tenant and all related data records.
 * Can only be executed by the Workspace OWNER or a Super Admin.
 */
export async function deleteWorkspaceAction(input: {
    shopId: string;
    confirmationInput: string;
}): Promise<{ success: boolean; error?: string; nextSlug?: string | null }> {
    try {
        const session = await verifyAndGetSession();
        if (!session) return { success: false, error: "Authentication required." };

        const targetShop = await db.query.shops.findFirst({
            where: eq(shops.id, input.shopId),
        });

        if (!targetShop) {
            return { success: false, error: "Target workspace not found." };
        }

        // Authorization check: Only workspace OWNER or Super Admin
        const isOwner = targetShop.ownerId === session.userId;
        const isSuperAdmin = Boolean(session.user.isSuperAdmin);

        if (!isOwner && !isSuperAdmin) {
            return {
                success: false,
                error: "Unauthorized. Only the workspace owner or a Super Admin can permanently delete this workspace.",
            };
        }

        // Confirmation validation: user must type slug, code, or "DELETE"
        const allowedConfirmations = [
            targetShop.slug.toLowerCase().trim(),
            (targetShop.code || "").toLowerCase().trim(),
            targetShop.name.toLowerCase().trim(),
            "delete",
        ].filter(Boolean);

        const normalizedInput = (input.confirmationInput || "").toLowerCase().trim();
        if (!allowedConfirmations.includes(normalizedInput)) {
            return {
                success: false,
                error: `Confirmation mismatch. Please type "${targetShop.slug}" or "DELETE" to confirm permanent purge.`,
            };
        }

        // Atomic transaction purge
        await db.transaction(async (tx) => {
            await purgeShopDataComplete(tx, targetShop.id);
        });

        // Determine next accessible workspace for the active session
        const nextMembership = await db.query.shopMembers.findFirst({
            where: and(
                eq(shopMembers.userId, session.userId),
                ne(shopMembers.shopId, targetShop.id),
                eq(shopMembers.isActive, true)
            ),
            with: { shop: true },
        });

        const nextSlug = nextMembership?.shop?.slug || null;

        revalidatePath("/workspaces");
        revalidatePath("/admin/workspaces");
        revalidatePath("/admin");

        return {
            success: true,
            nextSlug,
        };
    } catch (error: any) {
        console.error("Critical failure during workspace purge sequence:", error);
        return { success: false, error: error?.message || "Failed to purge workspace." };
    }
}