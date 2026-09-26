// src/app/use-cases/UseCasesClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { USE_CASES_DATA, UseCaseItem } from "@/lib/data/use-cases";

type CategoryFilter = "ALL" | UseCaseItem["category"];

const CATEGORIES: { key: CategoryFilter; label: string; icon: string }[] = [
  { key: "ALL", label: "All Scenarios", icon: "✨" },
  { key: "TECH_RESELLER", label: "On-Demand Hardware", icon: "💻" },
  { key: "MANUFACTURING", label: "BOM & Assemblies", icon: "⚙️" },
  { key: "HOLDING_COMPANY", label: "Holding Groups", icon: "🏛️" },
  { key: "LOGISTICS_FMCG", label: "FEFO & Pharma Bins", icon: "📦" },
  { key: "SERVICES", label: "Retainers & Timesheets", icon: "⚖️" },
  { key: "RETAIL", label: "Multi-Branch POS", icon: "🏪" },
  { key: "GOVERNANCE", label: "Approvals & Privacy", icon: "🛡️" },
];

export default function UseCasesClient() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  const filteredUseCases = useMemo(() => {
    return USE_CASES_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.problemStatement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  function toggleExpand(id: string) {
    setExpandedCaseId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-12">
      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operational problems (e.g. 'zero stock', 'BOM', 'retainers', 'serial numbers')..."
            className="w-full px-4 py-3 pl-10 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-sans focus:outline-none focus:border-black focus:bg-white shadow-2xs transition-all placeholder:text-zinc-400"
          />
          <span className="absolute left-3.5 top-3.5 text-zinc-400 text-xs">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3 text-zinc-400 hover:text-black text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.key
                  ? "bg-black text-white shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SCENARIOS GRID ── */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 text-xs font-mono text-zinc-500">
          <span>Showing {filteredUseCases.length} Operational Scenarios</span>
          <span>East African Business Models (KES)</span>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {filteredUseCases.map((uc) => {
            const isExpanded = expandedCaseId === uc.id;

            return (
              <div
                key={uc.id}
                className="border border-zinc-200/90 rounded-3xl p-6 sm:p-8 bg-white shadow-xs hover:border-zinc-400 transition-all space-y-6"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-zinc-50 border border-zinc-200 rounded-xl">
                      {uc.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: uc.badgeColor }}
                        >
                          {uc.categoryLabel}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          #{uc.id}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-zinc-950 mt-0.5">
                        {uc.title}
                      </h3>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl">
                    <span className="text-[11px] font-mono font-bold text-emerald-900 block">
                      ★ {uc.roiMetric.headline}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-sans">
                      {uc.roiMetric.detail}
                    </span>
                  </div>
                </div>

                {/* Headline & Problem */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-6 space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-600 tracking-wider block">
                      The Operational Challenge:
                    </span>
                    <h4 className="text-sm font-bold uppercase text-zinc-900 leading-snug">
                      {uc.headline}
                    </h4>
                    <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                      {uc.problemStatement}
                    </p>
                  </div>

                  <div className="md:col-span-6 space-y-2 bg-zinc-50 border border-zinc-200/80 p-5 rounded-2xl">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 tracking-wider block">
                      The MannaBooks Solution:
                    </span>
                    <p className="text-xs text-zinc-800 leading-relaxed font-sans font-medium">
                      {uc.mannaSolution}
                    </p>
                  </div>
                </div>

                {/* 4-Phase Step-by-Step Workflow */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 tracking-wider block">
                    Execution Flow:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {uc.workflowSteps.map((ws, wIdx) => (
                      <div
                        key={wIdx}
                        className="bg-white border border-zinc-200 p-3.5 rounded-xl space-y-1"
                      >
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-900 block">
                          {ws.phase}
                        </span>
                        <p className="text-[11px] text-zinc-600 font-sans leading-relaxed">
                          {ws.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accounting & General Ledger Impact Box */}
                <div className="border border-zinc-200 bg-zinc-950 text-white p-4 sm:p-5 rounded-2xl space-y-3 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      Double-Entry GL Impact:
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px]">
                      Net Margin: {uc.accountingEntry.amountKes}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                    <div>
                      <span className="text-emerald-400 block font-bold">DR: {uc.accountingEntry.debit}</span>
                      <span className="text-rose-400 block font-bold">CR: {uc.accountingEntry.credit}</span>
                    </div>
                    <div className="text-zinc-400 text-[10px] font-sans">
                      {uc.accountingEntry.note}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-zinc-100">
                  <Link
                    href={`/industries/${uc.relatedIndustrySlug}`}
                    className="text-xs font-mono font-bold uppercase tracking-wider text-black hover:text-emerald-700 hover:underline flex items-center gap-1.5"
                  >
                    <span>Explore Full Industry Blueprint</span>
                    <span>→</span>
                  </Link>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      href="/signup"
                      className="w-full sm:w-auto text-center bg-black text-white hover:bg-zinc-800 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                    >
                      Deploy This Workflow Free →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUseCases.length === 0 && (
            <div className="text-center py-16 border border-zinc-200 rounded-3xl bg-zinc-50 p-8 space-y-3">
              <span className="text-3xl">🔍</span>
              <h3 className="font-bold text-sm uppercase text-black font-mono">
                No matching scenarios found
              </h3>
              <p className="text-xs text-zinc-500">
                Try searching for different keywords or select "All Scenarios" above.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="btn-secondary-modern px-3 py-1.5 text-xs font-mono uppercase"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
