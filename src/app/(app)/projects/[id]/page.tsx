import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { eq, desc } from "drizzle-orm";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  CalendarClock,
  User,
  IndianRupee,
  Images,
  CheckSquare,
  ShoppingCart,
  FileText,
  Stamp,
  Wallet,
  Hammer,
} from "lucide-react";
import { db } from "@/db";
import {
  projects,
  clients,
  users,
  tasks,
  moodboards,
  purchaseOrders,
  documents,
  vendors,
} from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectBudget } from "@/components/projects/project-budget";
import {
  PROJECT_STATUS,
  PROJECT_STAGE_LABELS,
  MOODBOARD_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  PROCUREMENT_STAGE_LABELS,
  PAYMENT_STATUS,
} from "@/lib/constants";
import {
  formatINR,
  formatINRCompact,
  formatDate,
  formatNumber,
  initials,
  percent,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) notFound();

  const [client, pm, projTasks, projMoodboards, projPOs, projDocs, clientList, managerList] =
    await Promise.all([
      project.clientId ? db.query.clients.findFirst({ where: eq(clients.id, project.clientId) }) : null,
      project.projectManagerId ? db.query.users.findFirst({ where: eq(users.id, project.projectManagerId) }) : null,
      db.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(tasks.dueDate),
      db.select().from(moodboards).where(eq(moodboards.projectId, id)),
      db.select({ po: purchaseOrders, vendorName: vendors.name }).from(purchaseOrders).leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id)).where(eq(purchaseOrders.projectId, id)),
      db.select().from(documents).where(eq(documents.projectId, id)).orderBy(desc(documents.createdAt)),
      db.select({ id: clients.id, name: clients.name }).from(clients),
      db.select({ id: users.id, name: users.name }).from(users),
    ]);

  const remaining = project.budget - project.budgetConsumed;
  const grossProfit = project.contractValue - project.budgetConsumed;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-charcoal-text">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      {/* Hero */}
      <div className="glass relative mb-6 overflow-hidden rounded-2xl">
        <div className="relative h-48 w-full sm:h-56">
          {project.coverImage && <Image src={project.coverImage} alt={project.name} fill sizes="1200px" className="object-cover" priority />}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <StatusBadge map={PROJECT_STATUS} value={project.status} />
                <span className="rounded-full bg-cream/90 px-2.5 py-0.5 text-xs font-medium text-charcoal-text">{PROJECT_STAGE_LABELS[project.stage]}</span>
                {project.isSample && <SampleBadge />}
              </div>
              <h1 className="font-display text-2xl font-bold text-cream sm:text-3xl">{project.name}</h1>
              <p className="mt-0.5 text-sm text-cream/80">
                {client?.name ?? "No client"} · {project.projectType ?? ""} · {project.location ?? ""}
              </p>
            </div>
            <ProjectFormDialog
              clients={clientList}
              managers={managerList}
              project={project}
              trigger={<Button variant="lime">Edit Project</Button>}
            />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<IndianRupee className="h-4 w-4" />} label="Contract Value" value={formatINRCompact(project.contractValue)} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="Budget Consumed" value={formatINRCompact(project.budgetConsumed)} />
        <Stat icon={<Ruler className="h-4 w-4" />} label="Property Area" value={project.propertyArea ? `${formatNumber(project.propertyArea)} sq ft` : "—"} />
        <Stat icon={<CalendarClock className="h-4 w-4" />} label="Completion Target" value={formatDate(project.expectedCompletion)} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="moodboards">Moodboards ({projMoodboards.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({projTasks.length})</TabsTrigger>
          <TabsTrigger value="procurement">Procurement ({projPOs.length})</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="documents">Documents ({projDocs.length})</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card glass className="lg:col-span-2">
              <CardHeader><CardTitle>Project Brief</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-charcoal-text">{project.description ?? "No description provided."}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Fact icon={<MapPin className="h-4 w-4" />} label="Address" value={project.propertyAddress ?? project.location ?? "—"} />
                  <Fact icon={<CalendarClock className="h-4 w-4" />} label="Start Date" value={formatDate(project.startDate)} />
                  <Fact icon={<User className="h-4 w-4" />} label="Project Manager" value={pm?.name ?? "Unassigned"} />
                  <Fact icon={<CalendarClock className="h-4 w-4" />} label="Next Deadline" value={formatDate(project.nextDeadline)} />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-charcoal-text">Overall Progress</span>
                    <span className="font-semibold text-charcoal-text">{percent(project.completion)}</span>
                  </div>
                  <Progress value={project.completion} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card glass>
                <CardHeader><CardTitle>Financials</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  <Row label="Budget" value={formatINR(project.budget)} />
                  <Row label="Consumed" value={formatINR(project.budgetConsumed)} />
                  <Row label="Remaining" value={formatINR(remaining)} accent={remaining >= 0} />
                  <div className="my-1 h-px bg-border/60" />
                  <Row label="Contract Value" value={formatINR(project.contractValue)} />
                  <Row label="Gross Profit" value={formatINR(grossProfit)} accent={grossProfit >= 0} />
                </CardContent>
              </Card>
              {pm && (
                <Card glass>
                  <CardHeader><CardTitle>Team</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {pm.avatarUrl && <AvatarImage src={pm.avatarUrl} alt={pm.name} />}
                        <AvatarFallback>{initials(pm.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-charcoal-text">{pm.name}</p>
                        <p className="text-xs text-muted-foreground">{pm.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Moodboards */}
        <TabsContent value="moodboards">
          {projMoodboards.length === 0 ? (
            <EmptyState icon={Images} title="No moodboards yet" description="Create a moodboard to capture the design direction." action={<Button asChild variant="lime"><Link href="/moodboards">Go to Moodboards</Link></Button>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projMoodboards.map((m) => (
                <Link key={m.id} href="/moodboards">
                  <Card glass className="glass-hover overflow-hidden p-0">
                    <div className="relative h-36 w-full">
                      {m.coverImage && <Image src={m.coverImage} alt={m.title} fill sizes="400px" className="object-cover" />}
                      <div className="absolute right-2 top-2"><StatusBadge map={MOODBOARD_STATUS} value={m.approvalStatus} /></div>
                    </div>
                    <CardContent className="p-4">
                      <p className="font-medium text-charcoal-text">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.room}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks">
          {projTasks.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No tasks" description="Tasks for this project will appear here." />
          ) : (
            <Card glass className="p-2">
              <ul className="divide-y divide-border/50">
                {projTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-charcoal text-cream"><Hammer className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-medium text-charcoal-text">{t.name}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDate(t.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge map={TASK_PRIORITY} value={t.priority} />
                      <StatusBadge map={TASK_STATUS} value={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>

        {/* Procurement */}
        <TabsContent value="procurement">
          {projPOs.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No purchase orders" description="Procurement activity for this project will appear here." />
          ) : (
            <Card glass className="p-2">
              <ul className="divide-y divide-border/50">
                {projPOs.map(({ po, vendorName }) => (
                  <li key={po.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-medium text-charcoal-text">{po.title}</p>
                      <p className="text-xs text-muted-foreground">{po.poNumber} · {vendorName ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-charcoal-text">{formatINRCompact(po.amount)}</span>
                      <span className="rounded-full bg-sand/50 px-2 py-0.5 text-[10px] font-medium text-charcoal-text">{PROCUREMENT_STAGE_LABELS[po.stage]}</span>
                      <StatusBadge map={PAYMENT_STATUS} value={po.paymentStatus} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>

        {/* Budget (interactive) */}
        <TabsContent value="budget">
          <ProjectBudget
            budget={project.budget}
            consumed={project.budgetConsumed}
            contractValue={project.contractValue}
          />
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          {projDocs.length === 0 ? (
            <EmptyState icon={FileText} title="No documents" description="Upload agreements, plans and renders in the Documents module." />
          ) : (
            <div className="grid gap-3">
              {projDocs.map((d) => (
                <Card key={d.id} glass className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand/50"><FileText className="h-5 w-5 text-taupe" /></div>
                    <div>
                      <p className="text-sm font-medium text-charcoal-text">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.category} · v{d.version}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</span>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Approvals */}
        <TabsContent value="approvals">
          {projMoodboards.length === 0 ? (
            <EmptyState icon={Stamp} title="No approvals pending" description="Client design approvals will be tracked here." />
          ) : (
            <Card glass className="p-2">
              <ul className="divide-y divide-border/50">
                {projMoodboards.map((m) => (
                  <li key={m.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand/50"><Stamp className="h-4 w-4 text-taupe" /></div>
                      <div>
                        <p className="text-sm font-medium text-charcoal-text">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.room}</p>
                      </div>
                    </div>
                    <StatusBadge map={MOODBOARD_STATUS} value={m.approvalStatus} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card glass className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal text-cream">{icon}</div>
      <div>
        <p className="font-display text-lg font-bold text-charcoal-text">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand/50 text-taupe">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-charcoal-text">{value}</p>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${accent ? "text-emerald-600" : "text-charcoal-text"}`}>{value}</span>
    </div>
  );
}
