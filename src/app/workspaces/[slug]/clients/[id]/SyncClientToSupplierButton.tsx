"use client";

import { useTransition } from "react";
import { syncClientToSupplierAction } from "@/lib/actions/crm-sync";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";

interface SyncClientToSupplierButtonProps {
  clientId: string;
  shopId: string;
  shopSlug: string;
  className?: string;
  renderAsMenuItem?: boolean;
}

export function SyncClientToSupplierButton({
  clientId,
  shopId,
  shopSlug,
  className,
  renderAsMenuItem = false,
}: SyncClientToSupplierButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncClientToSupplierAction(clientId, shopId, shopSlug);
      if (res.success) {
        toast.success("Supplier profile created and linked successfully!");
      } else {
        toast.error(res.error || "Failed to clone profile.");
      }
    });
  };

  if (renderAsMenuItem) {
    return (
      <button
        onClick={handleSync}
        disabled={isPending}
        className={className || "w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-700 hover:text-black transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"}
      >
        {isPending ? (
          <>
            <Spinner size={10} color="black" />
            <span>Syncing supplier profile...</span>
          </>
        ) : (
          <>
            <span className="text-zinc-400">➔</span>
            <span>Sync as Vendor / Supplier</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className={className || "btn-secondary-modern px-3 py-1 font-semibold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5"}
    >
      {isPending ? (
        <>
          <Spinner size={10} color="black" />
          <span>Syncing...</span>
        </>
      ) : (
        "➔ Sync as Supplier"
      )}
    </button>
  );
}
