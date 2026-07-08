"use client";

import { useTransition } from "react";
import { syncSupplierToClientAction } from "@/lib/actions/crm-sync";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";

interface SyncSupplierToClientButtonProps {
  supplierId: string;
  shopId: string;
  shopSlug: string;
}

export function SyncSupplierToClientButton({
  supplierId,
  shopId,
  shopSlug,
}: SyncSupplierToClientButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncSupplierToClientAction(supplierId, shopId, shopSlug);
      if (res.success) {
        toast.success("Client profile created and linked successfully!");
      } else {
        toast.error(res.error || "Failed to clone profile.");
      }
    });
  };

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className="btn-secondary-modern px-3 py-1 font-semibold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5"
    >
      {isPending ? (
        <>
          <Spinner size={10} color="black" />
          <span>Syncing...</span>
        </>
      ) : (
        "➔ Sync as Client"
      )}
    </button>
  );
}
