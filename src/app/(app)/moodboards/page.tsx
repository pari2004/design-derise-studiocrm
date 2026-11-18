import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { moodboards, moodboardItems, projects } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { MoodboardsClient } from "@/components/moodboards/moodboards-client";

export const dynamic = "force-dynamic";

export default async function MoodboardsPage() {
  const [rows, projectList] = await Promise.all([
    db
      .select({ mb: moodboards, projectName: projects.name })
      .from(moodboards)
      .leftJoin(projects, eq(moodboards.projectId, projects.id))
      .orderBy(desc(moodboards.updatedAt)),
    db.select({ id: projects.id, name: projects.name }).from(projects),
  ]);

  const ids = rows.map((r) => r.mb.id);
  const items = ids.length
    ? await db.select().from(moodboardItems).where(inArray(moodboardItems.moodboardId, ids)).orderBy(moodboardItems.sortOrder)
    : [];

  const boards = rows.map((r) => ({
    ...r.mb,
    projectName: r.projectName,
    items: items.filter((i) => i.moodboardId === r.mb.id),
  }));

  return (
    <div>
      <PageHeader
        kicker="Delivery"
        title="Moodboards & Design Studio"
        subtitle="Curate concepts, share with clients and track approvals — all in one visual workspace."
      />
      <MoodboardsClient boards={boards} projects={projectList} />
    </div>
  );
}
