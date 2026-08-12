// src/app/workspaces/[slug]/employees/page.tsx
import { db } from "@/db";
import { shops, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { RegisterEmployeeModal } from "../payroll/RegisterEmployeeModal";
import { DeleteEmployeeButton } from "./DeleteEmployeeButton";

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
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* HEADER & ACTION BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Employee Directory</span>
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
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Staff Members</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {staffList.length} Registered Nodes
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
            &gt; Master Employee Registry ({staffList.length})
          </h2>
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
                  <td colSpan={7} className="p-12 text-center text-zinc-400 italic">
                    &gt; NO EMPLOYEES REGISTERED IN WORKSPACE YET. CLICK "+ REGISTER EMPLOYEE" TO ADD STAFF.
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
