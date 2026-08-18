// src/app/workspaces/[slug]/inventory/layout.tsx
import Link from "next/link";

interface InventoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function InventoryLayout({ children, params }: InventoryLayoutProps) {
  const { slug } = await params;

  const subNav = [
    { href: `/workspaces/${slug}/inventory`, label: "Overview", exact: true },
    { href: `/workspaces/${slug}/inventory/locations`, label: "Locations" },
    { href: `/workspaces/${slug}/inventory/adjustments`, label: "Adjustments" },
    { href: `/workspaces/${slug}/inventory/transfers`, label: "Transfers" },
  ];

  const reportNav = [
    { href: `/workspaces/${slug}/inventory/reports/valuation`, label: "Stock Valuation" },
    { href: `/workspaces/${slug}/inventory/reports/movement`, label: "Movement History" },
    { href: `/workspaces/${slug}/inventory/reports/low-stock`, label: "Low Stock Alerts" },
    { href: `/workspaces/${slug}/inventory/reports/abc`, label: "ABC Analysis" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* INVENTORY SUB-NAVIGATION STRIP */}
      <div className="border-b border-zinc-200/80 bg-zinc-50/50 px-4 sm:px-8 sticky top-14 z-20">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {subNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded border border-transparent text-zinc-500 hover:text-black hover:border-zinc-300 hover:bg-white transition-all whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
          <div className="w-px h-4 bg-zinc-300 mx-1 shrink-0" />
          <span className="font-mono text-[10px] text-zinc-400 uppercase font-semibold mr-1 whitespace-nowrap">Reports:</span>
          {reportNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded border border-transparent text-zinc-500 hover:text-black hover:border-zinc-300 hover:bg-white transition-all whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
