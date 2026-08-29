"use client";

import { useState, useTransition, useRef } from "react";
import { getBalanceSheet, type BalanceSheetData } from "@/lib/actions/reports";

interface Props {
    shopId: string;
    shopSlug: string;
    isGlEnabled: boolean;
    currency: string;
    initialData: BalanceSheetData | null;
}

function fmt(amount: number, currency: string) {
    return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SectionRow({ label, amount, currency, bold, indent, positive, negative }: {
    label: string;
    amount: number;
    currency: string;
    bold?: boolean;
    indent?: boolean;
    positive?: boolean;
    negative?: boolean;
}) {
    const colorClass = positive ? "text-emerald-700" : negative ? "text-rose-700" : "text-black";
    return (
        <div className={`flex justify-between items-center py-2.5 ${bold ? "font-bold border-t border-zinc-200 mt-1 pt-3 text-black" : ""} ${indent ? "pl-6 text-zinc-600" : "text-zinc-800"}`}>
            <span className={`text-sm ${bold ? "font-bold text-black" : ""}`}>{label}</span>
            <span className={`font-mono text-sm ${bold ? "font-bold" : ""} ${colorClass}`}>{fmt(amount, currency)}</span>
        </div>
    );
}

export default function BalanceSheetClient({ shopId, isGlEnabled, currency, initialData }: Props) {
    const [data, setData] = useState<BalanceSheetData | null>(initialData);
    const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [isPending, startTransition] = useTransition();
    const printRef = useRef<HTMLDivElement>(null);

    function handleDateChange(dateStr: string) {
        setAsOfDate(dateStr);
        startTransition(async () => {
            const res = await getBalanceSheet(shopId, new Date(dateStr + "T23:59:59"));
            if (res.success) {
                setData(res.data);
            }
        });
    }

    function handleCsvExport() {
        if (!data) return;
        const rows = [
            ["BALANCE SHEET / STATEMENT OF FINANCIAL POSITION"],
            ["As of:", data.asOfDate],
            ["Currency:", data.currency],
            [],
            ["1. ASSETS"],
            ["Current Assets:"],
            ["  Cash & Cash Equivalents (1200)", data.cashAndBank],
            ["  Accounts Receivable (1100)", data.accountsReceivable],
            ["  Inventory Valuation (Physical Stock)", data.inventoryValuation],
            ["Total Current Assets", data.totalCurrentAssets],
            [],
            ["Non-Current Assets:"],
            ["  Fixed Assets (Net WDV)", data.fixedAssetsWdv],
            ["Total Non-Current Assets", data.totalNonCurrentAssets],
            ["TOTAL ASSETS", data.totalAssets],
            [],
            ["2. LIABILITIES"],
            ["Current Liabilities:"],
            ["  Accounts Payable (2100)", data.accountsPayable],
            ["  Tax & Statutory Payable (2200)", data.taxPayable],
            ["Total Current Liabilities", data.totalCurrentLiabilities],
            ["TOTAL LIABILITIES", data.totalLiabilities],
            [],
            ["3. EQUITY"],
            ["  Opening Balance Equity (3100)", data.openingBalanceEquity],
            ["  Retained Earnings (3200)", data.retainedEarnings],
            ["  Current Period Net Profit / (Loss)", data.currentPeriodNetProfit],
            ["TOTAL EQUITY", data.totalEquity],
            [],
            ["TOTAL LIABILITIES & EQUITY", data.totalLiabilities + data.totalEquity],
            ["ACCOUNTING EQUATION BALANCED?", data.isBalanced ? "YES" : "NO"],
            ["DIFFERENCE", data.difference],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BalanceSheet_${asOfDate}.csv`;
        a.click();
    }

    function handlePrint() {
        window.print();
    }

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500 uppercase font-semibold">Statement as of:</span>
                    <input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="border border-zinc-300 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-black bg-white"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleCsvExport}
                        disabled={!data}
                        className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border border-zinc-200 bg-white hover:border-zinc-400 transition-colors disabled:opacity-40"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!data}
                        className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 shadow-sm"
                    >
                        Print / PDF
                    </button>
                </div>
            </div>

            {isPending && (
                <div className="text-center py-12 text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">
                    Computing Financial Position...
                </div>
            )}

            {!isPending && data && (
                <div className="space-y-6" ref={printRef}>
                    {/* Top Equation Status Banner */}
                    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        data.isBalanced ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" : "bg-rose-50/80 border-rose-200 text-rose-900"
                    }`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    data.isBalanced ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"
                                }`}>
                                    {data.isBalanced ? "✓ Equation Balanced" : "⚠ Imbalance Detected"}
                                </span>
                                <span className="font-mono text-xs font-semibold">
                                    Assets = Liabilities + Equity
                                </span>
                            </div>
                            <p className="text-xs text-zinc-600 mt-1.5">
                                {data.isBalanced
                                    ? "Total Assets match the sum of Total Liabilities and Equity. Your financial position is mathematically verified."
                                    : `Variance of ${fmt(Math.abs(data.difference), data.currency)} detected. Review unclassified journal entries or migration balances.`}
                            </p>
                        </div>
                        <div className="text-right font-mono text-xs">
                            <span className="text-zinc-500 block">Total Capital Employed</span>
                            <span className="text-base font-bold text-black">{fmt(data.totalAssets, data.currency)}</span>
                        </div>
                    </div>

                    {/* Metric Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Total Assets</span>
                            <p className="text-2xl font-bold font-mono tracking-tight text-blue-700">
                                {fmt(data.totalAssets, data.currency)}
                            </p>
                            <p className="text-[11px] text-zinc-500">Current + Non-Current Assets</p>
                        </div>
                        <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Total Liabilities</span>
                            <p className="text-2xl font-bold font-mono tracking-tight text-amber-700">
                                {fmt(data.totalLiabilities, data.currency)}
                            </p>
                            <p className="text-[11px] text-zinc-500">Trade Payables &amp; Tax Obligations</p>
                        </div>
                        <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Total Equity</span>
                            <p className="text-2xl font-bold font-mono tracking-tight text-purple-700">
                                {fmt(data.totalEquity, data.currency)}
                            </p>
                            <p className="text-[11px] text-zinc-500">Owner Capital + Retained Earnings</p>
                        </div>
                    </div>

                    {/* Detailed Formal Statement */}
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white print:border-0 shadow-sm">
                        {/* Statement Header */}
                        <div className="bg-black text-white px-6 py-6 flex justify-between items-end">
                            <div>
                                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Formal Accounting Statement</span>
                                <h2 className="text-2xl font-bold font-sans tracking-tight mt-1">Statement of Financial Position</h2>
                                <p className="text-zinc-400 text-xs mt-0.5">As of {data.asOfDate}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-mono text-[10px] uppercase bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded font-bold">
                                    Currency: {data.currency}
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-zinc-200 px-6 py-2">
                            {/* SECTION 1: ASSETS */}
                            <div className="py-5 space-y-2">
                                <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-blue-800">
                                    1. Assets
                                </h3>

                                <div className="space-y-1">
                                    <p className="font-mono text-[10px] uppercase text-zinc-400 font-bold mt-2">Current Assets</p>
                                    <SectionRow label="Cash & Cash Equivalents (1200)" amount={data.cashAndBank} currency={data.currency} indent positive />
                                    <SectionRow label="Accounts Receivable (1100)" amount={data.accountsReceivable} currency={data.currency} indent />
                                    <SectionRow label="Inventory Asset Valuation (Stock on Hand)" amount={data.inventoryValuation} currency={data.currency} indent />
                                    <SectionRow label="Total Current Assets" amount={data.totalCurrentAssets} currency={data.currency} bold />
                                </div>

                                <div className="space-y-1 pt-3">
                                    <p className="font-mono text-[10px] uppercase text-zinc-400 font-bold">Non-Current Assets</p>
                                    <SectionRow label="Fixed Assets (Tax Written Down Value)" amount={data.fixedAssetsWdv} currency={data.currency} indent />
                                    <SectionRow label="Total Non-Current Assets" amount={data.totalNonCurrentAssets} currency={data.currency} bold />
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-center py-3 bg-blue-50/50 px-4 rounded-lg border border-blue-100 font-bold">
                                        <span className="text-sm uppercase font-mono tracking-wider text-blue-900">Total Assets</span>
                                        <span className="font-mono text-base text-blue-900">{fmt(data.totalAssets, data.currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: LIABILITIES */}
                            <div className="py-5 space-y-2">
                                <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-amber-800">
                                    2. Liabilities
                                </h3>

                                <div className="space-y-1">
                                    <p className="font-mono text-[10px] uppercase text-zinc-400 font-bold mt-2">Current Liabilities</p>
                                    <SectionRow label="Accounts Payable (2100)" amount={data.accountsPayable} currency={data.currency} indent />
                                    <SectionRow label="Tax & Statutory Payable (2200)" amount={data.taxPayable} currency={data.currency} indent />
                                    <SectionRow label="Total Current Liabilities" amount={data.totalCurrentLiabilities} currency={data.currency} bold />
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-center py-3 bg-amber-50/50 px-4 rounded-lg border border-amber-100 font-bold">
                                        <span className="text-sm uppercase font-mono tracking-wider text-amber-900">Total Liabilities</span>
                                        <span className="font-mono text-base text-amber-900">{fmt(data.totalLiabilities, data.currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: EQUITY */}
                            <div className="py-5 space-y-2">
                                <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-purple-800">
                                    3. Owner&apos;s Equity &amp; Reserves
                                </h3>

                                <div className="space-y-1">
                                    <SectionRow label="Opening Balance Equity (3100)" amount={data.openingBalanceEquity} currency={data.currency} indent />
                                    <SectionRow label="Retained Earnings (3200)" amount={data.retainedEarnings} currency={data.currency} indent />
                                    <SectionRow
                                        label="Current Period Net Income (from P&L)"
                                        amount={data.currentPeriodNetProfit}
                                        currency={data.currency}
                                        indent
                                        positive={data.currentPeriodNetProfit >= 0}
                                        negative={data.currentPeriodNetProfit < 0}
                                    />
                                    <SectionRow label="Total Equity" amount={data.totalEquity} currency={data.currency} bold />
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-center py-3 bg-purple-50/50 px-4 rounded-lg border border-purple-100 font-bold">
                                        <span className="text-sm uppercase font-mono tracking-wider text-purple-900">Total Equity</span>
                                        <span className="font-mono text-base text-purple-900">{fmt(data.totalEquity, data.currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* TOTAL LIABILITIES & EQUITY RECONCILIATION */}
                            <div className="py-5">
                                <div className="flex justify-between items-center py-4 bg-zinc-900 text-white px-5 rounded-xl font-bold">
                                    <div>
                                        <span className="text-sm uppercase font-mono tracking-wider block">Total Liabilities &amp; Equity</span>
                                        <span className="text-[11px] font-sans text-zinc-400 font-normal">Must equal Total Assets</span>
                                    </div>
                                    <span className="font-mono text-lg text-white">
                                        {fmt(data.totalLiabilities + data.totalEquity, data.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
