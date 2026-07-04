// src/app/workspaces/[slug]/products/ProductFilterBar.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function ProductFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") || "";
  const taxType = searchParams.get("taxType") || "ALL";

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

  function handleFilterChange(name: string, value: string) {
    startTransition(() => {
      const queryString = createQueryString(name, value);
      router.push(`${pathname}?${queryString}`);
    });
  }

  function handleClearFilters() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters = Boolean(search || taxType !== "ALL");

  return (
    <div className="card-modern p-4 space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center border-b border-zinc-200/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-tight text-xs text-black font-sans">Search Product Catalog</span>
          {isPending && <span className="text-[10px] text-zinc-400 animate-pulse uppercase font-semibold">Searching...</span>}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[10px] font-semibold text-rose-600 uppercase underline hover:no-underline"
          >
            Reset ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* TEXT SEARCH */}
        <div className="sm:col-span-8 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block font-semibold">Search Item Name / SKU</label>
          <input
            type="text"
            defaultValue={search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search products by description or SKU code..."
            className="w-full px-3 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
          />
        </div>

        {/* TAX TYPE FILTER */}
        <div className="sm:col-span-4 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block font-semibold">Statutory Tax Rule</label>
          <select
            value={taxType}
            onChange={(e) => handleFilterChange("taxType", e.target.value)}
            className="w-full px-2 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
          >
            <option value="ALL">All Tax Rates</option>
            <option value="V_16">VAT Standard (16%)</option>
            <option value="V_0">Zero Rated (0%)</option>
            <option value="EXEMPT">Exempt (0%)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
