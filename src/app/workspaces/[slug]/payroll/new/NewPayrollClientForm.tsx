"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { computeKenyanDeductions, PayrollMode } from "@/lib/payroll-utils";
import { commitPayrollVoucherRun } from "@/lib/actions/payroll";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface SpreadsheetEmployeeRow {
  id: string;
  employeeId?: string;
  fullName: string;
  baseSalary: number;
  allowances: number;
  commissions: number;
  customDeductions: number;
}

interface NewPayrollClientFormProps {
  shop: any;
  shopSlug: string;
  initialEmployees: any[];
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function NewPayrollClientForm({ shop, shopSlug, initialEmployees }: NewPayrollClientFormProps) {
  const router = useRouter();
  
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [payoutCycle, setPayoutCycle] = useState<"MONTHLY" | "WEEKLY">("MONTHLY");

  const currentMonthYear = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase().replace(/\s+/g, "-");
  const [period, setPeriod] = useState(currentMonthYear);
  const [mode, setMode] = useState<PayrollMode>("KENYA_STATUTORY");
  const [loading, setLoading] = useState(false);

  // Initialize spreadsheet grid with active employees or 3 default fallback rows
  const [rows, setRows] = useState<SpreadsheetEmployeeRow[]>(() => {
    if (initialEmployees && initialEmployees.length > 0) {
      return initialEmployees.map((emp) => ({
        id: emp.id,
        employeeId: emp.id,
        fullName: emp.fullName,
        baseSalary: parseFloat(emp.baseSalary) || 0,
        allowances: 0,
        commissions: 0,
        customDeductions: 0,
      }));
    }

    return [
      { id: "row-1", fullName: "John Kiprono", baseSalary: 45000, allowances: 2500, commissions: 0, customDeductions: 0 },
      { id: "row-2", fullName: "Amira Omar (Sales Commission)", baseSalary: 0, allowances: 0, commissions: 35000, customDeductions: 0 },
      { id: "row-3", fullName: "Mwangi J. (Casual Yard Labour)", baseSalary: 18000, allowances: 500, commissions: 0, customDeductions: 0 },
    ];
  });

  const handleCycleChange = (cycle: "MONTHLY" | "WEEKLY", targetDateStr: string) => {
    setPayoutCycle(cycle);
    const d = new Date(targetDateStr);
    if (isNaN(d.getTime())) return;

    if (cycle === "MONTHLY") {
      const monthStr = d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase().replace(/\s+/g, "-");
      setPeriod(monthStr);
    } else {
      const weekNum = getWeekNumber(d);
      setPeriod(`WEEK-${weekNum}-${d.getFullYear()}`);
    }
  };

  const handleDateChange = (dateStr: string) => {
    setIssueDate(dateStr);
    handleCycleChange(payoutCycle, dateStr);
  };

  const updateRowField = (id: string, field: keyof SpreadsheetEmployeeRow, value: string | number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addBlankRow = () => {
    const newId = `custom-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      { id: newId, fullName: "New Staff Entry", baseSalary: 0, allowances: 0, commissions: 0, customDeductions: 0 },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Compile calculations collectively
  const rowsWithCalcs = rows.map((r) => ({
    ...r,
    computed: computeKenyanDeductions({
      baseSalary: parseFloat(r.baseSalary as any) || 0,
      allowances: parseFloat(r.allowances as any) || 0,
      commissions: parseFloat(r.commissions as any) || 0,
      customDeductions: parseFloat(r.customDeductions as any) || 0,
      mode,
    }),
  }));

  const totalGross = rowsWithCalcs.reduce((sum, r) => sum + r.computed.grossSalary, 0);
  const totalDeductions = rowsWithCalcs.reduce((sum, r) => sum + r.computed.totalDeductions, 0);
  const totalNetPayPayout = rowsWithCalcs.reduce((sum, r) => sum + r.computed.netPay, 0);

  const handleExecutionSubmit = async (targetStatus: "DRAFT" | "PAID" = "DRAFT") => {
    if (!period.trim()) {
      toast.error("Please specify target payroll tracking period.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(targetStatus === "DRAFT" ? "Saving payroll run as draft..." : "Finalizing and locking payroll run...");

    const payload = rowsWithCalcs.map((r) => ({
      employeeId: r.employeeId,
      employeeName: r.fullName,
      baseSalary: parseFloat(r.baseSalary as any) || 0,
      allowances: parseFloat(r.allowances as any) || 0,
      commissions: parseFloat(r.commissions as any) || 0,
      customDeductions: parseFloat(r.customDeductions as any) || 0,
    }));

    const res = await commitPayrollVoucherRun({
      shopId: shop.id,
      payrollPeriodCode: period,
      mode,
      status: targetStatus,
      issueDate: new Date(issueDate),
      lines: payload,
    });

    setLoading(false);

    if (res.success && "docNumber" in res && "voucherId" in res) {
      toast.success(`Payroll Voucher ${targetStatus === "DRAFT" ? "Draft Saved" : "Locked"}: ${res.docNumber}`, { id: toastId });
      router.push(`/workspaces/${shopSlug}/payroll/${res.voucherId}`);
    } else if ("error" in res) {
      toast.error(`Execution Error: ${res.error}`, { id: toastId });
    } else {
      toast.error("Failed to commit payroll run.", { id: toastId });
    }
  };

  return (
    <div className="space-y-8 font-mono text-xs selection:bg-black selection:text-white">
      
      {/* CONTROL & STRATEGY PANEL */}
      <div className="card-modern p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white">
        <div className="space-y-1">
          <label className="text-zinc-400 uppercase text-[10px] font-semibold block">Voucher Date</label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 bg-white font-mono text-xs font-semibold focus:outline-none focus:border-black rounded"
          />
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 uppercase text-[10px] font-semibold block">Payout Cycle</label>
          <select
            value={payoutCycle}
            onChange={(e) => handleCycleChange(e.target.value as any, issueDate)}
            className="w-full px-3 py-2 border border-zinc-300 bg-white font-mono text-xs font-semibold focus:outline-none focus:border-black rounded appearance-none cursor-pointer"
          >
            <option value="MONTHLY">Monthly Payout</option>
            <option value="WEEKLY">Weekly Payout</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 uppercase text-[10px] font-semibold block">Payroll Period Code</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value.toUpperCase())}
            placeholder="e.g. JULY-2026"
            className="w-full px-3 py-2 border border-zinc-300 bg-white font-mono text-xs font-semibold uppercase focus:outline-none focus:border-black rounded"
          />
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 uppercase text-[10px] font-semibold block">Deduction Strategy</label>
          <div className="grid grid-cols-2 border border-zinc-300 divide-x divide-zinc-300 bg-white rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("KENYA_STATUTORY")}
              className={`py-2 text-[10px] font-semibold uppercase transition-colors ${
                mode === "KENYA_STATUTORY" ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Statutory
            </button>
            <button
              type="button"
              onClick={() => setMode("MANUAL_CUSTOM")}
              className={`py-2 text-[10px] font-semibold uppercase transition-colors ${
                mode === "MANUAL_CUSTOM" ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Manual
            </button>
          </div>
        </div>
      </div>

      {/* SPREADSHEET LEDGER CONTAINER ROW MATRIX */}
      <div className="card-modern bg-white">
        <div className="bg-zinc-50/80 border-b border-zinc-100 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-semibold uppercase tracking-wider text-black font-sans text-xs">
              Staff Disbursement Spreadsheet Matrix ({rows.length} Active Rows)
            </span>
            <span className="bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase">
              Cycle: {payoutCycle}
            </span>
          </div>
          <button
            type="button"
            onClick={addBlankRow}
            className="btn-secondary-modern px-3 py-1 text-[10px] font-semibold uppercase"
          >
            + Add Line Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                <th className="p-3 border-r border-zinc-200">Employee Name</th>
                <th className="p-3 border-r border-zinc-200 text-right">Base Pay ({shop.currency})</th>
                <th className="p-3 border-r border-zinc-200 text-right">Allowances</th>
                <th className="p-3 border-r border-zinc-200 text-right">Commissions</th>
                <th className="p-3 border-r border-zinc-200 text-right">Advances/Loans</th>
                <th className="p-3 border-r border-zinc-200 bg-zinc-100 text-black text-right font-semibold">Gross Total</th>
                {mode === "KENYA_STATUTORY" && (
                  <>
                    <th className="p-3 border-r border-zinc-200 text-rose-600 text-right">PAYE</th>
                    <th className="p-3 border-r border-zinc-200 text-zinc-500 text-right">SHIF (2.75%)</th>
                    <th className="p-3 border-r border-zinc-200 text-zinc-500 text-right">AHL (1.5%)</th>
                    <th className="p-3 border-r border-zinc-200 text-zinc-500 text-right">NSSF</th>
                  </>
                )}
                <th className="p-3 border-r border-zinc-200 bg-zinc-900 text-emerald-400 text-right font-semibold">Net Pay</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {rowsWithCalcs.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                  <td className="p-2 border-r border-zinc-100">
                    <input
                      type="text"
                      value={row.fullName}
                      onChange={(e) => updateRowField(row.id, "fullName", e.target.value)}
                      className="w-full border border-zinc-300 p-1.5 bg-white font-sans font-semibold uppercase text-black focus:border-black focus:outline-none rounded text-xs"
                      required
                    />
                  </td>

                  {/* FLUID INTERACTIVE CELL INPUTS */}
                  <td className="p-2 border-r border-zinc-100">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.baseSalary}
                      placeholder="0.00"
                      onChange={(e) => updateRowField(row.id, "baseSalary", e.target.value)}
                      className="w-24 border border-zinc-300 p-1.5 bg-white text-right font-semibold focus:border-black focus:outline-none rounded text-xs"
                    />
                  </td>
                  <td className="p-2 border-r border-zinc-100">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.allowances}
                      placeholder="0.00"
                      onChange={(e) => updateRowField(row.id, "allowances", e.target.value)}
                      className="w-20 border border-zinc-300 p-1.5 bg-white text-right focus:border-black focus:outline-none rounded text-xs"
                    />
                  </td>
                  <td className="p-2 border-r border-zinc-100">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.commissions}
                      placeholder="0.00"
                      onChange={(e) => updateRowField(row.id, "commissions", e.target.value)}
                      className="w-20 border border-zinc-300 p-1.5 bg-white text-right focus:border-black focus:outline-none rounded text-xs"
                    />
                  </td>
                  <td className="p-2 border-r border-zinc-100">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.customDeductions}
                      placeholder="0.00"
                      onChange={(e) => updateRowField(row.id, "customDeductions", e.target.value)}
                      className="w-20 border border-zinc-300 p-1.5 bg-white text-right text-rose-600 focus:border-black focus:outline-none rounded text-xs"
                    />
                  </td>

                  {/* REACTIVE METRIC LABELS */}
                  <td className="p-3 border-r border-zinc-100 bg-zinc-50 font-semibold text-black text-right">
                    {formatCurrency(row.computed.grossSalary, shop.currency)}
                  </td>

                  {mode === "KENYA_STATUTORY" && (
                    <>
                      <td className="p-3 border-r border-zinc-100 text-rose-600 font-semibold text-right">
                        {row.computed.paye > 0 ? formatCurrency(row.computed.paye, shop.currency) : "0.00 (Relief)"}
                      </td>
                      <td className="p-3 border-r border-zinc-100 text-zinc-600 text-right">
                        {formatCurrency(row.computed.shif, shop.currency)}
                      </td>
                      <td className="p-3 border-r border-zinc-100 text-zinc-600 text-right">
                        {formatCurrency(row.computed.housingLevy, shop.currency)}
                      </td>
                      <td className="p-3 border-r border-zinc-100 text-zinc-600 text-right">
                        {formatCurrency(row.computed.nssf, shop.currency)}
                      </td>
                    </>
                  )}

                  <td className="p-3 border-r border-zinc-100 bg-zinc-900 text-emerald-400 font-semibold text-right">
                    {formatCurrency(row.computed.netPay, shop.currency)}
                  </td>

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="border border-rose-200 bg-rose-50 text-rose-600 px-2 py-1 text-[10px] font-semibold uppercase hover:bg-rose-600 hover:text-white disabled:opacity-20 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AGGREGATION FOOTER GRID */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Gross Wages Commitment</span>
          <span className="text-xl font-semibold tracking-tight text-black font-mono block">
            {formatCurrency(totalGross, shop.currency)}
          </span>
          <p className="text-[10px] text-zinc-500 leading-tight">Sum of base, allowances, and commissions.</p>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Statutory &amp; Custom Deductions</span>
          <span className="text-xl font-semibold tracking-tight text-rose-600 font-mono block">
            {formatCurrency(totalDeductions, shop.currency)}
          </span>
          <p className="text-[10px] text-zinc-500 leading-tight">Total statutory reserves and advance recoveries pool.</p>
        </div>

        <div className="p-6 bg-zinc-950 text-white flex flex-col justify-between gap-4 rounded-r-md">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Net Cash Disbursable Outflow</span>
            <span className="text-xl font-semibold tracking-tight text-emerald-400 font-mono block">
              {formatCurrency(totalNetPayPayout, shop.currency)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleExecutionSubmit("DRAFT")}
              disabled={loading || rows.length === 0}
              className="btn-secondary-modern bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700 w-full py-2 font-semibold uppercase text-xs disabled:opacity-30"
            >
              {loading ? "SAVING..." : "Save Draft Payroll Run"}
            </button>
            <button
              type="button"
              onClick={() => handleExecutionSubmit("PAID")}
              disabled={loading || rows.length === 0}
              className="btn-primary-modern bg-emerald-600 hover:bg-emerald-500 text-white w-full py-2.5 font-semibold uppercase tracking-wider text-xs disabled:bg-zinc-800 disabled:text-zinc-600 border-none"
            >
              {loading ? "EXECUTING TRANSACTION..." : "✓ Lock & Finalize Disbursal"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
