"use server";

import { db } from "@/db";
import { documents, documentItems, clients, suppliers, products, shops } from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { calculateDocumentTotals } from "@/lib/utils";

export type TimeframeFilter = "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "ALL_TIME";

export interface AnalyticsData {
  timeframe: TimeframeFilter;
  currency: string;
  
  // Executive KPIs
  totalSettledInflow: number; // Receipts + Paid Invoices
  totalSettledOutflow: number; // Paid LPOs + POs + Payment Vouchers
  netOperatingCashFlow: number; // Inflow - Outflow
  totalCostOfGoodsSold: number; // COGS
  netGrossProfit: number; // Inflow - COGS
  grossProfitMargin: number; // Profit Margin %
  pendingReceivables: number; // Sent + Overdue Invoices
  accountsPayableDebt: number; // Sent + Overdue LPOs/POs

  // Monthly Timeline Stream (Last 6 Months)
  monthlyTimeline: {
    monthLabel: string;
    inflow: number;
    outflow: number;
  }[];

  // KRA 20th VAT Return Tracker
  kraVatSummary: {
    daysRemaining: number;
    currentMonthName: string;
    outputVat16: number;
    zeroRatedVolume: number;
    exemptVolume: number;
    taxableSalesVolume: number;
  };

  // Accounts Receivable Aging Matrix
  arAging: {
    current0To30: number;
    due31To60: number;
    late61To90: number;
    overdue90Plus: number;
    totalAr: number;
  };

  // Product Sales Velocity (Top Bestsellers)
  topProducts: {
    id: string;
    name: string;
    quantitySold: number;
    revenueGenerated: number;
    revenueSharePercent: number;
  }[];

  // Client LTV & Concentration
  topClients: {
    id: string;
    name: string;
    ltv: number;
    revenueSharePercent: number;
  }[];
}

/**
 * Aggregates workspace billing ledgers into real-time business intelligence analytics.
 */
