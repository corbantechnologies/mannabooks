// src/app/workspaces/[slug]/documents/LedgerFilterBar.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface ClientOption {
  id: string;
  name: string;
}

interface LedgerFilterBarProps {
  clients: ClientOption[];
}

export function LedgerFilterBar({ clients }: LedgerFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "ALL";
  const status = searchParams.get("status") || "ALL";
  const clientId = searchParams.get("clientId") || "ALL";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";

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

  const hasActiveFilters = Boolean(search || type !== "ALL" || status !== "ALL" || clientId !== "ALL" || fromDate || toDate);

  return (
    <div className="border border-black bg-white p-4 space-y-4 font-mono text-xs">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-tight text-sm">Filter &amp; Search Ledger</span>
          {isPending && <span className="text-[10px] text-zinc-400 animate-pulse uppercase">Searching...</span>}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[10px] font-bold text-rose-600 uppercase underline hover:no-underline"
          >
            Reset All Filters ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* TEXT SEARCH INPUT */}
        <div className="lg:col-span-4 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block">Search Serial / Client / Item</label>
          <input
            type="text"
            defaultValue={search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="e.g. INV-0001 or Acme Corp..."
            className="w-full px-3 py-1.5 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none text-xs"
          />
        </div>

        {/* TYPE FILTER */}
        <div className="lg:col-span-2 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block">Document Type</label>
          <select
            value={type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="w-full px-2 py-1.5 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none text-xs"
          >
            <option value="ALL">All Types</option>
            <option value="INVOICE">Invoices</option>
            <option value="QUOTATION">Quotations</option>
            <option value="RECEIPT">Receipts</option>
          </select>
        </div>

        {/* STATUS FILTER */}
        <div className="lg:col-span-2 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block">Status</label>
          <select
            value={status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-2 py-1.5 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        {/* CLIENT FILTER */}
        <div className="lg:col-span-2 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block">Client Filter</label>
          <select
            value={clientId}
            onChange={(e) => handleFilterChange("clientId", e.target.value)}
            className="w-full px-2 py-1.5 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none text-xs uppercase"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* DATE RANGE FILTER */}
        <div className="lg:col-span-2 space-y-1">
          <label className="text-zinc-400 text-[10px] uppercase block">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            className="w-full px-2 py-1.5 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none text-xs"
          />
        </div>
      </div>
    </div>
  );
}
