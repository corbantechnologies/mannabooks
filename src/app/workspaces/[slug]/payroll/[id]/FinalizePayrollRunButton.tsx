// src/app/workspaces/[slug]/payroll/[id]/FinalizePayrollRunButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePayrollVoucherStatus } from "@/lib/actions/payroll";
import { toast } from "react-hot-toast";

interface FinalizePayrollRunButtonProps {
  voucherId: string;
  shopId: string;
}

export function FinalizePayrollRunButton({ voucherId, shopId }: FinalizePayrollRunButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFinalize() {
    setLoading(true);
    const toastId = toast.loading("Finalizing and locking payroll run...");

    const res = await updatePayrollVoucherStatus(voucherId, shopId, "PAID");
    setLoading(false);

    if (res.success) {
      toast.success("Payroll voucher status updated to PAID & locked.", { id: toastId });
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update voucher status.", { id: toastId });
    }
  }

  return (
    <button
      type="button"
      onClick={handleFinalize}
      disabled={loading}
      className="btn-primary-modern bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider print:hidden disabled:bg-zinc-300"
    >
      {loading ? "FINALIZING..." : "✓ Lock & Finalize Payment"}
    </button>
  );
}
