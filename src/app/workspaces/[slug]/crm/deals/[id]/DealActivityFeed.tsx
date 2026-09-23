"use client";

import { useState, useTransition } from "react";
import { addDealActivityAction } from "@/lib/actions/crm";
import type { DealActivityType } from "@/lib/actions/crm";
import { MessageSquare, Phone, Mail, Users, Plus, Clock } from "lucide-react";

const ACTIVITY_TYPES: { id: DealActivityType; label: string; icon: React.ElementType; color: string }[] = [
  { id: "NOTE",    label: "Note",    icon: MessageSquare, color: "#6366f1" },
  { id: "CALL",    label: "Call",    icon: Phone,         color: "#0ea5e9" },
  { id: "EMAIL",   label: "Email",   icon: Mail,          color: "#f59e0b" },
  { id: "MEETING", label: "Meeting", icon: Users,         color: "#10b981" },
];

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  NOTE:             { icon: MessageSquare, color: "#6366f1" },
  CALL:             { icon: Phone,         color: "#0ea5e9" },
  EMAIL:            { icon: Mail,          color: "#f59e0b" },
  MEETING:          { icon: Users,         color: "#10b981" },
  STAGE_CHANGE:     { icon: Clock,         color: "#94a3b8" },
  PROPOSAL_SENT:    { icon: MessageSquare, color: "#0ea5e9" },
  PROPOSAL_ACCEPTED:{ icon: MessageSquare, color: "#10b981" },
  WON:              { icon: MessageSquare, color: "#10b981" },
  LOST:             { icon: MessageSquare, color: "#ef4444" },
};

interface Activity {
  id: string;
  activityType: string;
  title: string;
  body?: string | null;
  createdAt: string | Date;
  user?: { name: string } | null;
}

interface DealActivityFeedProps {
  activities: Activity[];
  dealId: string;
  shopId: string;
  shopSlug: string;
  brandColor: string;
}

export function DealActivityFeed({ activities: initialActivities, dealId, shopId, shopSlug, brandColor }: DealActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [selectedType, setSelectedType] = useState<DealActivityType>("NOTE");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLog = () => {
    if (!title.trim()) { setError("Activity title is required."); return; }
    setError(null);
    startTransition(async () => {
      const res = await addDealActivityAction({
        dealId,
        shopId,
        shopSlug,
        activityType: selectedType,
        title: title.trim(),
        body: body.trim() || undefined,
      });
      if (res.success && res.activity) {
        setActivities(prev => [res.activity as Activity, ...prev]);
        setTitle("");
        setBody("");
        setIsExpanded(false);
      } else {
        setError(res.error || "Failed to log activity.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Log activity form */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          {ACTIVITY_TYPES.map(at => {
            const Icon = at.icon;
            return (
              <button
                key={at.id}
                onClick={() => { setSelectedType(at.id); setIsExpanded(true); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedType === at.id && isExpanded
                    ? "text-white"
                    : "text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
                style={selectedType === at.id && isExpanded ? { backgroundColor: at.color } : {}}
              >
                <Icon className="w-3 h-3" />{at.label}
              </button>
            );
          })}
        </div>

        {isExpanded ? (
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Activity summary…"
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={2}
              placeholder="Additional notes (optional)…"
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsExpanded(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium">
                Cancel
              </button>
              <button
                onClick={handleLog}
                disabled={isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-60 shadow-sm"
                style={{ backgroundColor: brandColor }}
              >
                {isPending ? "Saving…" : "Log Activity"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-left px-3.5 py-2 rounded-lg bg-gray-50 text-sm text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            + Log a call, meeting, email, or note…
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
        {activities.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">
            No activity recorded yet. Start by logging a note, call, or meeting.
          </div>
        )}
        {activities.map((a) => {
          const def = ACTIVITY_ICONS[a.activityType] || ACTIVITY_ICONS["NOTE"];
          const Icon = def.icon;
          const ts = new Date(a.createdAt);
          return (
            <div key={a.id} className="flex gap-3 p-4">
              <div
                className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${def.color}18` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: def.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{a.title}</p>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {ts.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {" "}
                    {ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {a.body && <p className="text-xs text-gray-600 mt-1 leading-5">{a.body}</p>}
                {a.user && <p className="text-[11px] text-gray-400 mt-1">by {a.user.name}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
