import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, clients, users } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectsClient } from "@/components/projects/projects-client";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  const [rows, clientList, managerList] = await Promise.all([
    db
      .select({ project: projects, clientName: clients.name, pmName: users.name, pmAvatar: users.avatarUrl })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(users, eq(projects.projectManagerId, users.id))
      .orderBy(desc(projects.updatedAt)),
    db.select({ id: clients.id, name: clients.name }).from(clients),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);

  const data = rows.map((r) => ({
    ...r.project,
    clientName: r.clientName,
    pmName: r.pmName,
    pmAvatar: r.pmAvatar,
  }));

  return (
    <div>
      <PageHeader
        kicker="Delivery"
        title="Projects"
        subtitle="Every interior project with its own detailed workspace, timeline and budget."
      >
        <ProjectFormDialog clients={clientList} managers={managerList} defaultOpen={sp.new === "1"} />
      </PageHeader>
      <ProjectsClient projects={data} clients={clientList} managers={managerList} />
    </div>
  );
}
