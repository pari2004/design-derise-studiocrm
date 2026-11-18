"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";
import { notify } from "@/lib/notifications";

export type ActionResult = { ok: boolean; error?: string; id?: string };

const schema = z.object({
  name: z.string().min(2, "Task name is required"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string().optional(),
  kind: z.string().optional(),
});

export async function createTask(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const id = createId();
  await db.insert(tasks).values({
    id,
    name: d.name,
    description: d.description,
    projectId: d.projectId || null,
    assigneeId: d.assigneeId || null,
    priority: (d.priority as any) || "medium",
    startDate: d.startDate || null,
    dueDate: d.dueDate || null,
    status: (d.status as any) || "todo",
    kind: (d.kind as any) || "task",
    isSample: false,
  });

  // Notify the assignee (unless they assigned the task to themselves).
  if (d.assigneeId && d.assigneeId !== session.id) {
    await notify({
      userId: d.assigneeId,
      type: "task",
      title: `New task: ${d.name}`,
      body: d.dueDate ? `Due ${d.dueDate.slice(0, 10)}.` : undefined,
      href: "/tasks",
      actorId: session.id,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function updateTaskStatus(id: string, status: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db
    .update(tasks)
    .set({ status: status as any, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, id));
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath("/tasks");
  return { ok: true };
}
