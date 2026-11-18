"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, activities } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";

const num = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().optional(),
);

const schema = z.object({
  name: z.string().min(2, "Project name is required"),
  clientId: z.string().optional(),
  projectType: z.string().optional(),
  location: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyArea: num,
  budget: num,
  contractValue: num,
  coverImage: z.string().optional(),
  startDate: z.string().optional(),
  expectedCompletion: z.string().optional(),
  nextDeadline: z.string().optional(),
  projectManagerId: z.string().optional(),
  stage: z.string().optional(),
  status: z.string().optional(),
  completion: num,
  description: z.string().optional(),
});

export type ActionResult = { ok: boolean; error?: string; id?: string };

function parse(fd: FormData) {
  return schema.safeParse(Object.fromEntries(fd.entries()));
}

export async function createProject(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = parse(fd);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const id = createId();
  await db.insert(projects).values({
    id,
    name: d.name,
    clientId: d.clientId || null,
    projectType: d.projectType,
    location: d.location,
    propertyAddress: d.propertyAddress,
    propertyArea: d.propertyArea ?? null,
    budget: d.budget ?? 0,
    contractValue: d.contractValue ?? 0,
    coverImage: d.coverImage || null,
    startDate: d.startDate || null,
    expectedCompletion: d.expectedCompletion || null,
    nextDeadline: d.nextDeadline || null,
    projectManagerId: d.projectManagerId || null,
    stage: (d.stage as any) || "initial_enquiry",
    status: (d.status as any) || "in_progress",
    completion: d.completion ?? 0,
    description: d.description,
    isSample: false,
  });
  await db.insert(activities).values({
    type: "general",
    title: `New project created — ${d.name}`,
    description: d.location ?? undefined,
    projectId: id,
    actorId: session.id,
    isSample: false,
  });
  revalidatePath("/projects");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function updateProject(id: string, fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = parse(fd);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  await db
    .update(projects)
    .set({
      name: d.name,
      clientId: d.clientId || null,
      projectType: d.projectType,
      location: d.location,
      propertyAddress: d.propertyAddress,
      propertyArea: d.propertyArea ?? null,
      budget: d.budget ?? 0,
      contractValue: d.contractValue ?? 0,
      coverImage: d.coverImage || null,
      startDate: d.startDate || null,
      expectedCompletion: d.expectedCompletion || null,
      nextDeadline: d.nextDeadline || null,
      projectManagerId: d.projectManagerId || null,
      stage: (d.stage as any) || "initial_enquiry",
      status: (d.status as any) || "in_progress",
      completion: d.completion ?? 0,
      description: d.description,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(projects.id, id));
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/pipeline");
  return { ok: true, id };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/projects");
  revalidatePath("/pipeline");
  return { ok: true };
}
