// src/app/workspaces/[slug]/payroll/page.tsx
import { db } from "@/db";
import { shops, employees, documents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { RegisterEmployeeModal } from "./RegisterEmployeeModal";
import { DeleteEmployeeButton } from "../employees/DeleteEmployeeButton";

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
    <div className="p-5 sm:p-7 space-y-6">
      
      {/* HEADER & TOP ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Payroll Registry</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">{shop.name} Payroll</h1>
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
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Active Employees</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {activeStaffCount} Active
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total active employees and commission workers.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Payroll Paid</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-emerald-700">
            {formatCurrency(totalYtdNetOutflow, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">All-time net pay disbursements across all runs.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Last Payroll Date</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {lastProcessedVoucher 
              ? new Date(lastProcessedVoucher.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" }) 
              : "None"
            }
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">
            {lastProcessedVoucher 
              ? `Voucher: ${lastProcessedVoucher.docNumber}` 
              : "No payroll processed yet."
            }
          </p>
        </div>
      </div>

      {/* HISTORICAL PAYROLL VOUCHERS RUNS */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">Payroll History</h2>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Runs: {payrollVouchers.length}</span>
        </div>

        <div className="surface overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                <th className="px-4 py-3 border-r border-zinc-100">Payroll Ref</th>
                <th className="px-4 py-3 border-r border-zinc-100">Issue Date</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-center">Status</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Gross Earnings</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Deductions</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Net Pay</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {payrollVouchers.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                  <td className="p-4 border-r border-zinc-100 font-semibold text-black tracking-wider">
                    <Link
                      href={`/workspaces/${slug}/payroll/${doc.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-400">
                    {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-center">
                    <span className={
                      doc.status === "DRAFT" ? "badge-amber" : "badge-emerald"
                    }>
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-4 border-r border-zinc-100 font-semibold text-black text-right font-mono">
                    {formatCurrency(parseFloat(doc.subTotal), shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-rose-600 font-semibold text-right font-mono">
                    {formatCurrency(parseFloat(doc.taxAmount), shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-100 font-semibold text-emerald-700 text-right text-sm font-mono">
                    {formatCurrency(parseFloat(doc.grandTotal), shop.currency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/workspaces/${slug}/payroll/${doc.id}`}
                      className="btn-secondary-modern px-2.5 py-1 text-[10px] font-semibold uppercase inline-block"
                    >
                      {doc.status === "DRAFT" ? "Edit / Finalize Draft" : "View Breakdown"}
                    </Link>
                  </td>
                </tr>
              ))}

              {payrollVouchers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                    No payroll runs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPLOYEE DIRECTORY REGISTRY */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">Employees</h2>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total: {staffList.length}</span>
        </div>

        <div className="surface overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                <th className="px-4 py-3 border-r border-zinc-100">Staff Full Name</th>
                <th className="px-4 py-3 border-r border-zinc-100">National ID</th>
                <th className="px-4 py-3 border-r border-zinc-100">KRA Tax PIN</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Base Salary</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Comm Rate</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {staffList.map((emp) => (
                <tr key={emp.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                  <td className="p-4 border-r border-zinc-100 font-semibold text-black tracking-wider font-sans text-sm">
                    <Link
                      href={`/workspaces/${slug}/payroll/employees/${emp.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {emp.fullName}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-zinc-600">
                    {emp.nationalId || "N/A"}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-zinc-600 uppercase font-semibold">
                    {emp.kraPin || "N/A"}
                  </td>
                  <td className="p-4 border-r border-zinc-100 font-semibold text-black text-right font-mono">
                    {formatCurrency(parseFloat(emp.baseSalary), shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-right text-zinc-600 font-mono">
                    {parseFloat(emp.commissionRate).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-center">
                    <span className={
                      emp.isActive ? "badge-black" : "badge-zinc text-zinc-400"
                    }>
                      {emp.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/workspaces/${slug}/payroll/employees/${emp.id}`}
                        className="btn-secondary-modern px-2.5 py-1 text-[10px] font-semibold uppercase inline-block"
                      >
                        View Profile
                      </Link>
                      <DeleteEmployeeButton
                        employeeId={emp.id}
                        fullName={emp.fullName}
                        shopId={shop.id}
                        shopSlug={slug}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {staffList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                    No employees added yet. Click "+ Register Employee" to get started.
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
