"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, activities } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { PROJECT_STAGE_LABELS } from "@/lib/constants";

const VALID_STAGES = [
  "initial_enquiry",
  "concept_design",
  "procurement",
  "execution",
] as const;

export async function updateProjectStage(projectId: string, stage: string) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };

  if (!VALID_STAGES.includes(stage as (typeof VALID_STAGES)[number])) {
    return { ok: false, error: "Invalid stage" };
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (!project) return { ok: false, error: "Project not found" };
  if (project.stage === stage) return { ok: true };

  await db
    .update(projects)
    .set({ stage: stage as (typeof VALID_STAGES)[number], updatedAt: new Date().toISOString() })
    .where(eq(projects.id, projectId));

  await db.insert(activities).values({
    type: "general",
    title: `${project.name} moved to ${PROJECT_STAGE_LABELS[stage]}`,
    description: `Pipeline stage updated by ${session.name}.`,
    projectId: project.id,
    actorId: session.id,
    isSample: false,
  });

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}
