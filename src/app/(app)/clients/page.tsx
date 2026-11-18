import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, projects } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { ClientsClient } from "@/components/clients/clients-client";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
  const counts = await db
    .select({ clientId: projects.clientId, count: sql<number>`count(*)` })
    .from(projects)
    .groupBy(projects.clientId);
  const countMap = new Map(counts.map((c) => [c.clientId, c.count]));

  const data = rows.map((c) => ({
    ...c,
    projectCount: Number(countMap.get(c.id) ?? 0),
  }));

  return (
    <div>
      <PageHeader
        kicker="Sales"
        title="Clients"
        subtitle="Your complete client database — profiles, projects, financials and history."
      >
        <ClientFormDialog />
      </PageHeader>
      <ClientsClient clients={data} />
    </div>
  );
}
