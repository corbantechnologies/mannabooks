// src/app/workspaces/[slug]/projects/[id]/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getProjectByIdAction } from "@/lib/actions/projects";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Users, Target, Clock, CheckCircle2,
  AlertTriangle, Plus, FileText, Briefcase,
} from "lucide-react";
import { ProjectTimesheetPanel } from "./ProjectTimesheetPanel";
import { ProjectMilestonePanel } from "./ProjectMilestonePanel";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

const STATUS_COLOR: Record<string, string> = {
  PLANNING: "#6366f1",
  ACTIVE: "#10b981",
  ON_HOLD: "#f59e0b",
  COMPLETED: "#0ea5e9",
  CANCELLED: "#6b7280",
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug, id } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const result = await getProjectByIdAction(id, shop.id);
  if (!result.project) notFound();

  const { project, metrics } = result;
  const statusColor = STATUS_COLOR[project.status] || "#94a3b8";
  const budget = parseFloat(String(project.budgetAmount));
  const budgetHours = parseFloat(String(project.budgetHours));
  const budgetUsedPct = budget > 0 && metrics ? Math.min(100, Math.round((metrics.totalBillable / budget) * 100)) : 0;
  const hoursUsedPct = budgetHours > 0 && metrics ? Math.min(100, Math.round((metrics.approvedHours / budgetHours) * 100)) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <Link href={`/workspaces/${slug}/projects`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <ArrowLeft className="w-3.5 h-3.5" /> Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-gray-400">{project.projectCode}</span>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: statusColor, backgroundColor: `${statusColor}18` }}
            >
              {project.status.replace("_", " ")}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          {project.client && (
            <Link href={`/workspaces/${slug}/clients/${project.client.id}`} className="text-sm text-gray-500 hover:underline">
              {project.client.name}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {project.contract && (
            <Link
              href={`/workspaces/${slug}/crm/contracts/${project.contract.id}`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <Briefcase className="w-3 h-3" /> {project.contract.contractNumber}
            </Link>
          )}
        </div>
      </div>

      {/* Budget / Hours metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Budget"
          value={formatCurrency(budget, project.currency)}
          subtext={`${budgetUsedPct}% spent`}
          pct={budgetUsedPct}
          barColor={statusColor}
        />
        <MetricCard
          label="Billable Revenue"
          value={metrics ? formatCurrency(metrics.totalBillable, project.currency) : "—"}
          subtext="from approved timesheets"
          pct={null}
          barColor="#0ea5e9"
        />
        <MetricCard
          label="Hours Logged"
          value={metrics ? `${metrics.approvedHours.toFixed(1)}h` : "—"}
          subtext={budgetHours ? `of ${budgetHours}h estimated` : "no estimate set"}
          pct={hoursUsedPct}
          barColor="#6366f1"
        />
        <MetricCard
          label="Milestones"
          value={`${project.milestones?.filter((m: any) => m.status === "INVOICED").length || 0} / ${project.milestones?.length || 0}`}
          subtext="invoiced"
          pct={project.milestones?.length ? Math.round(((project.milestones?.filter((m: any) => m.status === "INVOICED").length || 0) / project.milestones!.length) * 100) : 0}
          barColor="#10b981"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Team */}
          <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team</h3>
            </div>
            <div className="space-y-2.5">
              {project.members?.length === 0 && (
                <p className="text-xs text-gray-400">No team members assigned.</p>
              )}
              {project.members?.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-white">{(m.user?.name || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{m.user?.name || "Unknown"}</p>
                    <p className="text-[10px] text-gray-400">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {(project.startDate || project.endDate) && (
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Timeline</h3>
              {project.startDate && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Start</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {new Date(project.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
              {project.endDate && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Target End</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {new Date(project.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h3>
              <p className="text-xs text-gray-500 leading-5 whitespace-pre-line">{project.description}</p>
            </div>
          )}
        </div>

        {/* Right — tabs for milestones + timesheets */}
        <div className="md:col-span-2 space-y-5">
          <ProjectMilestonePanel
            milestones={project.milestones || []}
            projectId={project.id}
            shopId={shop.id}
            shopSlug={slug}
            clientId={project.clientId || undefined}
            currency={project.currency}
            brandColor={shop.primaryColor || "#064e3b"}
          />

          <ProjectTimesheetPanel
            timesheets={project.timesheets || []}
            projectId={project.id}
            shopId={shop.id}
            shopSlug={slug}
            currency={project.currency}
            brandColor={shop.primaryColor || "#064e3b"}
            budgetType={project.budgetType}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, subtext, pct, barColor,
}: { label: string; value: string; subtext: string; pct: number | null; barColor: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {pct !== null && (
        <div className="mt-2 space-y-1">
          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
          </div>
        </div>
      )}
      <p className="text-[11px] text-gray-400 mt-1">{subtext}</p>
    </div>
  );
}
