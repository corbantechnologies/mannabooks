"use server";

import { db } from "@/db";
import {
  groupEntities,
  groupMemberships,
  interCompanyTransactions,
  shops,
  users,
  documents,
  vendorBills,
} from "@/db/schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";
import { getPLStatement, getBalanceSheet, type ReportPeriod, type DateRange } from "./reports";

export interface CreateGroupInput {
  name: string;
  code: string;
  reportingCurrency?: string;
  description?: string;
  initialShopId?: string;
}

export interface AddShopToGroupInput {
  groupId: string;
  shopId: string;
  entityType?: "PARENT" | "SUBSIDIARY" | "SISTER" | "DIVISION";
  ownershipPercentage?: number;
}

export interface RecordInterCompanyTxInput {
  groupId: string;
  sourceShopId: string;
  targetShopId: string;
  sourceDocumentId?: string;
  targetBillId?: string;
  amount: number;
  currency?: string;
  transactionType: "MANAGEMENT_SERVICES" | "PRODUCT_SUPPLY" | "SHARED_COST" | "INTER_COMPANY_LOAN";
  notes?: string;
}

/**
 * Fetch all Group entities accessible to the user
 */
export async function getUserGroups(currentShopSlug?: string) {
  const session = await verifyAndGetSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const groups = await db.query.groupEntities.findMany({
    where: eq(groupEntities.ownerId, session.user.id),
    orderBy: [desc(groupEntities.createdAt)],
    with: {
      memberships: {
        with: {
          shop: true,
        },
      },
      interCompanyTransactions: true,
    },
  });

  return groups;
}

/**
 * Fetch single group by ID with full memberships and transactions
 */
export async function getGroupById(groupId: string) {
  const group = await db.query.groupEntities.findFirst({
    where: eq(groupEntities.id, groupId),
    with: {
      memberships: {
        with: {
          shop: true,
        },
      },
      interCompanyTransactions: {
        with: {
          sourceShop: true,
          targetShop: true,
          sourceDocument: true,
          targetBill: true,
        },
      },
    },
  });

  return group;
}

/**
 * Create a new Holding / Group Entity and enroll the initial workspace as Parent
 */
export async function createGroupEntity(shopSlug: string, input: CreateGroupInput) {
  const session = await verifyAndGetSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, shopSlug),
  });

  if (!shop) {
    return { success: false, error: "Workspace not found" };
  }

  await enforcePermission(shop.id, "manage_settings");

  const cleanCode = input.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!cleanCode) {
    return { success: false, error: "Group code must be alphanumeric" };
  }

  const existingCode = await db.query.groupEntities.findFirst({
    where: eq(groupEntities.code, cleanCode),
  });

  if (existingCode) {
    return { success: false, error: `Group code '${cleanCode}' is already in use.` };
  }

  const newGroup = await db.transaction(async (tx) => {
    const [insertedGroup] = await tx
      .insert(groupEntities)
      .values({
        name: input.name.trim(),
        code: cleanCode,
        reportingCurrency: input.reportingCurrency || shop.currency || "KES",
        ownerId: session.user.id,
        description: input.description?.trim() || null,
      })
      .returning();

    // Auto-enroll initiating workspace as PARENT
    await tx.insert(groupMemberships).values({
      groupId: insertedGroup.id,
      shopId: shop.id,
      entityType: "PARENT",
      ownershipPercentage: "100.00",
    });

    return insertedGroup;
  });

  revalidatePath(`/workspaces/${shopSlug}/finance/group-consolidation`);

  return { success: true, groupId: newGroup.id };
}

/**
 * Add a workspace / subsidiary to an existing group
 */
