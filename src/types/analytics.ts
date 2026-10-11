// src/types/analytics.ts
/**
 * Pure TypeScript domain definitions for Workspace Analytics & BI.
 */

export type TimeframeFilter = "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "ALL_TIME";

export interface AnalyticsData {
  timeframe: TimeframeFilter;
  currency: string;
  activeFiscalYearLabel?: string;
  activeFiscalYearId?: string;

  // Executive KPIs
  totalSettledInflow: number;
  totalSettledOutflow: number;
  netOperatingCashFlow: number;
  totalCostOfGoodsSold: number;
  totalOperatingExpenses: number;
  totalOtherIncome: number;
  netGrossProfit: number;
  netOperatingProfit: number;
  netIncome: number;
  grossProfitMargin: number;
  pendingReceivables: number;
  accountsPayableDebt: number;

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

  // 12-Month Rolling Trajectory
  twelveMonthTimeline: {
    monthLabel: string;
    inflow: number;
    outflow: number;
    netProfit: number;
  }[];

  // Top 10 Clients Leaderboard
  topTenClients: {
    id: string;
    name: string;
    ltv: number;
    revenueSharePercent: number;
    invoiceCount: number;
  }[];

  // Product vs Service Revenue Split
  productServiceSplit: {
    productRevenue: number;
    serviceRevenue: number;
    totalRevenue: number;
    productPercent: number;
    servicePercent: number;
  };

  // Quotation Pipeline & Conversion
  quotationConversion: {
    totalQuotesIssued: number;
    totalQuotesAcceptedOrConverted: number;
    conversionRatePercent: number;
    totalQuotedValue: number;
    totalConvertedValue: number;
  };

  outstandingInvoices?: {
    id: string;
    docNumber: string;
    clientName: string;
    issueDate: string;
    dueDate: string | null;
    ageInDays: number;
    amount: number;
  }[];
}
