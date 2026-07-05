// src/app/workspaces/[slug]/payroll/page.tsx
import { db } from "@/db";
import { shops, employees, documents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { RegisterEmployeeModal } from "./RegisterEmployeeModal";

interface WorkspacePayrollPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspacePayrollPage({ params }: WorkspacePayrollPageProps) {
  const { slug } = await params;

  // 1. Resolve shop multi-tenant boundary
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch employee directory
  const staffList = await db.query.employees.findMany({
    where: eq(employees.shopId, shop.id),
    orderBy: [desc(employees.createdAt)],
  });

  // 3. Fetch historical payroll vouchers
  const payrollVouchers = await db.query.documents.findMany({
    where: and(eq(documents.shopId, shop.id), eq(documents.type, "PAYROLL_VOUCHER")),
    orderBy: [desc(documents.issueDate)],
  });

  // Compute KPI metrics
  const activeStaffCount = staffList.filter((e) => e.isActive).length;
  const totalYtdNetOutflow = payrollVouchers.reduce((acc, v) => acc + parseFloat(v.grandTotal), 0);
  const lastProcessedVoucher = payrollVouchers[0];

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* HEADER & TOP ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">HUMAN_CAPITAL // PAYROLL_VOUCHERS</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">{shop.name} Payroll Hub</h1>
          <p className="font-sans text-xs text-zinc-600">
            Log employee salaries, casual wages, sales commissions, and track statutory deductions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <RegisterEmployeeModal shopId={shop.id} shopSlug={slug} />
          <Link
            href={`/workspaces/${slug}/payroll/new`}
            className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider text-center"
          >
            + Process New Payroll Run
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Active Staff Nodes</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {activeStaffCount} Registered Staff
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total active employees and commission workers.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Disbursed Payroll Outflow</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-emerald-700">
            {formatCurrency(totalYtdNetOutflow, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Cumulative net earnings paid out across runs.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Last Processed Run</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black uppercase">
            {lastProcessedVoucher ? lastProcessedVoucher.docNumber : "NONE_RECORDED"}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">
            {lastProcessedVoucher 
              ? `Issued on ${new Date(lastProcessedVoucher.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}`
              : "No active payroll voucher runs locked."
            }
          </p>
        </div>
      </div>

      {/* EMPLOYEE DIRECTORY REGISTRY */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">&gt; Employee &amp; Staff Directory</h2>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total: {staffList.length}</span>
        </div>

        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Staff Full Name</th>
                <th className="p-4 border-r border-zinc-200">National ID</th>
                <th className="p-4 border-r border-zinc-200">KRA Tax PIN</th>
                <th className="p-4 border-r border-zinc-200 text-right">Base Salary</th>
                <th className="p-4 border-r border-zinc-200 text-right">Comm Rate</th>
                <th className="p-4 border-r border-zinc-200 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {staffList.map((emp) => (
                <tr key={emp.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-black tracking-wider font-sans text-sm">
                    <Link
                      href={`/workspaces/${slug}/payroll/employees/${emp.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {emp.fullName}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-600">
                    {emp.nationalId || "N/A"}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-600 uppercase font-semibold">
                    {emp.kraPin || "N/A"}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-black text-right">
                    {formatCurrency(parseFloat(emp.baseSalary), shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-600">
                    {parseFloat(emp.commissionRate).toFixed(1)}%
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded ${
                      emp.isActive ? "bg-black text-white" : "bg-zinc-100 text-zinc-400 border border-zinc-300"
                    }`}>
                      {emp.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/workspaces/${slug}/payroll/employees/${emp.id}`}
                      className="btn-secondary-modern px-2.5 py-1 text-[10px] font-semibold uppercase inline-block"
                    >
                      View Profile &amp; Sub-Ledger
                    </Link>
                  </td>
                </tr>
              ))}

              {staffList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400 italic">
                    &gt; NO STAFF NODES REGISTERED YET. CLICK "+ REGISTER EMPLOYEE" TO GET STARTED.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORICAL PAYROLL VOUCHERS RUNS */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">&gt; Historical Payroll Runs &amp; Vouchers</h2>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Runs: {payrollVouchers.length}</span>
        </div>

        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Voucher Serial Ref</th>
                <th className="p-4 border-r border-zinc-200">Issue Date</th>
                <th className="p-4 border-r border-zinc-200 text-right">Gross Earnings Pool</th>
                <th className="p-4 border-r border-zinc-200 text-right">Deductions Pool</th>
                <th className="p-4 border-r border-zinc-200 text-right">Net Disbursed Cash</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {payrollVouchers.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-black tracking-wider">
                    <Link
                      href={`/workspaces/${slug}/payroll/${doc.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-500">
                    {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-black text-right">
                    {formatCurrency(parseFloat(doc.subTotal), shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-rose-600 font-semibold text-right">
                    {formatCurrency(parseFloat(doc.taxAmount), shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-emerald-700 text-right text-sm">
                    {formatCurrency(parseFloat(doc.grandTotal), shop.currency)}
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/workspaces/${slug}/payroll/${doc.id}`}
                      className="btn-secondary-modern px-2.5 py-1 text-[10px] font-semibold uppercase inline-block"
                    >
                      View Full Breakdown Matrix
                    </Link>
                  </td>
                </tr>
              ))}

              {payrollVouchers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400 italic">
                    &gt; NO HISTORICAL PAYROLL RUNS LOCKED IN LEDGER YET.
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
