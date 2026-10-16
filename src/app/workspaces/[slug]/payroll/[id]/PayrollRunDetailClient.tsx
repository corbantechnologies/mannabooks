"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PrintPayrollVoucherButton } from "./PrintPayrollVoucherButton";
import { FinalizePayrollRunButton } from "./FinalizePayrollRunButton";
import { useQuery } from "@tanstack/react-query";
import { useDocument } from "@/hooks/useDocuments";
import { axiosClient } from "@/lib/api/axios";
import { Spinner } from "@/components/Spinner";

interface PayrollRunDetailClientProps {
  shop: any;
  shopSlug: string;
  voucherId: string;
}

export function PayrollRunDetailClient({
  shop,
  shopSlug,
  voucherId,
}: PayrollRunDetailClientProps) {
  const { data: rawDoc, isLoading, error } = useDocument(shop.id, voucherId);
  const { data: payroll } = useQuery<any>({
    queryKey: ["payroll-lines", shop.id, voucherId],
    queryFn: () => axiosClient.get(`/payroll/${voucherId}/lines`, { params: { shop_id: shop.id } }),
  });
  const lines: any[] = payroll?.lines || [];
  const totals: any = payroll?.totals || {};

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 font-mono">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 tracking-wider uppercase">Loading payroll voucher record...</p>
      </div>
    );

  }

  const doc = (rawDoc as any)?.document || rawDoc;

  if (error || !doc) {
    return (
      <div className="p-8 text-center space-y-4 font-mono">
        <p className="text-sm text-rose-600 font-semibold">Payroll voucher record could not be found.</p>
        <Link
          href={`/workspaces/${shopSlug}/payroll`}
          className="btn-secondary-modern px-4 py-2 text-xs uppercase"
        >
          ← Back to Payroll
        </Link>
      </div>
    );
  }

  const voucherRecord = {
    id: doc.id,
    docNumber: doc.docNumber || doc.doc_number,
    status: doc.status,
    issueDate: doc.issueDate || doc.issue_date,
    subTotal: String(doc.subTotal || doc.sub_total || "0"),
    taxAmount: String(doc.taxAmount || doc.tax_amount || "0"),
    grandTotal: String(doc.grandTotal || doc.grand_total || "0"),
    items: (doc.items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      unitPrice: String(item.unitPrice || item.unit_price || "0"),
    })),
  };

  const isDraft = voucherRecord.status === "DRAFT";

  return (
    <div className="p-5 sm:p-7 space-y-6 font-mono text-xs">
      {/* BACK NAVIGATION AND HEADER */}
      <div className="space-y-2">
        <Link
          href={`/workspaces/${shopSlug}/payroll`}
          className="text-xs uppercase font-mono font-semibold underline hover:no-underline text-black"
        >
          ← Back to Payroll
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
          <div>
            <span className="text-xs text-zinc-400 font-semibold uppercase">Payroll Voucher</span>
            <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
              Payroll Voucher {voucherRecord.docNumber}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Reference: {voucherRecord.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="border border-zinc-300 px-2.5 py-1 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
              Payroll Date: {new Date(voucherRecord.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
            </span>
            <span
              className={`px-2.5 py-1 font-semibold uppercase tracking-wide rounded ${
                isDraft ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-black text-white"
              }`}
            >
              Status: {isDraft ? "Draft" : "Finalized & Paid"}
            </span>

            {isDraft && (
              <FinalizePayrollRunButton voucherId={voucherRecord.id} shopId={shop.id} />
            )}

            {!isDraft && payroll?.period && (
              <a
                href={`/api/v1/payroll/p10?shop_id=${encodeURIComponent(shop.id)}&period=${payroll.period}&format=csv`}
                className="btn-secondary-modern px-3 py-1.5 text-[10px] uppercase"
              >
                P10 CSV ({payroll.period})
              </a>
            )}
            <PrintPayrollVoucherButton voucherId={voucherRecord.id} />
          </div>
        </div>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Gross Salary</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(parseFloat(voucherRecord.subTotal), shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total gross wages before statutory deductions.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Deductions</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-rose-600">
            {formatCurrency(
              parseFloat(voucherRecord.subTotal) - parseFloat(voucherRecord.grandTotal),
              shop.currency
            )}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">PAYE, SHIF, Housing Levy, NSSF &amp; Advance deductions.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Net Pay</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-emerald-700">
            {formatCurrency(parseFloat(voucherRecord.grandTotal), shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total net payouts transferred to staff.</p>
        </div>
      </div>

      {/* STAFF DISBURSEMENT BREAKDOWN MATRIX */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">
            Staff Breakdown ({lines.length || voucherRecord.items.length} employees)
          </h2>
          {payroll?.rateSet && (
            <span className="text-[10px] text-zinc-500 font-sans">
              Rates: {payroll.rateSet.name}
              {!payroll.rateSet.isVerified && " (unverified)"}
            </span>
          )}
        </div>

        <div className="card-modern overflow-x-auto bg-white">
          {lines.length > 0 ? (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3 text-right">Gross</th>
                  <th className="px-3 py-3 text-right">PAYE</th>
                  <th className="px-3 py-3 text-right">NSSF</th>
                  <th className="px-3 py-3 text-right">SHIF</th>
                  <th className="px-3 py-3 text-right">Housing Levy</th>
                  <th className="px-3 py-3 text-right">Other</th>
                  <th className="px-3 py-3 text-right">Net Pay</th>
                  <th className="px-3 py-3 text-right" title="Employer NSSF + Housing Levy + NITA">Employer Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {lines.map((l: any) => (
                  <tr key={l.id} className="border-b border-zinc-100/80 last:border-0 hover:bg-zinc-50">
                    <td className="px-3 py-3 text-zinc-800">
                      {l.employeeName}
                      {l.kraPin && <span className="block text-[10px] text-zinc-400">{l.kraPin}</span>}
                    </td>
                    <td className="px-3 py-3 text-right">{formatCurrency(Number(l.gross_pay), shop.currency)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(Number(l.paye), shop.currency)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(Number(l.nssf_employee), shop.currency)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(Number(l.shif), shop.currency)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(Number(l.housing_levy_employee), shop.currency)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(Number(l.custom_deductions), shop.currency)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-700">{formatCurrency(Number(l.net_pay), shop.currency)}</td>
                    <td className="px-3 py-3 text-right text-zinc-500">
                      {formatCurrency(Number(l.nssf_employer) + Number(l.housing_levy_employer) + Number(l.nita), shop.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 font-semibold bg-zinc-50/60">
                  <td className="px-3 py-3 uppercase text-[10px]">Totals</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(Number(totals.gross_pay || 0), shop.currency)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(Number(totals.paye || 0), shop.currency)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(Number(totals.nssf_employee || 0), shop.currency)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(Number(totals.shif || 0), shop.currency)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(Number(totals.housing_levy_employee || 0), shop.currency)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(Number(totals.custom_deductions || 0), shop.currency)}</td>
                  <td className="px-3 py-3 text-right text-emerald-700">{formatCurrency(Number(totals.net_pay || 0), shop.currency)}</td>
                  <td className="px-3 py-3 text-right text-zinc-500">
                    {formatCurrency(
                      Number(totals.nssf_employer || 0) + Number(totals.housing_levy_employer || 0) + Number(totals.nita || 0),
                      shop.currency
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-4 py-3 border-r border-zinc-100">#</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Employee / Description</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {voucherRecord.items.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                    <td className="p-4 border-r border-zinc-100 font-semibold text-zinc-400">#{idx + 1}</td>
                    <td className="p-4 border-r border-zinc-100 font-mono text-xs text-zinc-800 leading-relaxed">{item.description}</td>
                    <td className="p-4 border-r border-zinc-100 font-semibold text-emerald-700 text-right text-sm">
                      {formatCurrency(parseFloat(item.unitPrice), shop.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
