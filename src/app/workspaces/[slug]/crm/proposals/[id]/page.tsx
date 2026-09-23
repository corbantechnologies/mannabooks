// src/app/workspaces/[slug]/crm/proposals/[id]/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getProposalByIdAction } from "@/lib/actions/proposals";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Eye, CheckCircle2, Clock, Copy, Send, AlertTriangle,
} from "lucide-react";
import { ProposalActions } from "./ProposalActions";

interface ProposalDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
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

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const { slug, id } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const { proposal } = await getProposalByIdAction(id, shop.id);
  if (!proposal) notFound();

  const isExpired = proposal.expiresAt ? new Date(proposal.expiresAt) < new Date() : false;
  const subtotal = proposal.items.reduce((s: number, it: any) => s + parseFloat(String(it.itemTotal)), 0);

  const brandColor = shop.primaryColor || "#064e3b";

  const portalUrl = proposal.token?.token
    ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/portal/proposal/${proposal.token.token}`
    : null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <Link
        href={`/workspaces/${slug}/crm/proposals`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Proposals
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400">{proposal.proposalNumber}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[proposal.status] || STATUS_STYLE["DRAFT"]}`}>
              {proposal.status.replace("_", " ")}
            </span>
            {proposal.viewCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Eye className="w-3 h-3" /> {proposal.viewCount} view{proposal.viewCount !== 1 ? "s" : ""}
              </span>
            )}
            {isExpired && (
              <span className="flex items-center gap-1 text-[11px] text-red-500">
                <AlertTriangle className="w-3 h-3" /> Expired
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{proposal.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{proposal.client?.name || proposal.deal?.contactName || "No client linked"}</p>
        </div>

        <ProposalActions
          proposalId={proposal.id}
          shopId={shop.id}
          shopSlug={slug}
          status={proposal.status}
          portalUrl={portalUrl}
          dealId={proposal.dealId}
          clientId={proposal.clientId}
          brandColor={brandColor}
          clientEmail={proposal.client?.email || undefined}
        />
      </div>

      {/* Portal link */}
      {portalUrl && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
          <span className="text-xs text-blue-700 font-medium shrink-0">Client Portal:</span>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-700 hover:underline truncate"
          >
            {portalUrl}
          </a>
        </div>
      )}

      {/* Amendment notes */}
      {proposal.status === "AMENDMENT_REQUESTED" && proposal.amendmentNotes && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold text-amber-800 mb-1">📝 Client Requested Amendments</p>
          <p className="text-sm text-amber-900">{proposal.amendmentNotes}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left — meta */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-2.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Currency</span>
                <span className="text-xs font-medium text-gray-800">{proposal.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Subtotal</span>
                <span className="text-xs font-bold text-gray-900">{formatCurrency(subtotal, proposal.currency)}</span>
              </div>
              {proposal.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Expires</span>
                  <span className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-gray-800"}`}>
                    {new Date(proposal.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
              {proposal.signerName && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Signed by</span>
                  <span className="text-xs font-medium text-emerald-700">✓ {proposal.signerName}</span>
                </div>
              )}
              {proposal.deal && (
                <Link href={`/workspaces/${slug}/crm/deals/${proposal.deal.id}`} className="flex justify-between hover:underline">
                  <span className="text-xs text-gray-500">Deal</span>
                  <span className="text-xs font-medium text-blue-600 truncate ml-2">{proposal.deal.title}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right — items table */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Line Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 font-medium text-right w-16">Qty</th>
                    <th className="px-4 py-2.5 font-medium text-right w-28">Unit Price</th>
                    <th className="px-4 py-2.5 font-medium text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proposal.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        {item.packageLabel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                            {item.packageLabel}
                          </span>
                        )}
                        {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{parseFloat(String(item.quantity))}</td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {formatCurrency(parseFloat(String(item.unitPrice)), proposal.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(parseFloat(String(item.itemTotal)), proposal.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-800">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(subtotal, proposal.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Exec summary / scope */}
          {proposal.executiveSummary && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Executive Summary</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-6">{proposal.executiveSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
