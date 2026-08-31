"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LowStockItem {
  name: string;
  stockQuantity: string;
  reorderThreshold?: string | null;
}

interface LowStockAlertBannerProps {
  items: LowStockItem[];
  shopSlug: string;
  actionHref?: string;
  actionLabel?: string;
  storageKeyPrefix?: string;
}

export function LowStockAlertBanner({
  items,
  shopSlug,
  actionHref,
  actionLabel = "Restock Inventory →",
  storageKeyPrefix = "manna_dismiss_stock_alert",
}: LowStockAlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Default to true before client mounts to prevent flash
  const [mounted, setMounted] = useState(false);

  const storageKey = `${storageKeyPrefix}_${shopSlug}`;

  useEffect(() => {
    setMounted(true);
    // Check if dismissed in localStorage
    const dismissedAt = localStorage.getItem(storageKey);
    if (dismissedAt) {
      // Dismissed within the last 12 hours?
      const timePassed = Date.now() - parseInt(dismissedAt, 10);
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      if (timePassed < TWELVE_HOURS) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, [storageKey]);

  if (!mounted || isDismissed || items.length === 0) {
    return null;
  }

  function handleDismiss() {
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      // Ignore if localStorage is disabled
    }
  }

  const targetHref = actionHref || `/workspaces/${shopSlug}/products`;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl shrink-0">⚠️</span>
        <div className="min-w-0">
          <p className="font-bold text-amber-900 text-xs uppercase font-mono tracking-wide">
            Inventory Alert: {items.length} Item{items.length > 1 ? "s" : ""} Below Reorder Threshold
          </p>
          <p className="text-amber-800 text-xs font-sans mt-0.5 truncate max-w-xl">
            {items.slice(0, 3).map((p) => `${p.name} (${parseFloat(p.stockQuantity)} left)`).join(", ")}
            {items.length > 3 ? ` and ${items.length - 3} more` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Link
          href={targetHref}
          className="bg-amber-900 hover:bg-amber-950 text-white font-mono text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors shadow-2xs"
        >
          {actionLabel}
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-amber-800/70 hover:text-amber-950 hover:bg-amber-200/60 rounded-lg p-1.5 text-xs font-bold transition-colors"
          title="Dismiss alert banner"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
