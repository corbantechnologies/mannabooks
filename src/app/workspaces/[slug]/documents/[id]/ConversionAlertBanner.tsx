// src/app/workspaces/[slug]/documents/[id]/ConversionAlertBanner.tsx
"use client";

import { useState, useEffect } from "react";

interface ConversionAlertBannerProps {
  convertedFromType: string;
  sourceDocNumber: string;
  targetDocType: string;
}

export function ConversionAlertBanner({
  convertedFromType,
  sourceDocNumber,
  targetDocType,
}: ConversionAlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Clean URL query params so they don't persist on refresh
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const formattedTarget =
    targetDocType.charAt(0) +
    targetDocType.slice(1).toLowerCase().replace(/_/g, " ");

  const formattedSource = convertedFromType
    .toLowerCase()
    .replace(/_/g, " ");

  return (
    <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="text-emerald-600 text-lg mt-0.5">✓</span>
        <div>
          <p className="font-bold text-emerald-900 text-sm">
            {formattedTarget} created successfully!
          </p>
          <p className="text-emerald-700 text-xs mt-0.5">
            Converted from <strong>{sourceDocNumber}</strong>. The original {formattedSource} has been updated accordingly.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="text-emerald-700 hover:text-emerald-950 font-mono text-sm px-1.5 py-0.5 rounded hover:bg-emerald-100/60 transition-colors cursor-pointer"
        title="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