export async function addShopToGroup(shopSlug: string, input: AddShopToGroupInput) {
  const session = await verifyAndGetSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const currentShop = await db.query.shops.findFirst({
    where: eq(shops.slug, shopSlug),
  });

  if (!currentShop) {
    return { success: false, error: "Workspace not found" };
  }

  await enforcePermission(currentShop.id, "manage_settings");

  const existingMembership = await db.query.groupMemberships.findFirst({
    where: and(
      eq(groupMemberships.groupId, input.groupId),
      eq(groupMemberships.shopId, input.shopId)
    ),
  });

  if (existingMembership) {
    return { success: false, error: "This entity is already a member of this group." };
  }

  const ownership = Number(input.ownershipPercentage) || 100;
  if (ownership <= 0 || ownership > 100) {
    return { success: false, error: "Ownership percentage must be between 0.01% and 100%." };
  }

  await db.insert(groupMemberships).values({
    groupId: input.groupId,
    shopId: input.shopId,
    entityType: input.entityType || "SUBSIDIARY",
    ownershipPercentage: ownership.toFixed(2),
  });

  revalidatePath(`/workspaces/${shopSlug}/finance/group-consolidation`);

  return { success: true };
}

/**
 * Remove an entity from a group
 */
export async function removeShopFromGroup(shopSlug: string, membershipId: string) {
  const currentShop = await db.query.shops.findFirst({
    where: eq(shops.slug, shopSlug),
  });

  if (!currentShop) {
    return { success: false, error: "Workspace not found" };
  }

  await enforcePermission(currentShop.id, "manage_settings");

  await db.delete(groupMemberships).where(eq(groupMemberships.id, membershipId));

  revalidatePath(`/workspaces/${shopSlug}/finance/group-consolidation`);

  return { success: true };
}

/**
 * Record an Inter-Company Transaction (Company A $\leftrightarrow$ Company B)
 */
export async function recordInterCompanyTransaction(shopSlug: string, input: RecordInterCompanyTxInput) {
  const currentShop = await db.query.shops.findFirst({
    where: eq(shops.slug, shopSlug),
  });

  if (!currentShop) {
    return { success: false, error: "Workspace not found" };
  }

  await enforcePermission(currentShop.id, "manage_settings");

  if (input.sourceShopId === input.targetShopId) {
    return { success: false, error: "Source and Target entities cannot be the same company." };
  }

  const amt = Number(input.amount) || 0;
  if (amt <= 0) {
    return { success: false, error: "Transaction amount must be greater than zero." };
  }

  await db.insert(interCompanyTransactions).values({
    groupId: input.groupId,
    sourceShopId: input.sourceShopId,
    targetShopId: input.targetShopId,
    sourceDocumentId: input.sourceDocumentId || null,
    targetBillId: input.targetBillId || null,
    amount: amt.toFixed(2),
    currency: input.currency || currentShop.currency || "KES",
    transactionType: input.transactionType,
    isEliminated: true,
    notes: input.notes?.trim() || null,
  });

  revalidatePath(`/workspaces/${shopSlug}/finance/group-consolidation`);

  return { success: true };
}

/**
 * Toggle elimination status of an Inter-Company Transaction
 */
export async function toggleElimination(shopSlug: string, transactionId: string, isEliminated: boolean) {
  const currentShop = await db.query.shops.findFirst({
    where: eq(shops.slug, shopSlug),
  });

  if (!currentShop) {
    return { success: false, error: "Workspace not found" };
  }

  await enforcePermission(currentShop.id, "manage_settings");

  await db
    .update(interCompanyTransactions)
    .set({ isEliminated })
    .where(eq(interCompanyTransactions.id, transactionId));

  revalidatePath(`/workspaces/${shopSlug}/finance/group-consolidation`);

  return { success: true };
}

// ================================================================
// MULTI-COLUMN CONSOLIDATED P&L ENGINE
// ================================================================

export interface ConsolidatedPLEntityColumn {
  shopId: string;
  name: string;
  slug: string;
  code: string | null;
  entityType: string;
  ownershipPercentage: number;
  salesRevenue: number;
  nonOperatingIncome: number;
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netOperatingProfit: number;
  netIncome: number;
}

