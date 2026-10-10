"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";
import axiosClient from "@/lib/api/axios";

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
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleSync = async () => {
    setIsPending(true);
    const toastId = toast.loading("Syncing client to supplier...");
    try {
      // 1. Fetch current client data
      const client: any = await axiosClient.get(`/clients/${clientId}`, {
        params: { shop_id: shopId },
      });

      if (!client) {
        throw new Error("Client profile not found.");
      }

      // 2. Create supplier profile
      await axiosClient.post(
        "/suppliers",
        {
          name: client.name,
          email: client.email || null,
          phone: client.phone || null,
          supplier_type: client.client_type || client.clientType || "CORPORATE",
          tax_pin: client.tax_pin || client.taxPin || null,
          requires_etims: Boolean(client.requires_etims ?? client.requiresEtims),
          payment_terms: "NET_30",
        },
        {
          params: { shop_id: shopId },
        }
      );

      toast.success("Supplier profile created and linked successfully!", { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to clone client as supplier.", { id: toastId });
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
      className={
        className ||
        "btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase disabled:opacity-50"
      }
    >
      {isPending ? "Syncing..." : "Sync as Vendor / Supplier"}
    </button>
  );
}
