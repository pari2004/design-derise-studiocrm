import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks, projects, users } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { TasksClient } from "@/components/tasks/tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [rows, projectList, memberList] = await Promise.all([
    db
      .select({ task: tasks, projectName: projects.name, assigneeName: users.name, assigneeAvatar: users.avatarUrl })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .orderBy(tasks.dueDate),
    db.select({ id: projects.id, name: projects.name }).from(projects),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);

  const data = rows.map((r) => ({
    ...r.task,
    projectName: r.projectName,
    assigneeName: r.assigneeName,
    assigneeAvatar: r.assigneeAvatar,
  }));

  return (
    <div>
      <PageHeader
        kicker="Delivery"
        title="Tasks & Schedule"
        subtitle="Plan work, schedule site visits and track execution across every project."
      />
      <TasksClient tasks={data} projects={projectList} members={memberList} />
    </div>
  );
}