export interface ConsolidatedPnLResult {
  group: {
    id: string;
    name: string;
    code: string;
    reportingCurrency: string;
  };
  period: string;
  entities: ConsolidatedPLEntityColumn[];
  eliminations: {
    salesRevenue: number;
    expenses: number;
    netElimination: number;
  };
  consolidated: {
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: number;
    netOperatingProfit: number;
    minorityInterest: number;
    groupNetIncome: number;
  };
}

export async function getConsolidatedPnL(
  groupId: string,
  period: ReportPeriod = "THIS_MONTH",
  customRange?: { startDate: string; endDate: string }
): Promise<{ success: true; data: ConsolidatedPnLResult } | { success: false; error: string }> {
  try {
    const group = await db.query.groupEntities.findFirst({
      where: eq(groupEntities.id, groupId),
      with: {
        memberships: {
          with: {
            shop: true,
          },
        },
        interCompanyTransactions: {
          where: eq(interCompanyTransactions.isEliminated, true),
        },
      },
    });

    if (!group) {
      return { success: false, error: "Holding group entity not found." };
    }

    if (!group.memberships || group.memberships.length === 0) {
      return { success: false, error: "No member entities enrolled in this group." };
    }

    const customDateRange: DateRange | undefined = customRange
      ? {
          startDate: new Date(customRange.startDate),
          endDate: new Date(customRange.endDate),
        }
      : undefined;

    // 1. Fetch individual entity statements
    const entityColumns: ConsolidatedPLEntityColumn[] = [];
    let sumRevenue = 0;
    let sumCogs = 0;
    let sumExpenses = 0;
    let totalMinorityInterest = 0;

    for (const member of group.memberships) {
      const pl = await getPLStatement(member.shopId, period, customDateRange);
      const data = pl.success
        ? pl.data
        : {
            salesRevenue: 0,
            nonOperatingIncome: 0,
            totalRevenue: 0,
            cogs: 0,
            grossProfit: 0,
            grossProfitMargin: 0,
            expenseLines: [],
            totalOperatingExpenses: 0,
            netOperatingProfit: 0,
            netIncome: 0,
          };

      const ownership = parseFloat(member.ownershipPercentage || "100.00");

      entityColumns.push({
        shopId: member.shop.id,
        name: member.shop.name,
        slug: member.shop.slug,
        code: member.shop.code || member.shop.slug.slice(0, 4).toUpperCase(),
        entityType: member.entityType,
        ownershipPercentage: ownership,
        salesRevenue: data.salesRevenue,
        nonOperatingIncome: data.nonOperatingIncome,
        totalRevenue: data.totalRevenue,
        cogs: data.cogs,
        grossProfit: data.grossProfit,
        operatingExpenses: data.totalOperatingExpenses,
        netOperatingProfit: data.netOperatingProfit,
        netIncome: data.netIncome,
      });

      sumRevenue += data.totalRevenue;
      sumCogs += data.cogs;
      sumExpenses += data.totalOperatingExpenses;

      // Minority interest share of non-wholly owned subsidiaries
      if (ownership < 100 && member.entityType !== "PARENT") {
        const nonControllingShare = (100 - ownership) / 100;
        totalMinorityInterest += data.netIncome * nonControllingShare;
      }
    }

    // 2. Compute Inter-Company Eliminations
    // Inter-company transactions eliminate equal parts revenue (from seller) and expenses (from buyer)
    let eliminatedRevenue = 0;
    let eliminatedExpenses = 0;

    for (const tx of group.interCompanyTransactions) {
      const amt = parseFloat(tx.amount || "0");
      if (tx.transactionType === "PRODUCT_SUPPLY") {
        eliminatedRevenue += amt;
        eliminatedExpenses += amt;
      } else if (tx.transactionType === "MANAGEMENT_SERVICES" || tx.transactionType === "SHARED_COST") {
        eliminatedRevenue += amt;
        eliminatedExpenses += amt;
      }
    }

    // 3. Consolidated Group Totals
    const consolidatedRevenue = Math.max(0, sumRevenue - eliminatedRevenue);
    const consolidatedCogs = sumCogs;
    const consolidatedGrossProfit = consolidatedRevenue - consolidatedCogs;
    const consolidatedMargin = consolidatedRevenue > 0 ? (consolidatedGrossProfit / consolidatedRevenue) * 100 : 0;
    const consolidatedExpenses = Math.max(0, sumExpenses - eliminatedExpenses);
    const consolidatedOperatingProfit = consolidatedGrossProfit - consolidatedExpenses;
    const groupNetIncome = consolidatedOperatingProfit - totalMinorityInterest;

    return {
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          code: group.code,
          reportingCurrency: group.reportingCurrency,
        },
        period,
        entities: entityColumns,
        eliminations: {
          salesRevenue: eliminatedRevenue,
          expenses: eliminatedExpenses,
          netElimination: eliminatedRevenue - eliminatedExpenses,
        },
        consolidated: {
          totalRevenue: consolidatedRevenue,
          cogs: consolidatedCogs,
          grossProfit: consolidatedGrossProfit,
          grossProfitMargin: consolidatedMargin,
          operatingExpenses: consolidatedExpenses,
          netOperatingProfit: consolidatedOperatingProfit,
          minorityInterest: totalMinorityInterest,
          groupNetIncome,
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate consolidated P&L." };
  }
}

// ================================================================
// MULTI-COLUMN CONSOLIDATED BALANCE SHEET ENGINE
// ================================================================

export interface ConsolidatedBSEntityColumn {
  shopId: string;
  name: string;
  slug: string;
  code: string | null;
  entityType: string;
  ownershipPercentage: number;
  cashAndBank: number;
  accountsReceivable: number;
  inventory: number;
  fixedAssetsWdv: number;
  totalAssets: number;
  accountsPayable: number;
  taxPayable: number;
  totalLiabilities: number;
  equity: number;
  retainedEarnings: number;
  totalEquity: number;
}

export interface ConsolidatedBalanceSheetResult {
  group: {
    id: string;
    name: string;
    code: string;
    reportingCurrency: string;
  };
  asOfDate: string;
  entities: ConsolidatedBSEntityColumn[];
  eliminations: {
    interCompanyReceivables: number;
    interCompanyPayables: number;
  };
  consolidated: {
    cashAndBank: number;
    accountsReceivable: number;
    inventory: number;
    fixedAssetsWdv: number;
    totalAssets: number;
    accountsPayable: number;
    taxPayable: number;
    totalLiabilities: number;
    shareCapital: number;
    retainedEarnings: number;
    nonControllingInterest: number;
    totalEquity: number;
    isBalanced: boolean;
    difference: number;
  };
}

export async function getConsolidatedBalanceSheet(
  groupId: string,
  asOfDateStr?: string
): Promise<{ success: true; data: ConsolidatedBalanceSheetResult } | { success: false; error: string }> {
  try {
    const group = await db.query.groupEntities.findFirst({
      where: eq(groupEntities.id, groupId),
      with: {
        memberships: {
          with: {
            shop: true,
          },
        },
        interCompanyTransactions: {
          where: eq(interCompanyTransactions.isEliminated, true),
        },
      },
    });

    if (!group) {
      return { success: false, error: "Holding group entity not found." };
    }

    const cutoff = asOfDateStr ? new Date(asOfDateStr) : new Date();

    const entityColumns: ConsolidatedBSEntityColumn[] = [];
    let sumCash = 0;
    let sumAR = 0;
    let sumInv = 0;
    let sumFA = 0;
    let sumAP = 0;
    let sumTax = 0;
    let sumEquity = 0;
    let sumRE = 0;
    let totalNCI = 0;

    for (const member of group.memberships) {
      const bs = await getBalanceSheet(member.shopId, cutoff);
      const data = bs.success
        ? bs.data
        : {
            cashAndBank: 0,
            accountsReceivable: 0,
            inventoryValuation: 0,
            fixedAssetsWdv: 0,
            totalAssets: 0,
            accountsPayable: 0,
            taxPayable: 0,
            totalLiabilities: 0,
            openingBalanceEquity: 0,
            retainedEarnings: 0,
            currentPeriodNetProfit: 0,
            totalEquity: 0,
          };

      const ownership = parseFloat(member.ownershipPercentage || "100.00");

      entityColumns.push({
        shopId: member.shop.id,
        name: member.shop.name,
        slug: member.shop.slug,
        code: member.shop.code || member.shop.slug.slice(0, 4).toUpperCase(),
        entityType: member.entityType,
        ownershipPercentage: ownership,
        cashAndBank: data.cashAndBank,
        accountsReceivable: data.accountsReceivable,
        inventory: data.inventoryValuation,
        fixedAssetsWdv: data.fixedAssetsWdv,
        totalAssets: data.totalAssets,
        accountsPayable: data.accountsPayable,
        taxPayable: data.taxPayable,
        totalLiabilities: data.totalLiabilities,
        equity: data.openingBalanceEquity,
        retainedEarnings: data.retainedEarnings + data.currentPeriodNetProfit,
        totalEquity: data.totalEquity,
      });

      sumCash += data.cashAndBank;
      sumAR += data.accountsReceivable;
      sumInv += data.inventoryValuation;
      sumFA += data.fixedAssetsWdv;
      sumAP += data.accountsPayable;
      sumTax += data.taxPayable;
      sumEquity += data.openingBalanceEquity;
      sumRE += data.retainedEarnings + data.currentPeriodNetProfit;

      // Non-Controlling Interest (NCI)
      if (ownership < 100 && member.entityType !== "PARENT") {
        const nciShare = (100 - ownership) / 100;
        totalNCI += data.totalEquity * nciShare;
      }
    }

    // 2. Inter-Company Eliminations
    // Inter-company loans or unsettled inter-company invoices are eliminated from AR and AP
    let eliminatedAR = 0;
    let eliminatedAP = 0;

    for (const tx of group.interCompanyTransactions) {
      const amt = parseFloat(tx.amount || "0");
      if (tx.transactionType === "INTER_COMPANY_LOAN" || tx.sourceDocumentId || tx.targetBillId) {
        eliminatedAR += amt;
        eliminatedAP += amt;
      }
    }

    // 3. Consolidated Balance Sheet Aggregations
    const consolidatedAR = Math.max(0, sumAR - eliminatedAR);
    const consolidatedAP = Math.max(0, sumAP - eliminatedAP);
    const consolidatedTotalAssets = sumCash + consolidatedAR + sumInv + sumFA;
    const consolidatedTotalLiabilities = consolidatedAP + sumTax;
    const consolidatedEquity = sumEquity;
    const consolidatedRE = sumRE;
    const consolidatedTotalEquity = consolidatedEquity + consolidatedRE + totalNCI;

    const difference = Math.abs(consolidatedTotalAssets - (consolidatedTotalLiabilities + consolidatedTotalEquity));
    const isBalanced = difference < 2.0; // Rounding tolerance

    return {
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          code: group.code,
          reportingCurrency: group.reportingCurrency,
        },
        asOfDate: cutoff.toLocaleDateString("en-KE", { dateStyle: "long" }),
        entities: entityColumns,
        eliminations: {
          interCompanyReceivables: eliminatedAR,
          interCompanyPayables: eliminatedAP,
        },
        consolidated: {
          cashAndBank: sumCash,
          accountsReceivable: consolidatedAR,
          inventory: sumInv,
          fixedAssetsWdv: sumFA,
          totalAssets: consolidatedTotalAssets,
          accountsPayable: consolidatedAP,
          taxPayable: sumTax,
          totalLiabilities: consolidatedTotalLiabilities,
          shareCapital: consolidatedEquity,
          retainedEarnings: consolidatedRE,
          nonControllingInterest: totalNCI,
          totalEquity: consolidatedTotalEquity,
          isBalanced,
          difference,
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate consolidated Balance Sheet." };
  }
}
