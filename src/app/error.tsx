// src/app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LogOut, Home } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global render error caught by root boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200/90 shadow-xl p-7 space-y-6">
        
        {/* ICON & TITLE */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 leading-tight">
              Application Error
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              A temporary issue occurred while processing this request. Clearing session cookies will re-initialize your connection.
            </p>
          </div>
        </div>

        {/* ERROR DIGEST */}
        {error.digest && (
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Error Reference</p>
            <p className="text-xs font-mono font-semibold text-zinc-700 select-all mt-0.5">{error.digest}</p>
          </div>
        )}

        {/* ACTIONS */}
        <div className="space-y-2.5 pt-2">
          {/* PRIMARY: CLEAR COOKIES & SIGN IN FRESH */}
          <a
            href="/logout"
            className="w-full bg-black hover:bg-zinc-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all no-underline shadow-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Clear Cookies &amp; Re-Login</span>
          </a>

          {/* SECONDARY: RETRY */}
          <button
            type="button"
            onClick={() => reset()}
            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-zinc-200/80"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          {/* TERTIARY: HOME */}
          <Link
            href="/"
            className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 font-medium py-1.5 flex items-center justify-center gap-1.5 transition-colors no-underline block"
          >
            <Home className="w-3 h-3" />
            <span>Return to Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
