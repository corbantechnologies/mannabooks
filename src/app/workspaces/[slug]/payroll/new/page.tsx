// src/app/workspaces/[slug]/payroll/new/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { NewPayrollClientForm } from "./NewPayrollClientForm";

interface NewPayrollPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewPayrollPage({ params }: NewPayrollPageProps) {
  const { slug } = await params;

  // 1. Resolve multi-tenant shop criteria
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  // 2. Fetch active employee registry
  const empRes = await apiClient.get<any>(`/v1/employees?shop_id=${shop.id}`);
  const staffList = (empRes.data?.employees || []).map((e: any) => ({
    ...e,
    fullName: e.full_name || e.fullName,
    nationalId: e.national_id || e.nationalId,
    kraPin: e.kra_pin || e.kraPin,
    baseSalary: String(e.base_salary || e.baseSalary || "0"),
    commissionRate: String(e.commission_rate || e.commissionRate || "0"),
    isActive: e.is_active ?? e.isActive ?? true,
    email: e.email,
  }));

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white font-mono">
      <div>
        <span className="text-xs text-zinc-400 font-medium">Run Payroll</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Master Payroll Matrix</h1>
        <p className="font-sans text-xs text-zinc-600">
          Compile gross wages, allowances, commissions, and statutory deductions for all active staff.
        </p>
      </div>

      <NewPayrollClientForm
        shop={shop}
        shopSlug={slug}
        initialEmployees={staffList}
      />
    </div>
  );
}