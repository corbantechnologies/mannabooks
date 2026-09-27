"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  createGroupEntity,
  addShopToGroup,
  removeShopFromGroup,
  recordInterCompanyTransaction,
  toggleElimination,
  getConsolidatedPnL,
  getConsolidatedBalanceSheet,
  type ConsolidatedPnLResult,
  type ConsolidatedBalanceSheetResult,
} from "@/lib/actions/group-consolidation";
import type { ReportPeriod } from "@/lib/actions/reports";

export interface SerializedGroup {
  id: string;
  name: string;
  code: string;
  reportingCurrency: string;
  description: string | null;
  membersCount: number;
  transactionsCount: number;
}

export interface GroupMemberItem {
  id: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  shopCode: string | null;
  entityType: string;
  ownershipPercentage: number;
  joinedAt: string;
}

export interface GroupTransactionItem {
  id: string;
  sourceShopId: string;
  sourceShopName: string;
  targetShopId: string;
  targetShopName: string;
  amount: number;
  currency: string;
  transactionType: string;
  isEliminated: boolean;
  notes: string | null;
  createdAt: string;
}

export interface ActiveGroupDetails {
  id: string;
  name: string;
  code: string;
  reportingCurrency: string;
  description: string | null;
  members: GroupMemberItem[];
  transactions: GroupTransactionItem[];
}

export interface UserShopOption {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  currency: string;
}

interface GroupConsolidationClientProps {
  shopSlug: string;
  currentShop: {
    id: string;
    name: string;
    slug: string;
    currency: string;
  };
  groups: SerializedGroup[];
  activeGroupId: string | null;
  activeGroupDetails: ActiveGroupDetails | null;
  initialPnL: ConsolidatedPnLResult | null;
  initialBalanceSheet: ConsolidatedBalanceSheetResult | null;
  userShops: UserShopOption[];
}

