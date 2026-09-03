// src/app/workspaces/[slug]/employees/page.tsx
import { db } from "@/db";
import { shops, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { RegisterEmployeeModal } from "../payroll/RegisterEmployeeModal";
import { EmployeeRowPopover } from "./EmployeeRowPopover";

interface WorkspaceEmployeesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceEmployeesPage({ params }: WorkspaceEmployeesPageProps) {
  const { slug } = await params;

  // 1. Resolve multi-tenant shop criteria
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

  // Compute KPI metrics
  const activeStaffCount = staffList.filter((e) => e.isActive).length;
  const inactiveStaffCount = staffList.length - activeStaffCount;
  const monthlyBaseSalaryPool = staffList
    .filter((e) => e.isActive)
    .reduce((sum, e) => sum + parseFloat(e.baseSalary), 0);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      
      {/* HEADER & ACTION BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Employee Directory</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">{shop.name} Employees</h1>
          <p className="font-sans text-xs text-zinc-600">
            Register and manage staff profiles, contractual base compensation, commission rates, and identity credentials.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <RegisterEmployeeModal shopId={shop.id} shopSlug={slug} />
          <Link
            href={`/workspaces/${slug}/payroll/new`}
            className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider text-center"
          >
            + Process Payroll Run
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Staff</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {staffList.length} Employees
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">
            {activeStaffCount} active • {inactiveStaffCount} inactive
          </p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Active Base Payroll Commitment</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-emerald-700">
            {formatCurrency(monthlyBaseSalaryPool, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Monthly base contractual salary liability pool.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Compliance Coverage</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black uppercase">
            100% Tax &amp; ID PIN Indexed
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Strict National ID &amp; KRA PIN uniqueness enforced.</p>
        </div>
      </div>

      {/* DEDICATED EMPLOYEE DIRECTORY REGISTRY */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">
            Employee Directory ({staffList.length})
          </h2>
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
                      className="hover:underline underline-offset-2 block"
                    >
                      {emp.fullName}
                    </Link>
                    {emp.email && (
                      <span className="block text-[10px] text-zinc-400 font-mono mt-0.5 normal-case font-normal">
                        {emp.email}
                      </span>
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-zinc-600">
                    {emp.nationalId || "N/A"}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-zinc-600 uppercase font-semibold">
                    {emp.kraPin || "N/A"}
                  </td>
                  <td className="p-4 border-r border-zinc-100 font-semibold text-black text-right">
                    {formatCurrency(parseFloat(emp.baseSalary), shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-right text-zinc-600">
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
                    <EmployeeRowPopover employee={emp} shopId={shop.id} shopSlug={slug} />
                  </td>
                </tr>
              ))}

              {staffList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                    No employees registered yet. Click "+ Register Employee" to add staff.
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
