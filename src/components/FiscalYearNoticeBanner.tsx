"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, BookOpen, Settings2 } from "lucide-react";

interface FiscalYearNoticeBannerProps {
  slug: string;
  shopId: string;
}

export function FiscalYearNoticeBanner({ slug, shopId }: FiscalYearNoticeBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default true to avoid SSR hydration layout shift

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(`dismissed_fy_banner_${shopId}`);
    if (stored !== "true") {
      setIsDismissed(false);
    }
  }, [shopId]);

  if (!mounted || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(`dismissed_fy_banner_${shopId}`, "true");
    } catch {
      // Ignore localStorage permission errors
    }
    setIsDismissed(true);
  };

  return (
    <div className="bg-emerald-50/95 border-b border-emerald-200/80 px-4 py-3 sm:py-3.5 font-sans text-xs text-emerald-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in duration-150">
      <div className="flex items-start gap-2.5 max-w-4xl">
        <span className="text-base leading-none select-none mt-0.5">💡</span>
        <div className="space-y-0.5">
          <p className="font-bold flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-emerald-900">
            Accounting Notice: Automated Fiscal Year Provisioning
          </p>
          <p className="text-emerald-800/90 leading-relaxed text-[11px] sm:text-xs">
            Your Fiscal Year and monthly accounting periods are automatically established on your first transaction. 
            You can customize your fiscal start month in Tax Settings, or review our guide on the importance of accounting years.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        <Link
          href={`/workspaces/${slug}/guide#mod-19`}
          className="inline-flex items-center gap-1 bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300 font-mono text-[10px] uppercase font-bold px-2.5 py-1.5 rounded transition-colors no-underline shadow-2xs"
        >
          <BookOpen className="w-3 h-3" />
          <span>Why Fiscal Years Matter</span>
        </Link>
        <Link
          href={`/workspaces/${slug}/finance/tax/settings`}
          className="inline-flex items-center gap-1 bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-[10px] uppercase font-bold px-2.5 py-1.5 rounded transition-colors no-underline shadow-2xs"
        >
          <Settings2 className="w-3 h-3" />
          <span>Configure</span>
        </Link>
        <button
          onClick={handleDismiss}
          title="Permanently dismiss notice"
          aria-label="Permanently dismiss notice"
          className="p-1 rounded text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/60 transition-colors ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
