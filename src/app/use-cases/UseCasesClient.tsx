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
        <div className="relative max-w-xl mx-auto w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operational problems (e.g. 'zero stock', 'BOM', 'retainers', 'serial numbers')..."
            className="w-full px-4 py-2.5 sm:py-3 pl-10 pr-9 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-sans focus:outline-none focus:border-black focus:bg-white shadow-2xs transition-all placeholder:text-zinc-400"
          />
          <span className="absolute left-3.5 top-3 sm:top-3.5 text-zinc-400 text-xs">
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-2.5 sm:top-3 text-zinc-400 hover:text-black text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 border-b border-zinc-100 pb-3 text-xs font-mono text-zinc-500">
          <span className="font-semibold text-zinc-700">Showing {filteredUseCases.length} Operational Scenarios</span>
          <span className="text-[11px] sm:text-xs text-zinc-400">East African Business Models (KES)</span>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {filteredUseCases.map((uc) => {
            const isExpanded = expandedCaseId === uc.id;

            return (
              <div
                key={uc.id}
                className="border border-zinc-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 bg-white shadow-xs hover:border-zinc-400 transition-all space-y-5 sm:space-y-6"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-100 pb-4">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
                    <span className="text-2xl sm:text-3xl p-2 sm:p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                      {uc.icon}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span
                          className="whitespace-nowrap shrink-0 inline-flex items-center text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full text-white tracking-wide"
                          style={{ backgroundColor: uc.badgeColor }}
                        >
                          {uc.categoryLabel}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[200px] sm:max-w-none">
                          #{uc.id}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-tight text-zinc-950 leading-snug break-words">
                        {uc.title}
                      </h3>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto text-left sm:text-right shrink-0 bg-emerald-50 border border-emerald-200 p-3 sm:px-3.5 sm:py-2 rounded-xl">
                    <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-900 block">
                      ★ {uc.roiMetric.headline}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-emerald-700 font-sans block mt-0.5 leading-relaxed">
                      {uc.roiMetric.detail}
                    </span>
                  </div>
                </div>

                {/* Headline & Problem */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
                  <div className="md:col-span-6 space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-600 tracking-wider block">
                      The Operational Challenge:
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold uppercase text-zinc-900 leading-snug break-words">
                      {uc.headline}
                    </h4>
                    <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                      {uc.problemStatement}
                    </p>
                  </div>

                  <div className="md:col-span-6 space-y-2 bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 tracking-wider block">
                      The MannaBooks Solution:
                    </span>
                    <p className="text-xs text-zinc-800 leading-relaxed font-sans font-medium">
                      {uc.mannaSolution}
                    </p>
                  </div>
                </div>

                {/* 4-Phase Step-by-Step Workflow */}
                <div className="space-y-3 pt-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 tracking-wider block">
                    Execution Flow:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {uc.workflowSteps.map((ws, wIdx) => (
                      <div
                        key={wIdx}
                        className="bg-white border border-zinc-200 p-3 sm:p-3.5 rounded-xl space-y-1"
                      >
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-900 block break-words">
                          {ws.phase}
                        </span>
                        <p className="text-[11px] text-zinc-600 font-sans leading-relaxed">
                          {ws.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enterprise Architecture Matrix (Cost Centers, Staff Scoping, WMS Sub-locations) */}
                {uc.departmentCostCenters && uc.staffRosterRoles && uc.sublocationsHierarchy && (
                  <div className="border border-zinc-200 bg-zinc-50/70 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 tracking-wider block">
                          Enterprise System Architecture
                        </span>
                        <h4 className="text-xs font-bold uppercase text-zinc-950 font-sans break-words">
                          Cost Centers, Staff Scoping &amp; Warehouse Sublocations Matrix
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 bg-white border border-zinc-200 px-2.5 py-1 rounded-md self-start sm:self-auto shrink-0 whitespace-nowrap">
                        Multi-Departmental Plant
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                      {/* Cost Centers */}
                      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                        <div className="border-b border-zinc-100 pb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase text-zinc-600">Department Cost Centers</span>
                          <span className="text-[10px] font-mono text-zinc-400">6 Centers</span>
                        </div>
                        <ul className="space-y-2">
                          {uc.departmentCostCenters.map((cc) => (
                            <li key={cc.code} className="text-[11px] space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-zinc-900 font-mono">
                                <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[10px] shrink-0">{cc.code}</span>
                                <span className="font-sans text-xs break-words">{cc.name}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 pl-6 sm:pl-7 leading-tight font-sans break-words">{cc.absorbedCosts}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Staff Roster & Scoping */}
                      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                        <div className="border-b border-zinc-100 pb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase text-zinc-600">Staff Scoping &amp; Privacy</span>
                          <span className="text-[10px] font-mono text-zinc-400">5 Roles</span>
                        </div>
                        <ul className="space-y-2.5">
                          {uc.staffRosterRoles.map((role) => (
                            <li key={role.roleTitle} className="text-[11px] space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="font-bold text-zinc-900 font-sans text-xs break-words">{role.roleTitle}</span>
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 shrink-0 font-medium whitespace-nowrap">{role.preset}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 leading-tight font-sans break-words">{role.permissions}</p>
                              <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded font-bold break-words max-w-full ${
                                role.privacy.includes("Blindness") ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-zinc-100 text-zinc-700"
                              }`}>
                                🔒 {role.privacy}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Warehouses & Sublocations */}
                      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                        <div className="border-b border-zinc-100 pb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase text-zinc-600">Warehouse Sublocations</span>
                          <span className="text-[10px] font-mono text-zinc-400">6 Sub-Zones</span>
                        </div>
                        <ul className="space-y-2">
                          {uc.sublocationsHierarchy.map((sub) => (
                            <li key={sub.code} className="text-[11px] space-y-0.5">
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-[10px] font-bold shrink-0">{sub.code}</span>
                                <span className="text-zinc-900 font-sans font-semibold text-xs break-words">{sub.name}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 pl-6 sm:pl-7 leading-tight font-sans break-words">{sub.purpose}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accounting & General Ledger Impact Box */}
                <div className="border border-zinc-200 bg-zinc-950 text-white p-4 sm:p-5 rounded-xl sm:rounded-2xl space-y-3 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-b border-zinc-800 pb-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      Double-Entry GL Impact:
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px] break-words">
                      Net Margin: {uc.accountingEntry.amountKes}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-emerald-400 block font-bold break-words">DR: {uc.accountingEntry.debit}</span>
                      <span className="text-rose-400 block font-bold break-words">CR: {uc.accountingEntry.credit}</span>
                    </div>
                    <div className="text-zinc-400 text-[10px] font-sans leading-relaxed">
                      {uc.accountingEntry.note}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-zinc-100">
                  <Link
                    href={`/industries/${uc.relatedIndustrySlug}`}
                    className="text-xs font-mono font-bold uppercase tracking-wider text-black hover:text-emerald-700 hover:underline flex items-center gap-1.5 py-1"
                  >
                    <span>Explore Full Industry Blueprint</span>
                    <span>→</span>
                  </Link>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      href="/signup"
                      className="w-full sm:w-auto text-center bg-black text-white hover:bg-zinc-800 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors"
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