export function GroupConsolidationClient({
  shopSlug,
  currentShop,
  groups,
  activeGroupId,
  activeGroupDetails,
  initialPnL,
  initialBalanceSheet,
  userShops,
}: GroupConsolidationClientProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(activeGroupId || groups[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"PNL" | "BALANCE_SHEET" | "ELIMINATIONS" | "MEMBERS">("PNL");
  const [period, setPeriod] = useState<ReportPeriod>("THIS_MONTH");
  const [pnlData, setPnlData] = useState<ConsolidatedPnLResult | null>(initialPnL);
  const [balanceSheetData, setBalanceSheetData] = useState<ConsolidatedBalanceSheetResult | null>(initialBalanceSheet);
  const [groupDetails, setGroupDetails] = useState<ActiveGroupDetails | null>(activeGroupDetails);
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRecordTxOpen, setIsRecordTxOpen] = useState(false);

  // Create Group Form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newGroupCurrency, setNewGroupCurrency] = useState(currentShop.currency || "KES");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Add Member Form
  const [memberShopId, setMemberShopId] = useState("");
  const [memberEntityType, setMemberEntityType] = useState<"SUBSIDIARY" | "SISTER" | "DIVISION">("SUBSIDIARY");
  const [memberOwnership, setMemberOwnership] = useState<number>(100);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Record Inter-Company Trade Form
  const [txSourceShopId, setTxSourceShopId] = useState("");
  const [txTargetShopId, setTxTargetShopId] = useState("");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txType, setTxType] = useState<"MANAGEMENT_SERVICES" | "PRODUCT_SUPPLY" | "SHARED_COST" | "INTER_COMPANY_LOAN">("MANAGEMENT_SERVICES");
  const [txNotes, setTxNotes] = useState("");
  const [recordTxError, setRecordTxError] = useState<string | null>(null);
  const [isRecordingTx, setIsRecordingTx] = useState(false);

  const activeGroup = groups.find((g) => g.id === selectedGroupId);
  const currency = activeGroup?.reportingCurrency || currentShop.currency || "KES";

  // Eligible shops that are not yet members
  const enrolledShopIds = new Set(groupDetails?.members.map((m) => m.shopId) || []);
  const eligibleShops = userShops.filter((s) => !enrolledShopIds.has(s.id));

  // Reload financial statements for chosen group and period
  async function refreshFinancials(groupId: string, newPeriod: ReportPeriod) {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const [pnlRes, bsRes] = await Promise.all([
        getConsolidatedPnL(groupId, newPeriod),
        getConsolidatedBalanceSheet(groupId),
      ]);
      if (pnlRes.success) setPnlData(pnlRes.data);
      if (bsRes.success) setBalanceSheetData(bsRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePeriodChange(p: ReportPeriod) {
    setPeriod(p);
    refreshFinancials(selectedGroupId, p);
  }

  function handleGroupSelect(gid: string) {
    setSelectedGroupId(gid);
    window.location.href = `/workspaces/${shopSlug}/finance/group-consolidation?groupId=${gid}`;
  }

  // Handle Create Group
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupCode.trim()) {
      setCreateGroupError("Please enter group name and corporate code.");
      return;
    }

    setIsCreatingGroup(true);
    setCreateGroupError(null);

    try {
      const res = await createGroupEntity(shopSlug, {
        name: newGroupName,
        code: newGroupCode,
        reportingCurrency: newGroupCurrency,
        description: newGroupDesc,
      });

      if (!res.success) {
        setCreateGroupError(res.error || "Failed to create group entity.");
        setIsCreatingGroup(false);
        return;
      }

      window.location.href = `/workspaces/${shopSlug}/finance/group-consolidation?groupId=${res.groupId}`;
    } catch (err: any) {
      setCreateGroupError(err.message || "Failed to create group entity.");
    } finally {
      setIsCreatingGroup(false);
    }
  }

  // Handle Add Member
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!memberShopId) {
      setAddMemberError("Please select a workspace entity to enroll.");
      return;
    }

    setIsAddingMember(true);
    setAddMemberError(null);

    try {
      const res = await addShopToGroup(shopSlug, {
        groupId: selectedGroupId,
        shopId: memberShopId,
        entityType: memberEntityType,
        ownershipPercentage: memberOwnership,
      });

      if (!res.success) {
        setAddMemberError(res.error || "Failed to enroll entity.");
        setIsAddingMember(false);
        return;
      }

      setIsAddMemberOpen(false);
      window.location.reload();
    } catch (err: any) {
      setAddMemberError(err.message || "Failed to enroll entity.");
    } finally {
      setIsAddingMember(false);
    }
  }

  // Handle Remove Member
  async function handleRemoveMember(membershipId: string, name: string) {
    if (!confirm(`Remove entity "${name}" from this holding group consolidation?`)) {
      return;
    }

    try {
      const res = await removeShopFromGroup(shopSlug, membershipId);
      if (!res.success) {
        alert(res.error || "Failed to remove member");
        return;
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  }

  // Handle Record Inter-Company Trade
  async function handleRecordTx(e: React.FormEvent) {
    e.preventDefault();
    if (!txSourceShopId || !txTargetShopId) {
      setRecordTxError("Please select both provider/seller and recipient/buyer entities.");
      return;
    }
    if (txSourceShopId === txTargetShopId) {
      setRecordTxError("Provider and Recipient must be distinct corporate entities.");
      return;
    }
    const val = parseFloat(txAmount);
    if (!val || val <= 0) {
      setRecordTxError("Please enter a positive transaction amount.");
      return;
    }

    setIsRecordingTx(true);
    setRecordTxError(null);

    try {
      const res = await recordInterCompanyTransaction(shopSlug, {
        groupId: selectedGroupId,
        sourceShopId: txSourceShopId,
        targetShopId: txTargetShopId,
        amount: val,
        currency,
        transactionType: txType,
        notes: txNotes,
      });

      if (!res.success) {
        setRecordTxError(res.error || "Failed to record inter-company transaction.");
        setIsRecordingTx(false);
        return;
      }

      setIsRecordTxOpen(false);
      setTxAmount("");
      setTxNotes("");
      window.location.reload();
    } catch (err: any) {
      setRecordTxError(err.message || "Failed to record inter-company transaction.");
    } finally {
      setIsRecordingTx(false);
    }
  }

  // Handle Toggle Elimination
  async function handleToggleElimination(txId: string, currentStatus: boolean) {
    try {
      const res = await toggleElimination(shopSlug, txId, !currentStatus);
      if (!res.success) {
        alert(res.error || "Failed to update elimination status.");
        return;
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to update elimination status.");
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP HOLDING GROUP SELECTOR & CONTROLS */}
      <div className="surface p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold">Active Group:</label>
            {groups.length > 0 ? (
              <select
                value={selectedGroupId}
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold font-sans rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code}) — {g.reportingCurrency}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-zinc-500 italic">No holding groups configured</span>
            )}

            {activeGroup && (
              <div className="flex items-center gap-2">
                <span className="badge-indigo px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                  {activeGroup.code}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {groupDetails?.members.length || 0} Entities | {groupDetails?.transactions.length || 0} Inter-Co Trades
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <span>+</span>
              <span>New Group</span>
            </button>
            {activeGroup && (
              <>
                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <span>🏢</span>
                  <span>Enroll Subsidiary</span>
                </button>
                <button
                  onClick={() => {
                    if (groupDetails?.members && groupDetails.members.length >= 2) {
                      setTxSourceShopId(groupDetails.members[0].shopId);
                      setTxTargetShopId(groupDetails.members[1].shopId);
                    }
                    setIsRecordTxOpen(true);
                  }}
                  className="btn-primary-modern px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
                >
                  <span>🔄</span>
                  <span>Inter-Co Trade</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Period Selector Tabs */}
        {activeGroup && (
          <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono text-zinc-400 mr-2">Consolidation Period:</span>
              {(["THIS_MONTH", "THIS_QUARTER", "THIS_YEAR"] as ReportPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    period === p ? "bg-zinc-900 text-white font-semibold" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {p.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1 text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-md font-sans"
              >
                🖨️ Print Statement
              </button>
            </div>
          </div>
        )}
      </div>

      {!activeGroup && (
        <div className="surface p-12 text-center rounded-2xl border border-zinc-200 bg-white space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-xl">
            🏛️
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">No Holding Entity Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              Create a Group Holding entity to connect your operating companies (e.g., Company A and Company B), track
              inter-company management fees, and generate consolidated financial statements.
            </p>
          </div>
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="btn-primary-modern px-5 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            + Create First Holding Group
          </button>
        </div>
      )}

      {activeGroup && (
        <>
          {/* 2. STATS OVERVIEW CARDS */}
          {activeTab === "PNL" && pnlData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Consolidated Revenue</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">
                  {formatCurrency(pnlData.consolidated.totalRevenue, currency)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">After inter-company sales elimination</p>
              </div>

              <div className="surface p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                <p className="text-[11px] font-mono uppercase tracking-wider text-amber-800 font-semibold">
                  Eliminated Transactions
                </p>
                <p className="text-xl font-bold text-amber-900 mt-1">
                  {formatCurrency(pnlData.eliminations.salesRevenue, currency)}
                </p>
                <p className="text-[11px] text-amber-700/80 mt-1">Inter-co sales & service charges</p>
              </div>

              <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Operating Margin</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">
                  {pnlData.consolidated.grossProfitMargin.toFixed(1)}%
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Gross: {formatCurrency(pnlData.consolidated.grossProfit, currency)}
                </p>
              </div>

              <div className="surface p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                  Group Net Profit
                </p>
                <p className="text-xl font-bold text-emerald-900 mt-1">
                  {formatCurrency(pnlData.consolidated.groupNetIncome, currency)}
                </p>
                <p className="text-[11px] text-emerald-700/90 mt-1">Attributable to Parent Holding</p>
              </div>
            </div>
          )}

          {activeTab === "BALANCE_SHEET" && balanceSheetData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Group Assets</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">
                  {formatCurrency(balanceSheetData.consolidated.totalAssets, currency)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Cash, AR, Stock & Fixed Assets</p>
              </div>

              <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Group Liabilities</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">
                  {formatCurrency(balanceSheetData.consolidated.totalLiabilities, currency)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Accounts Payable & Tax Obligations</p>
              </div>

              <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Consolidated Equity</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">
                  {formatCurrency(balanceSheetData.consolidated.totalEquity, currency)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Share Capital, Reserves & NCI</p>
              </div>

              <div
                className={`surface p-4 rounded-xl border ${
                  balanceSheetData.consolidated.isBalanced
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-rose-200 bg-rose-50/40"
                }`}
              >
                <p
                  className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                    balanceSheetData.consolidated.isBalanced ? "text-emerald-800" : "text-rose-800"
                  }`}
                >
                  Balance Reconciliation
                </p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    balanceSheetData.consolidated.isBalanced ? "text-emerald-900" : "text-rose-900"
                  }`}
                >
                  {balanceSheetData.consolidated.isBalanced ? "✓ Balanced" : "⚠️ Variance"}
                </p>
                <p className="text-[11px] opacity-80 mt-1">
                  Diff: {formatCurrency(balanceSheetData.consolidated.difference, currency)}
                </p>
              </div>
            </div>
          )}

          {/* 3. REPORT VIEW TABS */}
          <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto text-xs">
            {[
              { id: "PNL", label: "Consolidated P&L Statement" },
              { id: "BALANCE_SHEET", label: "Consolidated Balance Sheet" },
              { id: "ELIMINATIONS", label: `Inter-Co Eliminations (${groupDetails?.transactions.length || 0})` },
              { id: "MEMBERS", label: `Group Entities (${groupDetails?.members.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-black text-black font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4. MULTI-COLUMN CONSOLIDATED P&L SPREADSHEET */}
          {activeTab === "PNL" && pnlData && (
            <div className="surface overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="p-3.5 border-r border-zinc-200 font-sans font-bold text-zinc-900 w-64">
                      Line Item (P&L)
                    </th>
                    {pnlData.entities.map((ent) => (
                      <th key={ent.shopId} className="p-3 border-r border-zinc-200 text-right min-w-[130px]">
                        <span className="block font-bold text-zinc-900">{ent.name}</span>
                        <span className="text-[9px] text-zinc-400 normal-case">
                          {ent.entityType} ({ent.ownershipPercentage}%)
                        </span>
                      </th>
                    ))}
                    <th className="p-3 border-r border-zinc-200 text-right min-w-[130px] bg-amber-50/70 text-amber-900 font-bold">
                      Eliminations
                    </th>
                    <th className="p-3.5 text-right min-w-[150px] bg-zinc-900 text-white font-bold">
                      Consolidated Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {/* REVENUE SECTION */}
                  <tr className="bg-zinc-50/50">
                    <td colSpan={pnlData.entities.length + 3} className="px-3.5 py-2 font-bold font-sans text-zinc-900">
                      Operating Revenue
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Gross Sales Revenue</td>
                    {pnlData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.salesRevenue, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-amber-800">
                      -{formatCurrency(pnlData.eliminations.salesRevenue, currency)}
                    </td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(pnlData.consolidated.totalRevenue, currency)}
                    </td>
                  </tr>

                  {/* COGS */}
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Cost of Goods Sold (COGS)</td>
                    {pnlData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right text-zinc-600">
                        ({formatCurrency(e.cogs, currency)})
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-700 bg-zinc-50/40">
                      ({formatCurrency(pnlData.consolidated.cogs, currency)})
                    </td>
                  </tr>

                  {/* GROSS PROFIT */}
                  <tr className="bg-zinc-100/70 font-semibold">
                    <td className="px-3.5 py-2.5 border-r border-zinc-200 text-zinc-900 font-sans">Gross Profit</td>
                    {pnlData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2.5 border-r border-zinc-200 text-right">
                        {formatCurrency(e.grossProfit, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 border-r border-zinc-200 text-right bg-amber-50/60 text-amber-800">
                      -{formatCurrency(pnlData.eliminations.salesRevenue, currency)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-zinc-900 bg-zinc-100">
                      {formatCurrency(pnlData.consolidated.grossProfit, currency)}
                    </td>
                  </tr>

                  {/* OPERATING EXPENSES */}
                  <tr className="bg-zinc-50/50">
                    <td colSpan={pnlData.entities.length + 3} className="px-3.5 py-2 font-bold font-sans text-zinc-900">
                      Operating Expenses
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Total Operating Expenses</td>
                    {pnlData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right text-zinc-600">
                        {formatCurrency(e.operatingExpenses, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-amber-800">
                      -{formatCurrency(pnlData.eliminations.expenses, currency)}
                    </td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-700 bg-zinc-50/40">
                      {formatCurrency(pnlData.consolidated.operatingExpenses, currency)}
                    </td>
                  </tr>

                  {/* NET OPERATING PROFIT */}
                  <tr className="bg-zinc-100/80 font-bold border-t-2 border-zinc-300">
                    <td className="px-3.5 py-2.5 border-r border-zinc-200 text-zinc-900 font-sans">
                      Net Operating Profit
                    </td>
                    {pnlData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2.5 border-r border-zinc-200 text-right text-zinc-900">
                        {formatCurrency(e.netOperatingProfit, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 border-r border-zinc-200 text-right bg-amber-50 text-amber-900">
                      0.00
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-emerald-800 bg-zinc-100">
                      {formatCurrency(pnlData.consolidated.netOperatingProfit, currency)}
                    </td>
                  </tr>

                  {/* MINORITY INTEREST */}
                  {pnlData.consolidated.minorityInterest > 0 && (
                    <tr>
                      <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-500 italic">
                        Less: Non-Controlling / Minority Interest Share
                      </td>
                      {pnlData.entities.map((e) => (
                        <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right text-zinc-400">
                          {e.ownershipPercentage < 100
                            ? `(${formatCurrency(e.netIncome * ((100 - e.ownershipPercentage) / 100), currency)})`
                            : "—"}
                        </td>
                      ))}
                      <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                      <td className="px-3.5 py-2 text-right text-rose-700 bg-zinc-50/40">
                        ({formatCurrency(pnlData.consolidated.minorityInterest, currency)})
                      </td>
                    </tr>
                  )}

                  {/* GROUP NET INCOME */}
                  <tr className="bg-zinc-900 text-white font-bold border-t-2 border-black">
                    <td className="px-3.5 py-3 border-r border-zinc-800 font-sans">
                      Group Net Profit Attributable to Holding Parent
                    </td>
                    {pnlData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-3 border-r border-zinc-800 text-right">
                        {formatCurrency(e.netIncome, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-3 border-r border-zinc-800 text-right text-amber-300">0.00</td>
                    <td className="px-3.5 py-3 text-right text-emerald-400 text-sm">
                      {formatCurrency(pnlData.consolidated.groupNetIncome, currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 5. MULTI-COLUMN CONSOLIDATED BALANCE SHEET SPREADSHEET */}
          {activeTab === "BALANCE_SHEET" && balanceSheetData && (
            <div className="surface overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="p-3.5 border-r border-zinc-200 font-sans font-bold text-zinc-900 w-64">
                      Balance Sheet Classification
                    </th>
                    {balanceSheetData.entities.map((ent) => (
                      <th key={ent.shopId} className="p-3 border-r border-zinc-200 text-right min-w-[130px]">
                        <span className="block font-bold text-zinc-900">{ent.name}</span>
                        <span className="text-[9px] text-zinc-400 normal-case">
                          {ent.entityType} ({ent.ownershipPercentage}%)
                        </span>
                      </th>
                    ))}
                    <th className="p-3 border-r border-zinc-200 text-right min-w-[130px] bg-amber-50/70 text-amber-900 font-bold">
                      Eliminations
                    </th>
                    <th className="p-3.5 text-right min-w-[150px] bg-zinc-900 text-white font-bold">
                      Consolidated Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {/* ASSETS */}
                  <tr className="bg-zinc-50/50">
                    <td colSpan={balanceSheetData.entities.length + 3} className="px-3.5 py-2 font-bold font-sans text-zinc-900">
                      Assets
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Cash and Cash Equivalents</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.cashAndBank, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(balanceSheetData.consolidated.cashAndBank, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Accounts Receivable</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.accountsReceivable, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-amber-800">
                      -{formatCurrency(balanceSheetData.eliminations.interCompanyReceivables, currency)}
                    </td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(balanceSheetData.consolidated.accountsReceivable, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Inventory Valuation</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.inventory, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(balanceSheetData.consolidated.inventory, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Property, Plant & Fixed Assets WDV</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.fixedAssetsWdv, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(balanceSheetData.consolidated.fixedAssetsWdv, currency)}
                    </td>
                  </tr>
                  <tr className="bg-zinc-100/70 font-bold border-t border-zinc-200">
                    <td className="px-3.5 py-2.5 border-r border-zinc-200 text-zinc-900 font-sans">Total Assets</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2.5 border-r border-zinc-200 text-right text-zinc-900">
                        {formatCurrency(e.totalAssets, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 border-r border-zinc-200 text-right bg-amber-50 text-amber-900">
                      -{formatCurrency(balanceSheetData.eliminations.interCompanyReceivables, currency)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-zinc-900 bg-zinc-100">
                      {formatCurrency(balanceSheetData.consolidated.totalAssets, currency)}
                    </td>
                  </tr>

                  {/* LIABILITIES */}
                  <tr className="bg-zinc-50/50">
                    <td colSpan={balanceSheetData.entities.length + 3} className="px-3.5 py-2 font-bold font-sans text-zinc-900">
                      Liabilities
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Accounts Payable (AP)</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.accountsPayable, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-amber-800">
                      -{formatCurrency(balanceSheetData.eliminations.interCompanyPayables, currency)}
                    </td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(balanceSheetData.consolidated.accountsPayable, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Statutory Tax Payable (VAT/WHT)</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.taxPayable, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(balanceSheetData.consolidated.taxPayable, currency)}
                    </td>
                  </tr>
                  <tr className="bg-zinc-100/70 font-semibold border-t border-zinc-200">
                    <td className="px-3.5 py-2.5 border-r border-zinc-200 text-zinc-900 font-sans">Total Liabilities</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2.5 border-r border-zinc-200 text-right">
                        {formatCurrency(e.totalLiabilities, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 border-r border-zinc-200 text-right bg-amber-50 text-amber-900">
                      -{formatCurrency(balanceSheetData.eliminations.interCompanyPayables, currency)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-zinc-900 bg-zinc-100">
                      {formatCurrency(balanceSheetData.consolidated.totalLiabilities, currency)}
                    </td>
                  </tr>

                  {/* EQUITY */}
                  <tr className="bg-zinc-50/50">
                    <td colSpan={balanceSheetData.entities.length + 3} className="px-3.5 py-2 font-bold font-sans text-zinc-900">
                      Equity
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Share Capital / Contributed Equity</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.equity, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(balanceSheetData.consolidated.shareCapital, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-700">Retained Earnings (Accumulated)</td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right">
                        {formatCurrency(e.retainedEarnings, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                    <td className="px-3.5 py-2 text-right font-bold text-zinc-900 bg-zinc-50/40">
                      {formatCurrency(balanceSheetData.consolidated.retainedEarnings, currency)}
                    </td>
                  </tr>
                  {balanceSheetData.consolidated.nonControllingInterest > 0 && (
                    <tr>
                      <td className="px-3.5 py-2 border-r border-zinc-100 text-zinc-500 italic">
                        Non-Controlling / Minority Interest (NCI)
                      </td>
                      {balanceSheetData.entities.map((e) => (
                        <td key={e.shopId} className="px-3 py-2 border-r border-zinc-100 text-right text-zinc-400">
                          {e.ownershipPercentage < 100
                            ? formatCurrency(e.totalEquity * ((100 - e.ownershipPercentage) / 100), currency)
                            : "—"}
                        </td>
                      ))}
                      <td className="px-3 py-2 border-r border-zinc-100 text-right bg-amber-50/30 text-zinc-400">—</td>
                      <td className="px-3.5 py-2 text-right text-zinc-700 bg-zinc-50/40">
                        {formatCurrency(balanceSheetData.consolidated.nonControllingInterest, currency)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-zinc-900 text-white font-bold border-t-2 border-black">
                    <td className="px-3.5 py-3 border-r border-zinc-800 font-sans">
                      Total Liabilities & Group Equity
                    </td>
                    {balanceSheetData.entities.map((e) => (
                      <td key={e.shopId} className="px-3 py-3 border-r border-zinc-800 text-right">
                        {formatCurrency(e.totalLiabilities + e.totalEquity, currency)}
                      </td>
                    ))}
                    <td className="px-3 py-3 border-r border-zinc-800 text-right text-amber-300">
                      -{formatCurrency(balanceSheetData.eliminations.interCompanyPayables, currency)}
                    </td>
                    <td className="px-3.5 py-3 text-right text-emerald-400 text-sm">
                      {formatCurrency(
                        balanceSheetData.consolidated.totalLiabilities + balanceSheetData.consolidated.totalEquity,
                        currency
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 6. INTER-COMPANY ELIMINATIONS TABLE */}
          {activeTab === "ELIMINATIONS" && groupDetails && (
            <div className="surface overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Inter-Company Elimination Ledger</h3>
                  <p className="text-xs text-zinc-500">
                    Track billing, shared services, and loans between member entities. Eliminated transactions cancel out
                    equal parts revenue and expense.
                  </p>
                </div>
                <button
                  onClick={() => setIsRecordTxOpen(true)}
                  className="btn-primary-modern px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider"
                >
                  + Record Inter-Co Trade
                </button>
              </div>

              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-50">
                    <th className="p-3">Source (Provider / Seller)</th>
                    <th className="p-3">Target (Recipient / Buyer)</th>
                    <th className="p-3">Transaction Type</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Elimination Status</th>
                    <th className="p-3">Notes / Agreement</th>
                    <th className="p-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {groupDetails.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50">
                      <td className="p-3 font-sans font-bold text-zinc-900">{tx.sourceShopName}</td>
                      <td className="p-3 font-sans font-medium text-zinc-700">{tx.targetShopName}</td>
                      <td className="p-3">
                        <span className="badge-indigo px-2 py-0.5 rounded text-[10px]">
                          {tx.transactionType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-zinc-900">
                        {formatCurrency(tx.amount, tx.currency || currency)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleElimination(tx.id, tx.isEliminated)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                            tx.isEliminated
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200"
                          }`}
                          title="Click to toggle elimination"
                        >
                          {tx.isEliminated ? "✓ Eliminated" : "○ Included"}
                        </button>
                      </td>
                      <td className="p-3 text-zinc-500 font-sans text-[11px] max-w-xs truncate">
                        {tx.notes || "—"}
                      </td>
                      <td className="p-3 text-right text-zinc-400">
                        {new Date(tx.createdAt).toLocaleDateString("en-KE")}
                      </td>
                    </tr>
                  ))}

                  {groupDetails.transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-zinc-400">
                        No inter-company transactions recorded. Use the "Inter-Co Trade" button to log shared services,
                        loans, or billing between Company A and Company B.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. GROUP MEMBERS & OWNERSHIP STRUCTURE */}
          {activeTab === "MEMBERS" && groupDetails && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Corporate Entity Hierarchy</h3>
                  <p className="text-xs text-zinc-500">
                    Member workspaces whose general ledgers feed into the holding company consolidation.
                  </p>
                </div>
                {eligibleShops.length > 0 && (
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="btn-primary-modern px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider"
                  >
                    + Enroll Subsidiary
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groupDetails.members.map((m) => (
                  <div key={m.id} className="surface p-5 rounded-2xl border border-zinc-200 bg-white space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-zinc-900 text-sm">{m.shopName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              m.entityType === "PARENT"
                                ? "badge-indigo"
                                : m.entityType === "SUBSIDIARY"
                                ? "badge-emerald"
                                : "badge-amber"
                            }`}
                          >
                            {m.entityType}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Code: {m.shopCode || m.shopSlug}</p>
                      </div>

                      {m.entityType !== "PARENT" && (
                        <button
                          onClick={() => handleRemoveMember(m.id, m.shopName)}
                          className="text-zinc-400 hover:text-rose-600 text-xs p-1"
                          title="Remove from group"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Ownership Stake:</span>
                        <span className="font-mono font-bold text-zinc-900">{m.ownershipPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Minority Share:</span>
                        <span className="font-mono text-zinc-600">
                          {m.ownershipPercentage < 100 ? `${(100 - m.ownershipPercentage).toFixed(2)}%` : "0.00%"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Enrolled:</span>
                        <span className="font-mono text-zinc-400">{new Date(m.joinedAt).toLocaleDateString("en-KE")}</span>
                      </div>
                    </div>

                    <Link
                      href={`/workspaces/${m.shopSlug}/finance/reports/pl`}
                      className="block text-center py-1.5 text-[11px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                    >
                      View Entity Workspace →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 8. CREATE GROUP MODAL */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Create Holding / Group Entity</h3>
                <p className="text-xs text-zinc-500">Consolidate multiple businesses under a parent holding umbrella.</p>
              </div>
              <button onClick={() => setIsCreateGroupOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                ✕
              </button>
            </div>

            {createGroupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {createGroupError}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Holding Group Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corban Holdings Group"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Corporate Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CHG"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono uppercase rounded-lg border border-zinc-200 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Reporting Currency</label>
                  <select
                    value={newGroupCurrency}
                    onChange={(e) => setNewGroupCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white font-mono"
                  >
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="UGX">UGX — Uganda Shilling</option>
                    <option value="TZS">TZS — Tanzania Shilling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Description / Corporate Mission</label>
                <textarea
                  rows={2}
                  placeholder="Holding company governing retail and professional services subsidiaries..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white"
                />
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl text-[11px] text-zinc-600">
                💡 <span className="font-semibold">{currentShop.name}</span> will automatically be designated as the
                initial <span className="font-bold">PARENT</span> entity in this holding structure.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGroup}
                  className="btn-primary-modern px-5 py-2 font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {isCreatingGroup ? "Creating..." : "Establish Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. ENROLL SUBSIDIARY MODAL */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Enroll Subsidiary into Group</h3>
                <p className="text-xs text-zinc-500">Group: {activeGroup?.name}</p>
              </div>
              <button onClick={() => setIsAddMemberOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                ✕
              </button>
            </div>

            {addMemberError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {addMemberError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Select Workspace Entity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={memberShopId}
                  onChange={(e) => setMemberShopId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white"
                  required
                >
                  <option value="">Select workspace to add...</option>
                  {eligibleShops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || s.slug}) — {s.currency}
                    </option>
                  ))}
                </select>
                {eligibleShops.length === 0 && (
                  <p className="text-[10px] text-zinc-400 mt-1">All your workspaces are already enrolled.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Entity Type</label>
                  <select
                    value={memberEntityType}
                    onChange={(e) => setMemberEntityType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white font-sans"
                  >
                    <option value="SUBSIDIARY">Subsidiary</option>
                    <option value="SISTER">Sister Entity</option>
                    <option value="DIVISION">Branch / Division</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Ownership Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="100"
                    value={memberOwnership}
                    onChange={(e) => setMemberOwnership(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono text-right rounded-lg border border-zinc-200 bg-white"
                    required
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">e.g. 100% or 75%</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMember || !memberShopId}
                  className="btn-primary-modern px-5 py-2 font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {isAddingMember ? "Enrolling..." : "Enroll Entity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. RECORD INTER-COMPANY TRADE MODAL */}
      {isRecordTxOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Record Inter-Company Trade</h3>
                <p className="text-xs text-zinc-500">Record internal billing, loans, or shared cost allocation.</p>
              </div>
              <button onClick={() => setIsRecordTxOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                ✕
              </button>
            </div>

            {recordTxError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {recordTxError}
              </div>
            )}

            <form onSubmit={handleRecordTx} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Provider / Seller Entity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={txSourceShopId}
                  onChange={(e) => setTxSourceShopId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white"
                  required
                >
                  <option value="">Select seller entity...</option>
                  {groupDetails?.members.map((m) => (
                    <option key={m.shopId} value={m.shopId}>
                      {m.shopName} ({m.entityType})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 mt-0.5">Recognizes Revenue</p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Recipient / Buyer Entity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={txTargetShopId}
                  onChange={(e) => setTxTargetShopId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white"
                  required
                >
                  <option value="">Select buyer entity...</option>
                  {groupDetails?.members.map((m) => (
                    <option key={m.shopId} value={m.shopId}>
                      {m.shopName} ({m.entityType})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 mt-0.5">Recognizes Expense / Liability</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-right rounded-lg border border-zinc-200 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Transaction Nature</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white font-sans"
                  >
                    <option value="MANAGEMENT_SERVICES">Management Services</option>
                    <option value="PRODUCT_SUPPLY">Product Supply / Inventory</option>
                    <option value="SHARED_COST">Shared Office / IT Cost</option>
                    <option value="INTER_COMPANY_LOAN">Inter-Company Loan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Agreement / Invoice Notes</label>
                <textarea
                  rows={2}
                  placeholder="Monthly management SLA fee per inter-company service contract #..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                🔒 This transaction will automatically be flagged for <span className="font-bold">Inter-Company Elimination</span>,
                preventing double-counting in Group consolidated reports.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsRecordTxOpen(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingTx}
                  className="btn-primary-modern px-5 py-2 font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {isRecordingTx ? "Recording..." : "Record Trade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
