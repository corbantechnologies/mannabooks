"use client";

import { useState, useTransition } from "react";
import { emailPayslipsAction } from "@/lib/actions/payroll";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";

interface EmailPayslipsButtonProps {
  voucherId: string;
  shopId: string;
  shopSlug: string;
}

export function EmailPayslipsButton({ voucherId, shopId, shopSlug }: EmailPayslipsButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    startTransition(async () => {
      const res = await emailPayslipsAction(voucherId, shopId, shopSlug);
      if (res.success) {
        toast.success(`Dispatched ${res.countSent} payslip emails successfully! (Skipped ${res.countSkipped} without valid emails)`);
      } else {
        toast.error(res.error || "Failed to dispatch email payslips.");
      }
    });
  }

  return (
    <button
      onClick={handleSend}
      disabled={isPending}
      className="border border-zinc-300 px-2.5 py-1 bg-white hover:bg-zinc-50 font-semibold uppercase rounded text-zinc-700 hover:text-black flex items-center justify-center gap-1.5 transition-colors text-[10px] disabled:opacity-50"
    >
      {isPending ? (
        <>
          <Spinner size={10} color="black" />
          <span>Dispatching...</span>
        </>
      ) : (
        <>
          <span>✉ Email Payslips to Staff</span>
        </>
      )}
    </button>
  );
}
