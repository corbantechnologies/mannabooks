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
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* BACK NAVIGATION AND HEADER */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <Link
          href={`/workspaces/${slug}/payroll`}
          className="text-xs font-semibold text-zinc-400 hover:underline block print:hidden"
        >
          ← BACK TO PAYROLL HUB &amp; DIRECTORY
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
          <div>
            <span className="text-xs text-zinc-400 font-semibold uppercase">PAYROLL_VOUCHER_RUN</span>
            <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">
              Payroll Voucher {voucherRecord.docNumber}
            </h1>
            <p className="text-xs text-zinc-500 lowercase mt-0.5">&gt; Reference: {voucherRecord.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="border border-zinc-300 px-2.5 py-1 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
              Execution Date: {new Date(voucherRecord.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
            </span>
            <span className={`px-2.5 py-1 font-semibold uppercase tracking-wide rounded ${
              isDraft ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-black text-white"
            }`}>
              Status: {isDraft ? "DRAFT (UNLOCKED)" : "PAID & LOCKED"}
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
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Gross Payroll Allocation</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(parseFloat(voucherRecord.subTotal), shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total gross wages before statutory deductions.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Statutory Reserves Pool</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-rose-600">
            {formatCurrency(parseFloat(voucherRecord.taxAmount), shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">PAYE, SHIF, Housing Levy, NSSF &amp; Advance deductions.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Net Disbursed Cash Outflow</p>
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
            &gt; Detailed Staff Disbursement Matrix ({voucherRecord.items.length} Line Entries)
          </h2>
        </div>

        <div className="card-modern overflow-x-auto bg-white">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Index</th>
                <th className="p-4 border-r border-zinc-200">Staff Member / Line Description</th>
                <th className="p-4 border-r border-zinc-200 text-right">Net Payout Allocated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {voucherRecord.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-zinc-400">
                    #{idx + 1}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-mono text-xs text-zinc-800 leading-relaxed">
                    {item.description}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-emerald-700 text-right text-sm">
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
