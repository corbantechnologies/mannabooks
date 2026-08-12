// src/app/workspaces/[slug]/suppliers/SupplierFilterBar.tsx
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function SupplierFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const classification = searchParams.get("classification") || "ALL";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  function handleFilterChange(key: string, value: string) {
    const query = createQueryString(key, value);
    router.push(`${pathname}?${query}`);
  }

  function handleReset() {
    router.push(pathname);
  }

  const hasActiveFilters = search || classification !== "ALL";

  return (
    <div className="card-modern p-4 space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-200/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Filters</span>
          {hasActiveFilters && (
            <span className="bg-black text-white text-[9px] px-2 py-0.5 font-semibold uppercase rounded">
              ACTIVE
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-[10px] uppercase text-zinc-500 hover:text-black font-semibold underline underline-offset-2"
          >
            Reset All Filters ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* TEXT SEARCH INPUT */}
        <div className="sm:col-span-8 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block font-semibold">Search Name / Email / Phone / KRA PIN</label>
          <input
            type="text"
            defaultValue={search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search supplier name, PIN (e.g. P05123...), email or phone..."
            className="w-full px-3 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
          />
        </div>

        {/* CLASSIFICATION FILTER */}
        <div className="sm:col-span-4 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block font-semibold">Classification</label>
          <select
            value={classification}
            onChange={(e) => handleFilterChange("classification", e.target.value)}
            className="w-full px-2 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
          >
            <option value="ALL">All Classifications</option>
            <option value="CORPORATE">Corporate Vendors</option>
            <option value="INDIVIDUAL">Individual / Sole Proprietors</option>
            <option value="WALK_IN">Uncategorized / Walk-in</option>
          </select>
        </div>
      </div>
    </div>
  );
}
