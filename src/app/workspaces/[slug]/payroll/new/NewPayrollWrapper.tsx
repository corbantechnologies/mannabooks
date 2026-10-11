"use client";

import { useMemo } from "react";
import { useEmployees } from "@/hooks/usePayroll";
import { NewPayrollClientForm } from "./NewPayrollClientForm";
import { Spinner } from "@/components/Spinner";

interface NewPayrollWrapperProps {
  shop: any;
  shopSlug: string;
}

export function NewPayrollWrapper({ shop, shopSlug }: NewPayrollWrapperProps) {
  const { data: rawEmployees = [], isLoading } = useEmployees(shop.id);

  const staffList = useMemo(() => {
    return (Array.isArray(rawEmployees) ? rawEmployees : []).map((e: any) => ({
      ...e,
      fullName: e.full_name || e.fullName || "Unnamed",
      nationalId: e.national_id || e.nationalId,
      kraPin: e.kra_pin || e.kraPin,
      baseSalary: String(e.base_salary || e.baseSalary || "0"),
      commissionRate: String(e.commission_rate || e.commissionRate || "0"),
      isActive: e.is_active ?? e.isActive ?? true,
      email: e.email,
    }));
  }, [rawEmployees]);

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading employee roster...</p>
      </div>
    );

  }

  return (
    <NewPayrollClientForm
      shop={shop}
      shopSlug={shopSlug}
      initialEmployees={staffList}
    />
  );
}
