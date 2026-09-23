// src/app/workspaces/[slug]/crm/deals/[id]/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDealByIdAction } from "@/lib/actions/crm";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, Phone, Calendar, Target,
  TrendingUp, Plus, FileText, Briefcase, Clock,
} from "lucide-react";
import { DealStageSelector } from "./DealStageSelector";
import { DealActivityFeed } from "./DealActivityFeed";

interface DealDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

const STAGE_COLORS: Record<string, string> = {
  LEAD: "#94a3b8",
  QUALIFIED: "#6366f1",
  PROPOSAL_SENT: "#0ea5e9",
  NEGOTIATION: "#f59e0b",
  WON: "#10b981",
  LOST: "#ef4444",
};

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { slug, id } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const { deal } = await getDealByIdAction(id, shop.id);
  if (!deal) notFound();

  const stageColor = STAGE_COLORS[deal.stage] || "#94a3b8";
  const expectedCloseDate = deal.expectedCloseDate
    ? new Date(deal.expectedCloseDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back */}
      <Link href={`/workspaces/${slug}/crm`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <ArrowLeft className="w-3.5 h-3.5" /> CRM Pipeline
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: stageColor, backgroundColor: `${stageColor}18` }}
            >
              {deal.stage.replace("_", " ")}
            </span>
            {deal.client && (
              <Link href={`/workspaces/${slug}/clients/${deal.client.id}`} className="text-[11px] text-gray-500 hover:underline">
                → {deal.client.name}
              </Link>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{deal.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Contact: <strong className="text-gray-700 dark:text-gray-300">{deal.contactName}</strong></p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href={`/workspaces/${slug}/crm/proposals?dealId=${deal.id}`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <FileText className="w-3.5 h-3.5" /> New Proposal
          </Link>
          <Link
            href={`/workspaces/${slug}/crm/contracts/new?dealId=${deal.id}`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <Briefcase className="w-3.5 h-3.5" /> New Contract
          </Link>
          <Link
            href={`/workspaces/${slug}/projects/new?dealId=${deal.id}`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <Briefcase className="w-3.5 h-3.5" /> New Project
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column — deal info */}
        <div className="md:col-span-1 space-y-4">
          {/* Stage selector */}
          <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stage</h3>
            <DealStageSelector
              dealId={deal.id}
              shopId={shop.id}
              shopSlug={slug}
              currentStage={deal.stage}
              brandColor={shop.primaryColor || "#064e3b"}
            />
          </div>

          {/* Financials */}
          <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Financials</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Estimated Value</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(parseFloat(String(deal.estimatedValue)), deal.currency || shop.currency || "KES")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Win Probability</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{deal.winProbability}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${deal.winProbability}%`, backgroundColor: stageColor }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Weighted Value</span>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {formatCurrency(parseFloat(String(deal.estimatedValue)) * deal.winProbability / 100, deal.currency || "KES")}
                </span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{deal.contactName}</span>
              </div>
              {deal.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a href={`mailto:${deal.contactEmail}`} className="text-sm text-blue-500 hover:underline truncate">{deal.contactEmail}</a>
                </div>
              )}
              {deal.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a href={`tel:${deal.contactPhone}`} className="text-sm text-gray-700 dark:text-gray-300">{deal.contactPhone}</a>
                </div>
              )}
              {expectedCloseDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{expectedCloseDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Proposals linked */}
          {deal.proposals && deal.proposals.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proposals</h3>
              <div className="space-y-2">
                {deal.proposals.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/workspaces/${slug}/crm/proposals/${p.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.proposalNumber}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      p.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                      p.status === "SENT" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                      "bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-gray-400"
                    }`}>
                      {p.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Linked contracts */}
          {deal.contracts && deal.contracts.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contracts</h3>
              {deal.contracts.map((c: any) => (
                <Link key={c.id} href={`/workspaces/${slug}/crm/contracts/${c.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/8">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.contractNumber}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium">{c.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column — activity feed */}
        <div className="md:col-span-2">
          <DealActivityFeed
            activities={deal.activities || []}
            dealId={deal.id}
            shopId={shop.id}
            shopSlug={slug}
            brandColor={shop.primaryColor || "#064e3b"}
          />
        </div>
      </div>

      {/* Notes */}
      {deal.notes && (
        <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Internal Notes</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-6">{deal.notes}</p>
        </div>
      )}
    </div>
  );
}
