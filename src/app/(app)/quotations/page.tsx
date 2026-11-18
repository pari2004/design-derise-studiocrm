import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations, clients, projects } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { QuotationsClient } from "@/components/quotations/quotations-client";
import { Card } from "@/components/ui/card";
import { formatINRCompact } from "@/lib/format";
import { FileText, Receipt, Wallet, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const [rows, clientList, projectList] = await Promise.all([
    db
      .select({ q: quotations, clientName: clients.name })
      .from(quotations)
      .leftJoin(clients, eq(quotations.clientId, clients.id))
      .orderBy(desc(quotations.issueDate)),
    db.select({ id: clients.id, name: clients.name }).from(clients),
    db.select({ id: projects.id, name: projects.name }).from(projects),
  ]);

  const data = rows.map((r) => ({ ...r.q, clientName: r.clientName }));
  const invoices = data.filter((d) => d.type === "invoice");
  const billed = invoices.reduce((s, i) => s + i.total, 0);
  const collected = invoices.reduce((s, i) => s + i.amountPaid, 0);

  const stats = [
    { label: "Documents", value: data.length.toString(), icon: FileText },
    { label: "Total Billed", value: formatINRCompact(billed), icon: Receipt },
    { label: "Collected", value: formatINRCompact(collected), icon: CheckCircle2 },
    { label: "Outstanding", value: formatINRCompact(billed - collected), icon: Wallet },
  ];

  return (
    <div>
      <PageHeader
        kicker="Finance"
        title="Quotations & Invoices"
        subtitle="Generate GST-ready, DesignandDesireStudio-branded quotations and invoices."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} glass className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-charcoal text-cream"><Icon className="h-5 w-5" /></div>
              <div>
                <p className="font-display text-xl font-bold text-charcoal-text">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>
      <QuotationsClient docs={data} clients={clientList} projects={projectList} />
    </div>
  );
}
