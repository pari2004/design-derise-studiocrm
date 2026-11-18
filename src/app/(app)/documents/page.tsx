import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, projects } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentsClient } from "@/components/documents/documents-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const [rows, projectList] = await Promise.all([
    db
      .select({ doc: documents, projectName: projects.name })
      .from(documents)
      .leftJoin(projects, eq(documents.projectId, projects.id))
      .orderBy(desc(documents.createdAt)),
    db.select({ id: projects.id, name: projects.name }).from(projects),
  ]);

  const data = rows.map((r) => ({ ...r.doc, projectName: r.projectName }));

  return (
    <div>
      <PageHeader
        kicker="Finance"
        title="Documents & Contracts"
        subtitle="A centralized repository for agreements, plans, renders, invoices and site photos."
      />
      <DocumentsClient documents={data} projects={projectList} />
    </div>
  );
}
