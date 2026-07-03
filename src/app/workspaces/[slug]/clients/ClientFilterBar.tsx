// src/app/workspaces/[slug]/clients/ClientFilterBar.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function ClientFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") || "";
  const clientType = searchParams.get("clientType") || "ALL";

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

  const hasActiveFilters = Boolean(search || clientType !== "ALL");

  return (
    <div className="border border-black bg-white p-4 space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-tight text-xs">Search Client Directory</span>
          {isPending && <span className="text-[10px] text-zinc-400 animate-pulse uppercase">Searching...</span>}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[10px] font-bold text-rose-600 uppercase underline hover:no-underline"
          >
            Reset ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* TEXT SEARCH */}
        <div className="sm:col-span-8 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block">Search Name / Email / Phone / Tax PIN</label>
          <input
            type="text"
            defaultValue={search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search contacts by name, email, phone, or PIN..."
            className="w-full px-3 py-1.5 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none text-xs"
          />
        </div>

        {/* CLASSIFICATION FILTER */}
        <div className="sm:col-span-4 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block">Classification</label>
          <select
            value={clientType}
            onChange={(e) => handleFilterChange("clientType", e.target.value)}
            className="w-full px-2 py-1.5 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="WALK_IN">Walk-In</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="CORPORATE">Corporate</option>
          </select>
        </div>
      </div>
    </div>
  );
}
