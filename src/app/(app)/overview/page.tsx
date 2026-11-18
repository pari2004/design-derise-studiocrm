import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats, getTeam, getRecentActivity } from "@/lib/queries";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "@/lib/nav";
import { PROJECT_STAGES } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/roles";
import { formatINRCompact, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

const QUICK = ["/leads", "/clients", "/projects", "/moodboards", "/procurement", "/finance", "/quotations", "/reports"];

export default async function OverviewPage() {
  const [user, stats, team, activity, allProjects] = await Promise.all([
    getCurrentUser(),
    getDashboardStats(),
    getTeam(),
    getRecentActivity(6),
    db.select().from(projects),
  ]);

  const firstName = user?.name.split(" ")[0] ?? "there";
  const stageCounts = PROJECT_STAGES.map((s) => ({
    ...s,
    count: allProjects.filter((p) => p.stage === s.value).length,
  }));
  const quickLinks = NAV_ITEMS.filter((n) => QUICK.includes(n.href));

  return (
    <div className="space-y-7">
      <div className="glass overflow-hidden rounded-2xl p-7">
        <p className="kicker mb-1.5">Workspace Overview</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-charcoal-text">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          A bird&apos;s-eye view of DesignandDesireStudio — your studio&apos;s projects,
          pipeline health and everything that needs your attention today.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Active Projects" value={stats.activeProjects.toString()} />
          <Metric label="New Enquiries" value={stats.newEnquiries.toString()} />
          <Metric label="Revenue" value={formatINRCompact(stats.totalRevenue)} />
          <Metric label="Outstanding" value={formatINRCompact(stats.outstanding)} />
        </div>
      </div>

      {/* Pipeline snapshot */}
      <Card glass>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Pipeline Snapshot</CardTitle>
          <Link href="/pipeline" className="inline-flex items-center gap-1 text-xs font-medium text-charcoal-text hover:underline">
            Open board <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stageCounts.map((s) => (
              <div key={s.value} className="rounded-xl border border-white/50 bg-white/50 p-4">
                <p className="font-display text-3xl font-bold text-charcoal-text">{s.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-charcoal-text">Jump to</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((l) => {
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href}>
                <Card glass className="glass-hover flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal text-cream"><Icon className="h-5 w-5" /></div>
                  <span className="text-sm font-medium text-charcoal-text">{l.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ActivityFeed items={activity} />
        <Card glass>
          <CardHeader><CardTitle>Your Team</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {team.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 p-2.5">
                  <Avatar className="h-9 w-9">
                    {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                    <AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal-text">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.title}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{ROLE_LABELS[u.role]}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/50 p-4">
      <p className="font-display text-2xl font-bold text-charcoal-text">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
