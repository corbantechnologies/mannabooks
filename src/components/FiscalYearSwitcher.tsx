"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { switchFiscalYearContextAction, type FiscalYearOption } from "@/lib/actions/fiscal-year-context";
import { Calendar, ChevronDown, Check, Plus, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface FiscalYearSwitcherProps {
  shopId: string;
  shopSlug: string;
  activeFiscalYear: FiscalYearOption | null;
  allFiscalYears: FiscalYearOption[];
  variant?: "sidebar" | "header" | "compact";
}

export function FiscalYearSwitcher({
  shopId,
  shopSlug,
  activeFiscalYear,
  allFiscalYears,
  variant = "sidebar",
}: FiscalYearSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectYear = (year: FiscalYearOption) => {
    if (activeFiscalYear?.id === year.id) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const res = await switchFiscalYearContextAction(shopId, shopSlug, year.id);
      if (res.success) {
        toast.success(`Platform context switched to ${year.label}`);
        setIsOpen(false);
        router.refresh();
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to switch fiscal year");
      }
    });
  };

  const label = activeFiscalYear ? activeFiscalYear.label : "Declare Fiscal Year";

  if (variant === "header") {
    return (
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 transition-all shadow-2xs cursor-pointer"
          title="Active Contextual Fiscal Year"
        >
          <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-[160px]">{label}</span>
          <ChevronDown className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-64 rounded-xl bg-white shadow-xl border border-zinc-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
            <div className="px-3 py-1.5 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Contextual Fiscal Year
              </span>
              <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                {allFiscalYears.length} Years
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
              {allFiscalYears.map((fy) => {
                const isSelected = activeFiscalYear?.id === fy.id;
                return (
                  <button
                    key={fy.id}
                    type="button"
                    onClick={() => handleSelectYear(fy)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 text-white font-semibold"
                        : "hover:bg-zinc-50 text-zinc-800"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-mono">{fy.label}</span>
                        {fy.isClosed && (
                          <span className="text-[9px] bg-rose-100 text-rose-800 px-1 rounded uppercase font-bold">
                            Closed
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                        {fy.startDate} → {fy.endDate}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-zinc-100 pt-1.5 px-2 mt-1 flex flex-col gap-1">
              <Link
                href={`/workspaces/${shopSlug}/finance/periods`}
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-sans font-semibold text-zinc-600 hover:text-black hover:bg-zinc-50 p-1.5 rounded flex items-center justify-between transition-colors no-underline"
              >
                <span>Manage Fiscal Years &amp; Tax</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sidebar variant (dark themed for DesktopSidebarShell / MobileNavDrawer)
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all select-none">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-zinc-400">
            Fiscal Year
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[9px] font-mono font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-0.5 bg-transparent border-none p-0"
          >
            <span>Switch</span>
            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left flex items-center justify-between gap-1.5 text-white cursor-pointer bg-transparent border-none p-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-mono text-xs font-semibold truncate text-zinc-100">
              {label}
            </span>
          </div>
          {activeFiscalYear?.isClosed && (
            <span className="text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded uppercase font-bold shrink-0">
              Closed
            </span>
          )}
        </button>

        {activeFiscalYear && (
          <p className="text-[9px] font-mono text-zinc-400 truncate mt-0.5">
            {activeFiscalYear.startDate} → {activeFiscalYear.endDate}
          </p>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 rounded-xl bg-zinc-900 shadow-2xl border border-zinc-700 py-2 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-1 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Switch Fiscal Year
            </span>
            <span className="text-[8px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono font-semibold">
              {allFiscalYears.length} Available
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto py-1 space-y-0.5">
            {allFiscalYears.map((fy) => {
              const isSelected = activeFiscalYear?.id === fy.id;
              return (
                <button
                  key={fy.id}
                  type="button"
                  onClick={() => handleSelectYear(fy)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer border-none ${
                    isSelected
                      ? "bg-emerald-600 text-white font-semibold"
                      : "hover:bg-white/10 text-zinc-200 bg-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-mono">{fy.label}</span>
                      {fy.isClosed && (
                        <span className="text-[8px] bg-rose-500/30 text-rose-200 px-1 rounded uppercase font-bold">
                          Closed
                        </span>
                      )}
                    </div>
                    <p className={`text-[9px] font-mono mt-0.5 ${isSelected ? "text-emerald-100" : "text-zinc-400"}`}>
                      {fy.startDate} to {fy.endDate}
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-zinc-800 pt-1.5 px-2 mt-1">
            <Link
              href={`/workspaces/${shopSlug}/finance/periods`}
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-sans font-semibold text-zinc-300 hover:text-white hover:bg-white/10 p-1.5 rounded flex items-center justify-between transition-colors no-underline"
            >
              <span>+ Declare / Manage Fiscal Years</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
