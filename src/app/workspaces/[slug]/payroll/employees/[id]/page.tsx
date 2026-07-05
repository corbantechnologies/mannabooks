// src/app/workspaces/[slug]/payroll/employees/[id]/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { getEmployeeById } from "@/lib/actions/payroll";
import { DeleteEmployeeButton } from "@/app/workspaces/[slug]/employees/DeleteEmployeeButton";

interface EmployeeDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { slug, id } = await params;

  // 1. Resolve multi-tenant shop criteria
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch employee profile & historical payout sub-ledger
  const employeeData = await getEmployeeById(id, shop.id);

  if (!employeeData) {
    notFound();
  }

  const totalLifetimeEarnings = employeeData.payrollHistory.reduce(
    (acc, item) => acc + parseFloat(item.netPay),
    0
  );

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* BACK NAVIGATION AND HEADER */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <Link
          href={`/workspaces/${slug}/payroll`}
          className="text-xs font-semibold text-zinc-400 hover:underline block"
        >
          ← BACK TO PAYROLL HUB &amp; DIRECTORY
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">HUMAN_CAPITAL // EMPLOYEE_PROFILE</span>
            <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">
              {employeeData.fullName}
            </h1>
            <p className="text-xs text-zinc-500 lowercase mt-0.5">&gt; id: {employeeData.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {employeeData.nationalId && (
              <span className="border border-zinc-300 px-2.5 py-1 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
                National ID: {employeeData.nationalId}
              </span>
            )}
            {employeeData.kraPin && (
              <span className="bg-black text-white px-2.5 py-1 font-semibold uppercase tracking-wide rounded">
                PIN: {employeeData.kraPin}
              </span>
            )}
            <span className={`px-2.5 py-1 font-semibold uppercase tracking-wide rounded ${
              employeeData.isActive ? "bg-emerald-50 text-emerald-900 border border-emerald-300" : "bg-zinc-100 text-zinc-500 border border-zinc-300"
            }`}>
              {employeeData.isActive ? "Active Node" : "Inactive Node"}
            </span>
            <DeleteEmployeeButton
              employeeId={employeeData.id}
              fullName={employeeData.fullName}
              shopId={shop.id}
              shopSlug={slug}
              redirectToDirectory={true}
            />
          </div>
        </div>
      </div>

      {/* KPI METRIC SUMMARY CARDS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Base Monthly Salary</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(parseFloat(employeeData.baseSalary), shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Contractual gross base remuneration.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Default Commission Rate</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {parseFloat(employeeData.commissionRate).toFixed(1)}%
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Performance sales incentive percentage.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Cumulative Net Earnings Paid</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-emerald-700">
            {formatCurrency(totalLifetimeEarnings, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total net payouts received across all payroll runs.</p>
        </div>
      </div>

      {/* HISTORICAL EMPLOYEE PAYMENT SUB-LEDGER */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">
            &gt; Staff Payment Sub-Ledger
          </h2>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">
            Total Disbursed Runs: {employeeData.payrollHistory.length}
          </span>
        </div>

        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Voucher Serial Ref</th>
                <th className="p-4 border-r border-zinc-200">Execution Date</th>
                <th className="p-4 border-r border-zinc-200">Line Breakdown Details</th>
                <th className="p-4 border-r border-zinc-200 text-right">Net Payout</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {employeeData.payrollHistory.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-black tracking-wider">
                    <Link
                      href={`/workspaces/${slug}/payroll/${item.voucherId}`}
                      className="hover:underline underline-offset-2"
                    >
                      {item.docNumber}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-500">
                    {new Date(item.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-600 max-w-md truncate">
                    {item.description}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-emerald-700 text-right text-sm">
                    {formatCurrency(parseFloat(item.netPay), shop.currency)}
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/workspaces/${slug}/payroll/${item.voucherId}`}
                      className="btn-secondary-modern px-2.5 py-1 text-[10px] font-semibold uppercase inline-block"
                    >
                      View Run Voucher
                    </Link>
                  </td>
                </tr>
              ))}

              {employeeData.payrollHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-400 italic">
                    &gt; NO HISTORICAL PAYROLL PAYOUTS LOGGED FOR THIS EMPLOYEE YET.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
