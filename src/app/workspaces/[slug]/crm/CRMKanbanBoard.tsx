"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { updateDealStageAction } from "@/lib/actions/crm";
import type { DealStage } from "@/lib/actions/crm";
import { User, Calendar, TrendingUp, GripVertical, ArrowRight } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  contactName: string;
  stage: DealStage;
  estimatedValue: string;
  currency: string;
  winProbability: number;
  expectedCloseDate?: string | null;
  client?: { name: string } | null;
  proposals?: { id: string; status: string }[];
}

interface CRMKanbanBoardProps {
  initialDeals: Deal[];
  shopId: string;
  shopSlug: string;
  brandColor: string;
  currency: string;
}

const STAGES: { id: DealStage; label: string; color: string; bgColor: string }[] = [
  { id: "LEAD",          label: "🌱 Lead",           color: "#94a3b8", bgColor: "#f8fafc" },
  { id: "QUALIFIED",     label: "🎯 Qualified",       color: "#6366f1", bgColor: "#eef2ff" },
  { id: "PROPOSAL_SENT", label: "📋 Proposal Sent",   color: "#0ea5e9", bgColor: "#f0f9ff" },
  { id: "NEGOTIATION",   label: "🤝 Negotiation",     color: "#f59e0b", bgColor: "#fffbeb" },
  { id: "WON",           label: "🏆 Won",             color: "#10b981", bgColor: "#f0fdf4" },
  { id: "LOST",          label: "💔 Lost",            color: "#ef4444", bgColor: "#fef2f2" },
];

export function CRMKanbanBoard({
  initialDeals,
  shopId,
  shopSlug,
  brandColor,
  currency,
}: CRMKanbanBoardProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleDragStart = (dealId: string) => setDraggedDealId(dealId);
  const handleDragOver = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };
  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = useCallback(async (targetStage: DealStage) => {
    setDragOverStage(null);
    if (!draggedDealId) return;
    const deal = deals.find(d => d.id === draggedDealId);
    if (!deal || deal.stage === targetStage) { setDraggedDealId(null); return; }

    // Optimistic update
    setDeals(prev => prev.map(d => d.id === draggedDealId ? { ...d, stage: targetStage } : d));
    setDraggedDealId(null);
    setUpdating(draggedDealId);

    try {
      await updateDealStageAction(deal.id, shopId, shopSlug, targetStage);
    } catch {
      // Revert on failure
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: deal.stage } : d));
    } finally {
      setUpdating(null);
    }
  }, [draggedDealId, deals, shopId, shopSlug]);

  const dealsByStage = (stage: DealStage) => deals.filter(d => d.stage === stage);

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-max">
        {STAGES.map((stage) => {
          const stageDeals = dealsByStage(stage.id);
          const stageTotal = stageDeals.reduce((s, d) => s + parseFloat(d.estimatedValue || "0"), 0);
          const isDragTarget = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 rounded-xl border border-gray-200 bg-gray-50/70 shadow-sm flex flex-col overflow-hidden"
              style={isDragTarget ? { outline: `2px solid ${stage.color}`, outlineOffset: "2px" } : undefined}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Stage header */}
              <div
                className={`px-3.5 py-3 flex items-center justify-between border-b ${isDragTarget ? "border-b-2" : "border-b"}`}
                style={{ 
                  backgroundColor: isDragTarget ? `${stage.color}15` : "#ffffff",
                  borderColor: isDragTarget ? stage.color : "#f1f5f9",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: stage.color }}>{stage.label}</span>
                  <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
                {stageTotal > 0 && (
                  <span className="text-[11px] text-gray-500 font-medium">
                    {formatCurrency(stageTotal, currency)}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className={`flex flex-col gap-2 p-2 min-h-[200px] rounded-b-xl transition-colors ${isDragTarget ? "bg-opacity-50" : ""}`}
                style={{ backgroundColor: isDragTarget ? `${stage.color}08` : "rgba(0,0,0,0.01)" }}>
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    shopSlug={shopSlug}
                    currency={currency}
                    isUpdating={updating === deal.id}
                    onDragStart={() => handleDragStart(deal.id)}
                    onDragEnd={() => setDraggedDealId(null)}
                    isDragging={draggedDealId === deal.id}
                    stageColor={stage.color}
                  />
                ))}

                {stageDeals.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-[11px] text-gray-400 text-center">
                      {isDragTarget ? "Drop here" : "No deals"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  shopSlug,
  currency,
  isUpdating,
  onDragStart,
  onDragEnd,
  isDragging,
  stageColor,
}: {
  deal: Deal;
  shopSlug: string;
  currency: string;
  isUpdating: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  stageColor: string;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative rounded-lg border border-gray-200 bg-white p-3 cursor-grab active:cursor-grabbing transition-all duration-150 ${
        isDragging ? "opacity-40 scale-95 shadow-lg" : "hover:shadow-md hover:-translate-y-px"
      } ${isUpdating ? "animate-pulse" : ""}`}
      style={{ borderColor: isDragging ? stageColor : undefined }}
    >
      {/* Drag handle */}
      <GripVertical className="w-3 h-3 text-gray-300 absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Title */}
      <Link href={`/workspaces/${shopSlug}/crm/deals/${deal.id}`} onClick={e => e.stopPropagation()}>
        <h4 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 pr-4 hover:underline">
          {deal.title}
        </h4>
      </Link>

      {/* Contact / Client */}
      <div className="flex items-center gap-1.5 mt-2">
        <User className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-[11px] text-gray-500 truncate">
          {deal.client?.name || deal.contactName}
        </span>
      </div>

      {/* Close date */}
      {deal.expectedCloseDate && (
        <div className="flex items-center gap-1.5 mt-1">
          <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="text-[11px] text-gray-500">
            {new Date(deal.expectedCloseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </div>
      )}

      {/* Footer: value + probability */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-gray-900">
          {formatCurrency(parseFloat(deal.estimatedValue || "0"), deal.currency || currency)}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${deal.winProbability}%`, backgroundColor: stageColor }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{deal.winProbability}%</span>
        </div>
      </div>

      {/* Proposal badge */}
      {(deal.proposals?.length ?? 0) > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {deal.proposals!.slice(0, 2).map(p => (
            <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              📋 {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
