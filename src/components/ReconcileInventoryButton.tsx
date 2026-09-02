"use client";

import { useState } from "react";
import { reconcileInventoryAndLocationsAction } from "@/lib/actions/inventory";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ReconcileInventoryButtonProps {
  shopId: string;
  shopSlug: string;
  variant?: "default" | "minimal";
}

export function ReconcileInventoryButton({
  shopId,
  shopSlug,
  variant = "default",
}: ReconcileInventoryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReconcile() {
    setLoading(true);
    const toastId = toast.loading("Scanning products and reconciling location stock balances...");

    try {
      const res = await reconcileInventoryAndLocationsAction(shopId, shopSlug);

      if (res.success) {
        if (res.reconciledCount && res.reconciledCount > 0) {
          toast.success(
            `Successfully synchronized ${res.reconciledCount} product balance(s) with location inventory!`,
            { id: toastId, duration: 4000 }
          );
        } else {
          toast.success(
            `All ${res.totalTracked || 0} tracked products are already in perfect 1:1 sync with locations!`,
            { id: toastId, duration: 4000 }
          );
        }
        router.refresh();
      } else {
        toast.error(res.error || "Failed to reconcile inventory.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Reconciliation encountered an error.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  if (variant === "minimal") {
    return (
      <button
        type="button"
        onClick={handleReconcile}
        disabled={loading}
        title="Sync and fix location stock discrepancies with current catalog quantities"
        className="btn-secondary-modern px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 disabled:opacity-50"
      >
        <span className={loading ? "animate-spin" : ""}>⚡</span>
        <span>{loading ? "Syncing..." : "Sync Locations"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReconcile}
      disabled={loading}
      title="Scan all products and synchronize location stock with catalog quantities"
      className="btn-secondary-modern px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
    >
      <span className={loading ? "animate-spin" : ""}>⚡</span>
      <span>{loading ? "Syncing..." : "Sync & Reconcile Stock"}</span>
    </button>
  );
}
