// src/app/workspaces/[slug]/clients/[id]/ClientDocumentsFilterBar.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function ClientDocumentsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "ALL";
  const status = searchParams.get("status") || "ALL";

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

  const hasActiveFilters = Boolean(search || type !== "ALL" || status !== "ALL");

  return (
    <div className="card-modern p-4 space-y-3 font-mono text-xs bg-white">
      <div className="flex justify-between items-center border-b border-zinc-200/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-tight text-xs text-black font-sans">Filter Client Documents</span>
          {isPending && <span className="text-[10px] text-zinc-400 animate-pulse uppercase font-semibold">Updating...</span>}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[10px] font-semibold text-rose-600 uppercase underline hover:no-underline"
          >
            Clear Filters ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* TEXT SEARCH */}
        <div className="sm:col-span-6 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block font-semibold">Search Doc # / Notes</label>
          <input
            type="text"
            defaultValue={search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search by document serial or notes..."
            className="w-full px-3 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
          />
        </div>

        {/* TYPE FILTER */}
        <div className="sm:col-span-3 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block font-semibold">Document Type</label>
          <select
            value={type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="w-full px-2 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
          >
            <option value="ALL">All Types</option>
            <option value="INVOICE">Invoices</option>
            <option value="RECEIPT">Receipts</option>
            <option value="CREDIT_NOTE">Credit Notes</option>
            <option value="DEBIT_NOTE">Debit Notes</option>
            <option value="DELIVERY_NOTE">Delivery Notes</option>
            <option value="QUOTATION">Quotations</option>
          </select>
        </div>

        {/* STATUS FILTER */}
        <div className="sm:col-span-3 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block font-semibold">Lifecycle Status</label>
          <select
            value={status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-2 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="RECEIVED">Received</option>
          </select>
        </div>
      </div>
    </div>
  );
}
