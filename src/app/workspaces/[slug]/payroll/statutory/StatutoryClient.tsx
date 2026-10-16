"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { axiosClient } from "@/lib/api/axios";
import { formatCurrency } from "@/lib/utils";
import { useEmployees } from "@/hooks/usePayroll";
import { Spinner } from "@/components/Spinner";

const AUTHORITY_LABELS: Record<string, string> = {
  PAYE: "PAYE (KRA)",
  NSSF: "NSSF (employee + employer)",
  SHIF: "SHIF (SHA)",
  HOUSING_LEVY: "Housing Levy (employee + employer)",
  NITA: "NITA",
};

interface PositionRow {
  period: string;
  authority: string;
  accrued: number;
  remitted: number;
  outstanding: number;
}

interface StatutoryClientProps {
  shopId: string;
  shopSlug: string;
  currency: string;
}

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function StatutoryClient({ shopId, shopSlug, currency }: StatutoryClientProps) {
  const queryClient = useQueryClient();
  const [p10Period, setP10Period] = useState(currentPeriod());
  const [p9Year, setP9Year] = useState(String(new Date().getFullYear()));
  const [p9Employee, setP9Employee] = useState("");
  const [paying, setPaying] = useState<PositionRow | null>(null);
  const [form, setForm] = useState({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), reference: "", channel: "BANK" });

  const { data: employees = [] } = useEmployees(shopId);
  const { data: position, isLoading } = useQuery<any>({
    queryKey: ["payroll-statutory", shopId],
    queryFn: () => axiosClient.get("/payroll/statutory/position", { params: { shop_id: shopId } }),
  });
  const { data: remittances } = useQuery<any>({
    queryKey: ["payroll-remittances", shopId],
    queryFn: () => axiosClient.get("/payroll/remittances", { params: { shop_id: shopId } }),
  });

  const recordPayment = useMutation({
    mutationFn: (row: PositionRow) =>
      axiosClient.post("/payroll/remittances", {
        shop_id: shopId,
        authority: row.authority,
        period: row.period,
        amount: form.amount,
        payment_date: form.paymentDate,
        payment_reference: form.reference || null,
        payment_channel: form.channel,
      }),
    onSuccess: () => {
      toast.success("Remittance recorded.");
      setPaying(null);
      queryClient.invalidateQueries({ queryKey: ["payroll-statutory", shopId] });
      queryClient.invalidateQueries({ queryKey: ["payroll-remittances", shopId] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to record remittance."),
  });

  const rows: PositionRow[] = (position?.position || []).map((r: any) => ({
    period: r.period,
    authority: r.authority,
    accrued: Number(r.accrued),
    remitted: Number(r.remitted),
    outstanding: Number(r.outstanding),
  }));
  const totalOutstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);

  const p10Href = `/api/v1/payroll/p10?shop_id=${encodeURIComponent(shopId)}&period=${p10Period}&format=csv`;
  const p9Href = p9Employee
    ? `/api/v1/payroll/p9?shop_id=${encodeURIComponent(shopId)}&employee_id=${p9Employee}&year=${p9Year}&format=csv`
    : undefined;

  return (
    <div className="p-5 sm:p-7 space-y-6 font-mono text-xs">
      <div className="space-y-2">
        <Link href={`/workspaces/${shopSlug}/payroll`} className="text-xs uppercase font-semibold underline hover:no-underline">
          ← Back to Payroll
        </Link>
        <h1 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">Statutory Deductions &amp; Returns</h1>
        <p className="font-sans text-xs text-zinc-600 max-w-2xl">
          Amounts withheld from finalized payroll runs (plus employer contributions) owed to KRA, NSSF, SHA and NITA.
          Record each payment when you remit it; it clears the liability in your ledger.
        </p>
      </div>

      {/* RETURNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-modern p-5 bg-white space-y-3">
          <h2 className="text-sm font-semibold uppercase font-sans">P10 – monthly PAYE return</h2>
          <p className="font-sans text-[11px] text-zinc-500">Per-employee figures for the month, to transfer into the KRA P10 template on iTax.</p>
          <div className="flex gap-2 items-center">
            <input
              type="month"
              value={p10Period}
              onChange={(e) => setP10Period(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded text-xs"
            />
            <a href={p10Href} className="btn-primary-modern px-4 py-2 text-xs uppercase">Download CSV</a>
          </div>
        </div>

        <div className="card-modern p-5 bg-white space-y-3">
          <h2 className="text-sm font-semibold uppercase font-sans">P9 – employee tax deduction card</h2>
          <p className="font-sans text-[11px] text-zinc-500">Twelve-month summary for one employee, for their annual return.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={p9Employee}
              onChange={(e) => setP9Employee(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded text-xs bg-white"
            >
              <option value="">Select employee…</option>
              {(employees as any[]).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name || e.fullName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={2000}
              max={2100}
              value={p9Year}
              onChange={(e) => setP9Year(e.target.value)}
              className="w-24 px-3 py-2 border border-zinc-300 rounded text-xs"
            />
            {p9Href ? (
              <a href={p9Href} className="btn-primary-modern px-4 py-2 text-xs uppercase">Download CSV</a>
            ) : (
              <span className="text-[11px] text-zinc-400 font-sans">Choose an employee</span>
            )}
          </div>
        </div>
      </div>

      {/* LIABILITIES */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans">Outstanding liabilities</h2>
          <span className="text-xs font-semibold">Total outstanding: {formatCurrency(totalOutstanding, currency)}</span>
        </div>
        <div className="card-modern overflow-x-auto bg-white">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Spinner size={20} /></div>
          ) : rows.length === 0 ? (
            <p className="p-6 font-sans text-zinc-500">No finalized payroll runs yet.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-3 py-3">Period</th>
                  <th className="px-3 py-3">Authority</th>
                  <th className="px-3 py-3 text-right">Accrued</th>
                  <th className="px-3 py-3 text-right">Remitted</th>
                  <th className="px-3 py-3 text-right">Outstanding</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const key = `${r.period}-${r.authority}`;
                  const isOpen = paying && `${paying.period}-${paying.authority}` === key;
                  return (
                    <tr key={key} className="border-b border-zinc-100/80 last:border-0 align-top">
                      <td className="px-3 py-3">{r.period}</td>
                      <td className="px-3 py-3">{AUTHORITY_LABELS[r.authority] || r.authority}</td>
                      <td className="px-3 py-3 text-right">{formatCurrency(r.accrued, currency)}</td>
                      <td className="px-3 py-3 text-right">{formatCurrency(r.remitted, currency)}</td>
                      <td className={`px-3 py-3 text-right font-semibold ${r.outstanding > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        {formatCurrency(r.outstanding, currency)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {r.outstanding > 0 && !isOpen && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaying(r);
                              setForm((f) => ({ ...f, amount: r.outstanding.toFixed(2), reference: "" }));
                            }}
                            className="btn-secondary-modern px-3 py-1 text-[10px] uppercase"
                          >
                            Record payment
                          </button>
                        )}
                        {isOpen && (
                          <div className="flex flex-col gap-2 items-end">
                            <input
                              type="number"
                              step="0.01"
                              value={form.amount}
                              onChange={(e) => setForm({ ...form, amount: e.target.value })}
                              className="w-32 px-2 py-1 border border-zinc-300 rounded text-xs text-right"
                              aria-label="Amount"
                            />
                            <input
                              type="date"
                              value={form.paymentDate}
                              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                              className="w-36 px-2 py-1 border border-zinc-300 rounded text-xs"
                              aria-label="Payment date"
                            />
                            <input
                              type="text"
                              placeholder="Payment reference (e.g. PRN)"
                              value={form.reference}
                              onChange={(e) => setForm({ ...form, reference: e.target.value })}
                              className="w-48 px-2 py-1 border border-zinc-300 rounded text-xs"
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setPaying(null)} className="text-[10px] uppercase underline">
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={recordPayment.isPending}
                                onClick={() => recordPayment.mutate(r)}
                                className="btn-primary-modern px-3 py-1 text-[10px] uppercase"
                              >
                                {recordPayment.isPending ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* HISTORY */}
      {(remittances?.remittances || []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans">Remittance history</h2>
          <div className="card-modern overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Authority</th>
                  <th className="px-3 py-3">Period</th>
                  <th className="px-3 py-3">Reference</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {remittances.remittances.map((r: any) => (
                  <tr key={r.id} className="border-b border-zinc-100/80 last:border-0">
                    <td className="px-3 py-3">{r.paymentDate}</td>
                    <td className="px-3 py-3">{AUTHORITY_LABELS[r.authority] || r.authority}</td>
                    <td className="px-3 py-3">{r.period}</td>
                    <td className="px-3 py-3">{r.paymentReference || "—"}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(Number(r.amount), currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
