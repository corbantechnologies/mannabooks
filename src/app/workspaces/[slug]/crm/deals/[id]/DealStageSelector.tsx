"use client";

import { useState, useTransition } from "react";
import { updateDealStageAction } from "@/lib/actions/crm";
import type { DealStage } from "@/lib/actions/crm";
import { ChevronDown } from "lucide-react";

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: "LEAD",          label: "🌱 Lead",         color: "#94a3b8" },
  { id: "QUALIFIED",     label: "🎯 Qualified",     color: "#6366f1" },
  { id: "PROPOSAL_SENT", label: "📋 Proposal Sent", color: "#0ea5e9" },
  { id: "NEGOTIATION",   label: "🤝 Negotiation",   color: "#f59e0b" },
  { id: "WON",           label: "🏆 Won",           color: "#10b981" },
  { id: "LOST",          label: "💔 Lost",          color: "#ef4444" },
];

interface DealStageSelectorProps {
  dealId: string;
  shopId: string;
  shopSlug: string;
  currentStage: DealStage;
  brandColor: string;
}

export function DealStageSelector({ dealId, shopId, shopSlug, currentStage, brandColor }: DealStageSelectorProps) {
  const [stage, setStage] = useState<DealStage>(currentStage);
  const [isPending, startTransition] = useTransition();
  const [lossReason, setLossReason] = useState("");
  const [showLossModal, setShowLossModal] = useState(false);
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);

  const currentDef = STAGES.find(s => s.id === stage) || STAGES[0];

  const handleChange = (newStage: DealStage) => {
    if (newStage === stage) return;
    if (newStage === "LOST") {
      setPendingStage(newStage);
      setShowLossModal(true);
      return;
    }
    applyStageChange(newStage);
  };

  const applyStageChange = (newStage: DealStage, reason?: string) => {
    setStage(newStage);
    setShowLossModal(false);
    startTransition(async () => {
      await updateDealStageAction(dealId, shopId, shopSlug, newStage, reason);
    });
  };

  return (
    <>
      <div className="relative">
        <select
          value={stage}
          onChange={e => handleChange(e.target.value as DealStage)}
          disabled={isPending}
          className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-lg border text-sm font-semibold transition-all disabled:opacity-60 focus:outline-none focus:ring-2"
          style={{
            borderColor: `${currentDef.color}60`,
            backgroundColor: `${currentDef.color}15`,
            color: currentDef.color,
          }}
        >
          {STAGES.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: currentDef.color }} />
      </div>

      {/* Loss reason modal */}
      {showLossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900">Why was this deal lost?</h3>
            <textarea
              value={lossReason}
              onChange={e => setLossReason(e.target.value)}
              rows={3}
              placeholder="e.g. Budget constraints, competitor pricing…"
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowLossModal(false)}
                className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => applyStageChange("LOST", lossReason.trim() || undefined)}
                className="flex-1 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Mark Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
