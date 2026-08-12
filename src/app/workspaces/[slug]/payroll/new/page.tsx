// src/app/workspaces/[slug]/payroll/new/page.tsx
import { db } from "@/db";
import { shops, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { NewPayrollClientForm } from "./NewPayrollClientForm";

interface NewPayrollPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewPayrollPage({ params }: NewPayrollPageProps) {
  const { slug } = await params;

  // 1. Resolve multi-tenant shop criteria
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch active employee registry
  const staffList = await db.query.employees.findMany({
    where: eq(employees.shopId, shop.id),
    orderBy: [desc(employees.createdAt)],
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white font-mono">
      <div>
        <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Run Payroll</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Master Payroll Matrix</h1>
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