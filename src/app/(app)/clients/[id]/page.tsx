import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { eq, desc, and } from "drizzle-orm";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Home,
  Pencil,
  FileText,
  IndianRupee,
  Plus,
  Download,
} from "lucide-react";
import { db } from "@/db";
import { clients, projects, documents, quotations, activities } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientAttachmentDialog } from "@/components/clients/client-attachment-dialog";
import { QuotationFormDialog } from "@/components/quotations/quotation-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CLIENT_STATUS,
  PROJECT_STATUS,
  DOC_STATUS,
} from "@/lib/constants";
import {
  formatINR,
  formatINRCompact,
  formatDate,
  initials,
  relativeTime,
  percent,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await db.query.clients.findFirst({ where: eq(clients.id, id) });
  if (!client) notFound();

  const [clientProjects, clientDocs, clientInvoices, clientActivity, projectList] =
    await Promise.all([
      db.select().from(projects).where(eq(projects.clientId, id)).orderBy(desc(projects.updatedAt)),
      db.select().from(documents).where(eq(documents.clientId, id)).orderBy(desc(documents.createdAt)),
      db.select().from(quotations).where(and(eq(quotations.clientId, id), eq(quotations.type, "invoice"))).orderBy(desc(quotations.issueDate)),
      db.select().from(activities).where(eq(activities.projectId, id)).orderBy(desc(activities.createdAt)).limit(10),
      db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.clientId, id)),
    ]);

  // The invoice form needs the client in its dropdown (preselected) + this
  // client's projects to optionally link against.
  const clientOption = [{ id: client.id, name: client.name }];
  const invoiceInitial = { type: "invoice" as const, clientId: client.id };

  const totalBilled = clientInvoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = clientInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = totalBilled - totalPaid;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-charcoal-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      <div className="glass mb-6 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-lg">
            {client.avatarUrl && <AvatarImage src={client.avatarUrl} alt={client.name} />}
            <AvatarFallback>{initials(client.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-charcoal-text">
                {client.name}
              </h1>
              <StatusBadge map={CLIENT_STATUS} value={client.status} />
              {client.isSample && <SampleBadge />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {client.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{client.phone}</span>}
              {client.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{client.email}</span>}
              {client.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{client.city}</span>}
            </div>
          </div>
        </div>
        <ClientFormDialog
          client={client}
          trigger={
            <Button variant="secondary">
              <Pencil className="h-4 w-4" /> Edit profile
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects ({clientProjects.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({clientDocs.length})</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card glass className="lg:col-span-2">
              <CardHeader><CardTitle>Property & Preferences</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Fact icon={<Home className="h-4 w-4" />} label="Property Type" value={client.propertyType ?? "—"} />
                <Fact icon={<MapPin className="h-4 w-4" />} label="Address" value={client.address ?? "—"} />
                <Fact icon={<IndianRupee className="h-4 w-4" />} label="Budget Preference" value={client.budgetPreference ? formatINR(client.budgetPreference) : "—"} />
                <Fact icon={<FileText className="h-4 w-4" />} label="Company" value={client.company ?? "—"} />
                {client.propertyDetails && (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs text-muted-foreground">Property Details</p>
                    <p className="text-sm text-charcoal-text">{client.propertyDetails}</p>
                  </div>
                )}
                {client.designPreferences && (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs text-muted-foreground">Design Preferences</p>
                    <p className="rounded-xl bg-white/50 p-3 text-sm text-charcoal-text">{client.designPreferences}</p>
                  </div>
                )}
                {client.notes && (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm text-charcoal-text">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card glass>
              <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Money label="Total Billed" value={totalBilled} />
                <Money label="Received" value={totalPaid} positive />
                <Money label="Outstanding" value={outstanding} danger />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects">
          {clientProjects.length === 0 ? (
            <EmptyState icon={Home} title="No projects yet" description="This client has no linked projects." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {clientProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <Card glass className="glass-hover overflow-hidden">
                    <div className="relative h-32 w-full">
                      {p.coverImage && <Image src={p.coverImage} alt={p.name} fill sizes="400px" className="object-cover" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="font-display font-semibold text-cream">{p.name}</p>
                        <p className="text-xs text-cream/80">{p.location}</p>
                      </div>
                      <div className="absolute right-2 top-2"><StatusBadge map={PROJECT_STATUS} value={p.status} /></div>
                    </div>
                    <CardContent className="pt-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{formatINRCompact(p.contractValue)}</span>
                        <span className="font-semibold">{percent(p.completion)}</span>
                      </div>
                      <Progress value={p.completion} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Files &amp; attachments linked to this client.</p>
            <ClientAttachmentDialog clientId={client.id} />
          </div>
          {clientDocs.length === 0 ? (
            <EmptyState icon={FileText} title="No documents" description="Upload an attachment to get started." />
          ) : (
            <div className="grid gap-3">
              {clientDocs.map((d) => (
                <Card key={d.id} glass className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand/50">
                      <FileText className="h-5 w-5 text-taupe" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-charcoal-text">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.category ?? "Attachment"} · v{d.version} · {formatDate(d.createdAt)}{d.fileSize ? ` · ${humanSize(d.fileSize)}` : ""}</p>
                    </div>
                  </div>
                  {d.fileUrl && d.fileUrl !== "#" && (
                    <Button asChild variant="outline" size="sm">
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" download>
                        <Download className="h-4 w-4" /> Download
                      </a>
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Financials */}
        <TabsContent value="financials">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Invoices raised for this client.</p>
            <QuotationFormDialog
              clients={clientOption}
              projects={projectList}
              initial={invoiceInitial}
              trigger={
                <Button variant="lime" size="sm">
                  <Plus className="h-4 w-4" /> Add invoice
                </Button>
              }
            />
          </div>
          {clientInvoices.length === 0 ? (
            <EmptyState icon={IndianRupee} title="No invoices" description="Add an invoice for this client to get started." />
          ) : (
            <Card glass className="p-2">
              <div className="divide-y divide-border/50">
                {clientInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium text-charcoal-text">{inv.number}</p>
                      <p className="text-xs text-muted-foreground">Issued {formatDate(inv.issueDate)} · Due {formatDate(inv.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-charcoal-text">{formatINR(inv.total)}</p>
                        <p className="text-xs text-muted-foreground">Paid {formatINRCompact(inv.amountPaid)}</p>
                      </div>
                      <StatusBadge map={DOC_STATUS} value={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          {clientActivity.length === 0 ? (
            <EmptyState icon={FileText} title="No activity" description="Recent activity for this client will appear here." />
          ) : (
            <Card glass className="p-2">
              <ul className="divide-y divide-border/50">
                {clientActivity.map((a) => (
                  <li key={a.id} className="flex items-start justify-between p-3">
                    <div>
                      <p className="text-sm font-medium text-charcoal-text">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(a.createdAt)}</span>
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

function humanSize(bytes: number) {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
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

function Money({ label, value, positive, danger }: { label: string; value: number; positive?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-display text-lg font-bold ${danger ? "text-red-600" : positive ? "text-emerald-600" : "text-charcoal-text"}`}>
        {formatINR(value)}
      </span>
    </div>
  );
}
