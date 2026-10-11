// src/app/workspaces/[slug]/pos/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { PosTerminalWrapper } from "./PosTerminalWrapper";
import Link from "next/link";
import { notFound } from "next/navigation";

interface WalkInSalesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WalkInSalesPage({ params }: WalkInSalesPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-6 selection:bg-black selection:text-white">
      {/* TERMINAL HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider block">
            Counter Sales // Fast POS Terminal
          </span>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans mt-0.5">
            Instant Counter Terminal
          </h1>
          <p className="font-sans text-xs text-zinc-500 mt-1">
            Rapid barcode/item checkout for over-the-counter customers, walk-ins, and direct cash collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/workspaces/${slug}/documents`}
            className="btn-secondary-modern px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-center"
          >
            ← View Document Ledger
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>POS Online</span>
          </div>
        </div>
      </div>

      <PosTerminalWrapper shop={shop} shopSlug={slug} />
    </div>
  );
}
