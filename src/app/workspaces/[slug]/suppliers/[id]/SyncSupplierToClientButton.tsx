"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";
import axiosClient from "@/lib/api/axios";

interface SyncSupplierToClientButtonProps {
  supplierId: string;
  shopId: string;
  shopSlug: string;
  className?: string;
  renderAsMenuItem?: boolean;
}

export function SyncSupplierToClientButton({
  supplierId,
  shopId,
  shopSlug,
  className,
  renderAsMenuItem = false,
}: SyncSupplierToClientButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleSync = async () => {
    setIsPending(true);
    const toastId = toast.loading("Syncing supplier to customer...");
    try {
      // 1. Fetch current supplier data
      const supplier: any = await axiosClient.get(`/suppliers/${supplierId}`, {
        params: { shop_id: shopId },
      });

      if (!supplier) {
        throw new Error("Supplier profile not found.");
      }

      // 2. Create customer profile
      await axiosClient.post(
        "/clients",
        {
          name: supplier.name,
          email: supplier.email || null,
          phone: supplier.phone || null,
          client_type: supplier.supplier_type || supplier.supplierType || "CORPORATE",
          tax_pin: supplier.tax_pin || supplier.taxPin || null,
          requires_etims: Boolean(supplier.requires_etims ?? supplier.requiresEtims),
        },
        {
          params: { shop_id: shopId },
        }
      );

      toast.success("Client profile created and linked successfully!", { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to clone supplier as client.", { id: toastId });
    } finally {
      setIsPending(false);
    }
  };

  if (renderAsMenuItem) {
    return (
      <button
        onClick={handleSync}
        disabled={isPending}
        className={
          className ||
          "w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-700 hover:text-black transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        }
      >
        {isPending ? (
          <>
            <Spinner size={10} color="black" />
            <span>Syncing client profile...</span>
          </>
        ) : (
          <>
            <span className="text-zinc-400">➔</span>
            <span>Sync as Customer / Client</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className={
        className ||
        "btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase disabled:opacity-50"
      }
    >
      {isPending ? "Syncing..." : "Sync as Customer / Client"}
    </button>
  );
}
