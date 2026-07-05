// src/app/workspaces/[slug]/employees/DeleteEmployeeButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEmployee } from "@/lib/actions/payroll";
import { toast } from "react-hot-toast";

interface DeleteEmployeeButtonProps {
  employeeId: string;
  fullName: string;
  shopId: string;
  shopSlug: string;
  redirectToDirectory?: boolean;
}

export function DeleteEmployeeButton({
  employeeId,
  fullName,
  shopId,
  shopSlug,
  redirectToDirectory = false,
}: DeleteEmployeeButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const toastId = toast.loading(`Deleting ${fullName}...`);

    const res = await deleteEmployee(employeeId, shopId);
    setLoading(false);

    if (res.success) {
      toast.success(`${fullName} removed from active directory.`, { id: toastId });
      setIsOpen(false);
      if (redirectToDirectory) {
        router.push(`/workspaces/${shopSlug}/employees`);
      } else {
        router.refresh();
      }
    } else {
      toast.error(res.error || "Failed to delete employee.", { id: toastId });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white px-2 py-0.5 font-semibold text-[10px] uppercase rounded transition-colors"
      >
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-md shadow-xl w-[95%] sm:w-full max-w-sm p-6 space-y-4 font-mono text-xs text-left animate-in zoom-in-95 duration-150">
            
            <div className="space-y-1">
              <h3 className="font-semibold text-black uppercase font-sans text-sm">Delete Employee Record</h3>
              <p className="text-zinc-600 font-sans text-xs">
                Are you sure you want to delete <span className="font-bold text-black font-mono">{fullName}</span>?
              </p>
            </div>

            <div className="border border-amber-200 bg-amber-50 p-3 text-amber-900 text-[11px] rounded leading-relaxed">
              <strong>Note:</strong> Past payroll voucher runs will permanently retain {fullName}&apos;s payout history and details in historical ledgers.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-secondary-modern px-3 py-1.5 text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="btn-primary-modern bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs uppercase disabled:bg-zinc-300"
              >
                {loading ? "DELETING..." : "CONFIRM DELETE"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
