// src/app/workspaces/[slug]/payroll/new/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { NewPayrollWrapper } from "./NewPayrollWrapper";

interface NewPayrollPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewPayrollPage({ params }: NewPayrollPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white font-mono">
      <div>
        <span className="text-xs text-zinc-400 font-medium">Run Payroll</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Master Payroll Matrix</h1>
        <p className="font-sans text-xs text-zinc-600">
          Compile gross wages, allowances, commissions, and statutory deductions for all active staff.
        </p>
      </div>

      <NewPayrollWrapper
        shop={shop}
        shopSlug={slug}
      />
    </div>
  );
}