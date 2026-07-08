"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { disableOnboardingGuideAction } from "@/lib/actions/workspace";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";

interface OnboardingTrackerProps {
  hasSettings: boolean;
  hasPayment: boolean;
  hasProducts: boolean;
  hasClients: boolean;
  hasDocuments: boolean;
  shopSlug: string;
  shopId: string;
  hideOnboarding: boolean;
}

export function OnboardingTracker({
  hasSettings,
  hasPayment,
  hasProducts,
  hasClients,
  hasDocuments,
  shopSlug,
  shopId,
  hideOnboarding,
}: OnboardingTrackerProps) {
  const [isPending, startTransition] = useTransition();
  const [localHide, setLocalHide] = useState(hideOnboarding);

  // If already hidden in database, or hidden in local component state, return null
  if (localHide || (hasSettings && hasPayment && hasProducts && hasClients && hasDocuments)) {
    return null;
  }

  const steps = [
    {
      label: "Configure Workspace Settings",
      isComplete: hasSettings,
      href: `/workspaces/${shopSlug}/settings`,
      actionText: "Settings",
    },
    {
      label: "Add Payment Account",
      isComplete: hasPayment,
      href: `/workspaces/${shopSlug}/settings`,
      actionText: "Add Account",
    },
    {
      label: "Register a Product or Service",
      isComplete: hasProducts,
      href: `/workspaces/${shopSlug}/products`,
      actionText: "Add Item",
    },
    {
      label: "Add your first Client",
      isComplete: hasClients,
      href: `/workspaces/${shopSlug}/clients`,
      actionText: "Add Client",
    },
    {
      label: "Generate a Document",
      isComplete: hasDocuments,
      href: `/workspaces/${shopSlug}/documents/new`,
      actionText: "Create Doc",
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const progressPercentage = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="card-modern border-amber-200 bg-amber-50/50 p-6 space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-tight text-amber-900">
              Workspace Setup Guide
            </h2>
            <button
              onClick={() => {
                startTransition(async () => {
                  const res = await disableOnboardingGuideAction(shopId, shopSlug);
                  if (res.success) {
                    setLocalHide(true);
                    toast.success("Setup guide disabled permanently.");
                  } else {
                    toast.error(res.error || "Failed to disable guide.");
                  }
                });
              }}
              disabled={isPending}
              className="text-[10px] text-amber-600 hover:text-amber-800 underline font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 w-fit"
            >
              {isPending ? (
                <>
                  <Spinner size={8} color="amber" />
                  <span>Dismissing...</span>
                </>
              ) : (
                "✕ Permanently Dismiss"
              )}
            </button>
          </div>
          <p className="text-xs font-mono text-amber-700">
            Complete these core steps to fully activate your MannaBooks workspace.
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-2xl font-black text-amber-600">
            {progressPercentage}%
          </span>
          <span className="text-[10px] uppercase font-bold text-amber-700 block mt-0.5">
            Completed
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-amber-200/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-2 pt-2">
        {steps.map((step, idx) => {
          const content = (
            <>
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full border-2 text-[10px] font-bold shrink-0 ${
                    step.isComplete
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "border-amber-400 text-amber-500 bg-white"
                  }`}
                >
                  {step.isComplete ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-xs font-bold ${
                    step.isComplete
                      ? "text-amber-800 line-through decoration-amber-300"
                      : "text-amber-950"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!step.isComplete && (
                <span className="hidden sm:inline-block text-amber-600 font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-100 px-2.5 py-1 rounded">
                  {step.actionText} ➔
                </span>
              )}
            </>
          );

          if (step.isComplete) {
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg transition-colors bg-amber-100/30 border-amber-200/50 opacity-60"
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={idx}
              href={step.href}
              className="flex items-center justify-between p-3 border rounded-lg transition-colors bg-white border-amber-300 shadow-sm hover:bg-amber-50 cursor-pointer"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
