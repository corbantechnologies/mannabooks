// src/app/workspaces/[slug]/projects/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getProjectsByShopAction } from "@/lib/actions/projects";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Plus, Briefcase, ArrowRight, Users, Target } from "lucide-react";

interface ProjectsPageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_COLOR: Record<string, string> = {
  PLANNING: "#6366f1",
  ACTIVE: "#10b981",
  ON_HOLD: "#f59e0b",
  COMPLETED: "#0ea5e9",
  CANCELLED: "#6b7280",
};

const STATUS_BG: Record<string, string> = {
  PLANNING: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400",
};

export default async function ProjectsListPage({ params }: ProjectsPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const result = await getProjectsByShopAction(shop.id);
  const allProjects = result.projects || [];

  const activeCount = allProjects.filter(p => p.status === "ACTIVE").length;
  const totalBudget = allProjects
    .filter(p => p.status !== "CANCELLED")
    .reduce((s, p) => s + parseFloat(String(p.budgetAmount || 0)), 0);
  const completedCount = allProjects.filter(p => p.status === "COMPLETED").length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage projects, timesheets, and milestone invoicing.</p>
        </div>
        <Link
          href={`/workspaces/${slug}/projects/new`}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white"
          style={{ backgroundColor: shop.primaryColor || "#064e3b" }}
        >
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Projects", value: activeCount, color: "#10b981" },
          { label: "Completed", value: completedCount, color: "#0ea5e9" },
          { label: "Total Budget", value: formatCurrency(totalBudget, shop.currency || "KES"), color: "#6366f1" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-4">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Projects grid */}
      {allProjects.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-12 text-center">
          <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No projects yet. Start by creating a new project.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {allProjects.map((project) => {
            const color = STATUS_COLOR[project.status] || "#94a3b8";
            const pendingMilestones = project.milestones?.filter((m: any) => m.status !== "INVOICED").length || 0;

            return (
              <Link
                key={project.id}
                href={`/workspaces/${slug}/projects/${project.id}`}
                className="group rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-mono text-gray-400">{project.projectCode}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_BG[project.status] || ""}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{project.name}</h3>
                    {project.client && (
                      <p className="text-xs text-gray-500 mt-0.5">{project.client.name}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                </div>

                <div className="space-y-2 border-t border-gray-100 dark:border-white/5 pt-3 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Budget</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(parseFloat(String(project.budgetAmount)), project.currency)}
                      <span className="text-[10px] text-gray-400 font-normal ml-1">({project.budgetType === "FIXED" ? "Fixed" : "T&M"})</span>
                    </span>
                  </div>
                  {pendingMilestones > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">{pendingMilestones} milestone{pendingMilestones !== 1 ? "s" : ""} pending</span>
                    </div>
                  )}
                  {(project.members?.length || 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{project.members!.length} team member{project.members!.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {project.endDate && (
                    <p className="text-xs text-gray-400">
                      Due: {new Date(project.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
