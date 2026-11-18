import { getPipelineProjects } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard, type PipelineCard } from "@/components/pipeline/kanban-board";
import { db } from "@/db";
import { clients, users } from "@/db/schema";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [pipeline, clientList, managerList] = await Promise.all([
    getPipelineProjects(),
    db.select({ id: clients.id, name: clients.name }).from(clients),
    db.select({ id: users.id, name: users.name }).from(users),
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

  return (
    <div>
      <PageHeader
        kicker="Delivery"
        title="Project Pipeline"
        subtitle="Drag projects across the four workflow stages. Status updates persist instantly."
      >
        <ProjectFormDialog clients={clientList} managers={managerList} />
      </PageHeader>
      <KanbanBoard initial={cards} />
    </div>
  );
}
