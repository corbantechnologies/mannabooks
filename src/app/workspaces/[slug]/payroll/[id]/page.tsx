// src/app/workspaces/[slug]/payroll/[id]/page.tsx
import { db } from "@/db";
import { documents, shops } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PrintPayrollVoucherButton } from "./PrintPayrollVoucherButton";
import { FinalizePayrollRunButton } from "./FinalizePayrollRunButton";
import { EmailPayslipsButton } from "./EmailPayslipsButton";

interface PayrollRunDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function PayrollRunDetailPage({ params }: PayrollRunDetailPageProps) {
  const { slug, id } = await params;

  // 1. Resolve multi-tenant shop criteria
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch targeted payroll voucher document record with items
  const voucherRecord = await db.query.documents.findFirst({
    where: and(eq(documents.id, id), eq(documents.shopId, shop.id), eq(documents.type, "PAYROLL_VOUCHER")),
    with: {
      items: true,
    },
  });

  if (!voucherRecord) {
    notFound();
  }

  const isDraft = voucherRecord.status === "DRAFT";

  return (
    <div className="p-5 sm:p-7 space-y-6 font-mono text-xs">
      
      {/* BACK NAVIGATION AND HEADER */}
      <div className="space-y-2">
        <Link
          href={`/workspaces/${slug}/payroll`}
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
            <span className={`px-2.5 py-1 font-semibold uppercase tracking-wide rounded ${
              isDraft ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-black text-white"
            }`}>
              Status: {isDraft ? "Draft" : "Finalized & Paid"}
            </span>

            {isDraft && (
              <FinalizePayrollRunButton voucherId={voucherRecord.id} shopId={shop.id} />
            )}

            <EmailPayslipsButton voucherId={voucherRecord.id} shopId={shop.id} shopSlug={slug} />
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
            {formatCurrency(parseFloat(voucherRecord.taxAmount), shop.currency)}
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
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">
            Staff Breakdown ({voucherRecord.items.length} employees)
          </h2>
        </div>

        <div className="card-modern overflow-x-auto bg-white">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                <th className="px-4 py-3 border-r border-zinc-100">#</th>
                <th className="px-4 py-3 border-r border-zinc-100">Employee / Description</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Net Pay</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {voucherRecord.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                  <td className="p-4 border-r border-zinc-100 font-semibold text-zinc-400">
                    #{idx + 1}
                  </td>
                  <td className="p-4 border-r border-zinc-100 font-mono text-xs text-zinc-800 leading-relaxed">
                    {item.description}
                  </td>
                  <td className="p-4 border-r border-zinc-100 font-semibold text-emerald-700 text-right text-sm">
                    {formatCurrency(parseFloat(item.unitPrice), shop.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
