"use client";

import Link from "next/link";
import { type ShopPlanDetails } from "@/lib/paywall";

interface GracePeriodBannerProps {
  slug: string;
  planDetails: ShopPlanDetails;
}

export function GracePeriodBanner({ slug, planDetails }: GracePeriodBannerProps) {
  // If lifetime pro or active and healthy, no banner needed
  if (planDetails.isLifetimePro || (!planDetails.inGracePeriod && !planDetails.isExpired)) {
    return null;
  }

  if (planDetails.inGracePeriod) {
    const daysLeft = planDetails.graceDaysRemaining ?? 5;
    return (
      <div className="bg-amber-500 text-amber-950 px-4 py-2.5 font-mono text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-600/30 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>
            <strong>Grace Period Active:</strong> Your {planDetails.plan} subscription has expired. You have{" "}
            <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> of uninterrupted access remaining before features are locked.
          </span>
        </div>
        <Link
          href={`/workspaces/${slug}/settings/billing`}
          className="bg-black hover:bg-zinc-900 text-white font-bold px-3.5 py-1 rounded-lg text-[11px] uppercase tracking-wider whitespace-nowrap shadow-xs no-underline transition-transform active:scale-95 shrink-0"
        >
          ⚡ Renew with M-Pesa &rarr;
        </Link>
      </div>
    );
  }

  if (planDetails.isExpired) {
    return (
      <div className="bg-rose-600 text-white px-4 py-2.5 font-mono text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-rose-700 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">🔒</span>
          <span>
            <strong>Subscription Expired:</strong> Your account is currently soft-locked to Free Starter limits. Your existing records are safely preserved.
          </span>
        </div>
        <Link
          href={`/workspaces/${slug}/settings/billing`}
          className="bg-white hover:bg-zinc-100 text-rose-900 font-black px-3.5 py-1 rounded-lg text-[11px] uppercase tracking-wider whitespace-nowrap shadow-xs no-underline transition-transform active:scale-95 shrink-0"
        >
          ⚡ Reactivate Plan &rarr;
        </Link>
      </div>
    );
  }

  return null;
}
