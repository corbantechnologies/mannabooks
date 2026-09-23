// src/app/workspaces/[slug]/crm/proposals/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getProposalsByShopAction } from "@/lib/actions/proposals";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Plus, FileText, ArrowRight } from "lucide-react";

interface ProposalsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dealId?: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  AMENDMENT_REQUESTED: "bg-amber-100 text-amber-800",
  EXPIRED: "bg-red-100 text-red-700",
  DECLINED: "bg-red-100 text-red-700",
};

export default async function ProposalsListPage({ params, searchParams }: ProposalsPageProps) {
  const { slug } = await params;
  const { dealId } = await searchParams;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const result = await getProposalsByShopAction(shop.id);
  const allProposals = result.proposals || [];

  const totalAccepted = allProposals.filter(p => p.status === "ACCEPTED").length;
  const totalPending = allProposals.filter(p => ["SENT", "VIEWED"].includes(p.status)).length;
  const totalValue = allProposals
    .filter(p => p.status === "ACCEPTED")
    .reduce((s, p) => s + parseFloat(String(p.subtotal)), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Interactive proposals with e-signature and client portal.</p>
        </div>
        <Link
          href={`/workspaces/${slug}/crm/proposals/new${dealId ? `?dealId=${dealId}` : ""}`}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white shadow-sm"
          style={{ backgroundColor: shop.primaryColor || "#064e3b" }}
        >
          <Plus className="w-4 h-4" /> New Proposal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Accepted", value: totalAccepted, color: "#10b981" },
          { label: "Awaiting Response", value: totalPending, color: "#0ea5e9" },
          { label: "Won Value", value: formatCurrency(totalValue, shop.currency || "KES"), color: "#6366f1" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {allProposals.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No proposals yet. Create your first interactive proposal.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {allProposals.map((p) => (
              <Link
                key={p.id}
                href={`/workspaces/${slug}/crm/proposals/${p.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-gray-400">{p.proposalNumber}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[p.status] || STATUS_STYLE["DRAFT"]}`}>
                      {p.status.replace("_", " ")}
                    </span>
                    {p.viewCount > 0 && (
                      <span className="text-[10px] text-gray-400">👁 {p.viewCount}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.client?.name || p.deal?.contactName || "No client linked"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(parseFloat(String(p.subtotal)), p.currency)}
                  </p>
                  {p.expiresAt && (
                    <p className={`text-[11px] mt-0.5 ${new Date(p.expiresAt) < new Date() ? "text-red-500" : "text-gray-400"}`}>
                      {new Date(p.expiresAt) < new Date() ? "Expired" : `Expires ${new Date(p.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
