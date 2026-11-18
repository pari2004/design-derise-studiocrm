import { getCurrentUser } from "@/lib/auth";
import {
  getDashboardStats,
  getPipelineProjects,
  getRecentActivity,
  getUpcomingSchedule,
} from "@/lib/queries";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KanbanBoard, type PipelineCard } from "@/components/pipeline/kanban-board";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default async function DashboardPage() {
  const [user, stats, pipeline, activity, schedule] = await Promise.all([
    getCurrentUser(),
    getDashboardStats(),
    getPipelineProjects(),
    getRecentActivity(7),
    getUpcomingSchedule(6),
  ]);

  const cards: PipelineCard[] = pipeline.map((row) => ({
    id: row.project.id,
    name: row.project.name,
    clientName: row.clientName,
    projectType: row.project.projectType,
    location: row.project.location,
    coverImage: row.project.coverImage,
    contractValue: row.project.contractValue,
    budget: row.project.budget,
    budgetConsumed: row.project.budgetConsumed,
    completion: row.project.completion,
    status: row.project.status,
    stage: row.project.stage,
    nextDeadline: row.project.nextDeadline,
    pmName: row.pmName,
    pmAvatar: row.pmAvatar,
    isSample: row.project.isSample,
  }));

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker mb-1.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-charcoal-text md:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your creative workspace. Every project, every detail, beautifully
            organized.
          </p>
        </div>
        <Button asChild variant="default">
          <Link href="/projects?new=1">
            New Project <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Active Projects" value={stats.activeProjects} icon="projects" delta={12} accent />
        <KpiCard label="New Enquiries" value={stats.newEnquiries} icon="enquiries" delta={8} />
        <KpiCard label="Awaiting Approval" value={stats.awaitingApproval} icon="approval" delta={-3} />
        <KpiCard label="Pending Procurement" value={stats.pendingProcurement} icon="procurement" delta={5} />
        <KpiCard label="Total Revenue" value={stats.totalRevenue} icon="revenue" format="inr" delta={18} />
        <KpiCard label="Outstanding" value={stats.outstanding} icon="wallet" format="inr" delta={-6} deltaLabel="to collect" />
      </div>

      {/* Pipeline */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-charcoal-text">
              Project Pipeline
            </h2>
            <p className="text-sm text-muted-foreground">
              Drag projects across stages — status updates instantly.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/pipeline">
              Full board <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <KanbanBoard initial={cards} />
      </section>

      {/* Activity + Schedule */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ActivityFeed items={activity} />
        <UpcomingSchedule items={schedule} />
      </div>
    </div>
  );
}