export async function getWorkspaceAnalyticsData(
  shopId: string,
  timeframe: TimeframeFilter = "THIS_MONTH"
): Promise<{ success: true; data: AnalyticsData } | { success: false; error: string }> {
  try {
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!shop) {
      return { success: false, error: "Target workspace node not found." };
    }

    // 1. Calculate Date Range Boundaries based on Timeframe
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (timeframe === "THIS_MONTH") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeframe === "LAST_MONTH") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (timeframe === "THIS_QUARTER") {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1);
      endDate = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59);
    } else if (timeframe === "THIS_YEAR") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    // 2. Query All Workspace Documents
    const allDocs = await db.query.documents.findMany({
      where: eq(documents.shopId, shopId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        client: true,
        supplier: true,
      },
    });

    // 3. Filter Documents for selected Timeframe
    const filteredDocs = allDocs.filter((d) => {
      const issue = new Date(d.issueDate);
      if (startDate && issue < startDate) return false;
      if (endDate && issue > endDate) return false;
      return true;
    });

    // 4. Compute Executive KPIs
    let totalSettledInflow = 0;
    let totalSettledOutflow = 0;
    let totalCostOfGoodsSold = 0;
    let pendingReceivables = 0;
    let accountsPayableDebt = 0;

    filteredDocs.forEach((d) => {
      const val = parseFloat(d.grandTotal || "0");
      const isSales = d.type === "INVOICE" || d.type === "RECEIPT" || d.type === "QUOTATION";
      const isOutflow = d.type === "LPO" || d.type === "PO" || d.type === "PAYMENT_VOUCHER" || d.type === "GOODS_RECEIVED_NOTE" || d.type === "PAYROLL_VOUCHER";

      if (d.status === "PAID" || d.type === "RECEIPT") {
        if (isSales) {
          totalSettledInflow += val;
          d.items.forEach((item) => {
            const qty = parseFloat(item.quantity || "1");
            const cost = parseFloat(item.product?.costPrice || "0");
            totalCostOfGoodsSold += qty * cost;
          });
        } else if (isOutflow) {
          totalSettledOutflow += val;
        }
      } else if (d.status === "ISSUED" || d.status === "OVERDUE") {
        if (isSales) pendingReceivables += val;
        else if (isOutflow && d.type !== "PAYROLL_VOUCHER") accountsPayableDebt += val;
      }
    });

    const netOperatingCashFlow = totalSettledInflow - totalSettledOutflow;
    const netGrossProfit = totalSettledInflow - totalCostOfGoodsSold;
    const grossProfitMargin = totalSettledInflow > 0 ? (netGrossProfit / totalSettledInflow) * 100 : 0;

    // 5. Compute Monthly Timeline Stream (Last 6 Months)
    const monthlyTimelineMap: Record<string, { inflow: number; outflow: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).toUpperCase();
      monthlyTimelineMap[label] = { inflow: 0, outflow: 0 };
    }

    allDocs.forEach((d) => {
      const issue = new Date(d.issueDate);
      const label = issue.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).toUpperCase();
      if (monthlyTimelineMap[label]) {
        const val = parseFloat(d.grandTotal || "0");
        const isSales = d.type === "INVOICE" || d.type === "RECEIPT";
        const isOutflow = d.type === "LPO" || d.type === "PO" || d.type === "PAYMENT_VOUCHER" || d.type === "PAYROLL_VOUCHER";

        if (d.status === "PAID" || d.type === "RECEIPT") {
          if (isSales) monthlyTimelineMap[label].inflow += val;
          else if (isOutflow) monthlyTimelineMap[label].outflow += val;
        }
      }
    });

    const monthlyTimeline = Object.entries(monthlyTimelineMap).map(([monthLabel, data]) => ({
      monthLabel,
      inflow: data.inflow,
      outflow: data.outflow,
    }));

    // 6. Compute Statutory KRA 20th VAT Return Tracker (Current Calendar Month)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const deadline20th = new Date(now.getFullYear(), now.getMonth(), 20);
    let diffDays = Math.ceil((deadline20th.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) {
      // If past 20th of current month, point to 20th of next month
      const nextMonth20 = new Date(now.getFullYear(), now.getMonth() + 1, 20);
      diffDays = Math.ceil((nextMonth20.getTime() - now.getTime()) / (1000 * 3600 * 24));
    }

    let outputVat16 = 0;
    let zeroRatedVolume = 0;
    let exemptVolume = 0;
    let taxableSalesVolume = 0;

    allDocs.forEach((d) => {
      const issue = new Date(d.issueDate);
      if (issue >= currentMonthStart && issue <= currentMonthEnd && (d.type === "INVOICE" || d.type === "RECEIPT")) {
        const docTax = parseFloat(d.taxAmount || "0");
        outputVat16 += docTax;

        d.items.forEach((item) => {
          const itemVal = parseFloat(item.itemTotal || "0");
          if (item.taxType === "V_16") taxableSalesVolume += itemVal;
          else if (item.taxType === "V_0") zeroRatedVolume += itemVal;
          else if (item.taxType === "EXEMPT") exemptVolume += itemVal;
        });
      }
    });

    const kraVatSummary = {
      daysRemaining: diffDays,
      currentMonthName: now.toLocaleDateString("en-KE", { month: "long", year: "numeric" }).toUpperCase(),
      outputVat16,
      zeroRatedVolume,
      exemptVolume,
      taxableSalesVolume,
    };

    // 7. Compute Accounts Receivable (A/R) Aging Matrix
    let current0To30 = 0;
    let due31To60 = 0;
    let late61To90 = 0;
    let overdue90Plus = 0;

    allDocs.forEach((d) => {
      if ((d.type === "INVOICE") && (d.status === "ISSUED" || d.status === "OVERDUE")) {
        const val = parseFloat(d.grandTotal || "0");
        const issue = new Date(d.issueDate);
        const ageInDays = Math.floor((now.getTime() - issue.getTime()) / (1000 * 3600 * 24));

        if (ageInDays <= 30) current0To30 += val;
        else if (ageInDays <= 60) due31To60 += val;
        else if (ageInDays <= 90) late61To90 += val;
        else overdue90Plus += val;
      }
    });

    const totalAr = current0To30 + due31To60 + late61To90 + overdue90Plus;

    const arAging = {
      current0To30,
      due31To60,
      late61To90,
      overdue90Plus,
      totalAr,
    };

    // 8. Compute Product Sales Velocity (Top Bestsellers)
    const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    let totalSalesItemRevenue = 0;

    filteredDocs.forEach((d) => {
      if (d.type === "INVOICE" || d.type === "RECEIPT") {
        d.items.forEach((item) => {
          const rev = parseFloat(item.itemTotal || "0");
          const qty = parseFloat(item.quantity || "1");
          totalSalesItemRevenue += rev;

          const key = item.description.trim().toUpperCase();
          if (!productSalesMap[key]) {
            productSalesMap[key] = { name: item.description.trim(), qty: 0, revenue: 0 };
          }
          productSalesMap[key].qty += qty;
          productSalesMap[key].revenue += rev;
        });
      }
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p, idx) => ({
        id: `prod-${idx}`,
        name: p.name,
        quantitySold: p.qty,
        revenueGenerated: p.revenue,
        revenueSharePercent: totalSalesItemRevenue > 0 ? (p.revenue / totalSalesItemRevenue) * 100 : 0,
      }));

    // 9. Compute Client LTV & Concentration Ranking
    const clientLtvMap: Record<string, { id: string; name: string; ltv: number }> = {};
    let totalClientRevenue = 0;

    allDocs.forEach((d) => {
      if (d.client && (d.type === "RECEIPT" || (d.type === "INVOICE" && d.status === "PAID"))) {
        const val = parseFloat(d.grandTotal || "0");
        totalClientRevenue += val;

        if (!clientLtvMap[d.client.id]) {
          clientLtvMap[d.client.id] = { id: d.client.id, name: d.client.name, ltv: 0 };
        }
        clientLtvMap[d.client.id].ltv += val;
      }
    });

    const topClients = Object.values(clientLtvMap)
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        ltv: c.ltv,
        revenueSharePercent: totalClientRevenue > 0 ? (c.ltv / totalClientRevenue) * 100 : 0,
      }));

    return {
      success: true,
      data: {
        timeframe,
        currency: shop.currency,
        totalSettledInflow,
        totalSettledOutflow,
        netOperatingCashFlow,
        totalCostOfGoodsSold,
        netGrossProfit,
        grossProfitMargin,
        pendingReceivables,
        accountsPayableDebt,
        monthlyTimeline,
        kraVatSummary,
        arAging,
        topProducts,
        topClients,
      },
    };
  } catch (error) {
    console.error("Failed to compute workspace analytics:", error);
    return { success: false, error: "Failed to generate workspace business intelligence." };
  }
}
