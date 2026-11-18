"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { moodboards, activities } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";
import { notifyMany, projectRecipients } from "@/lib/notifications";
import { MOODBOARD_STATUS } from "@/lib/constants";

export type ActionResult = { ok: boolean; error?: string; id?: string };

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  projectId: z.string().optional(),
  room: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
});

export async function createMoodboard(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const id = createId();
  await db.insert(moodboards).values({
    id,
    title: d.title,
    projectId: d.projectId || null,
    room: d.room,
    description: d.description,
    coverImage: d.coverImage || null,
    approvalStatus: "draft",
    isSample: false,
  });
  revalidatePath("/moodboards");
  return { ok: true, id };
}

export async function setMoodboardStatus(id: string, status: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const mb = await db.query.moodboards.findFirst({ where: eq(moodboards.id, id) });
  if (!mb) return { ok: false, error: "Not found" };
  await db
    .update(moodboards)
    .set({ approvalStatus: status as any, updatedAt: new Date().toISOString() })
    .where(eq(moodboards.id, id));
  if (["approved", "changes_requested", "rejected"].includes(status)) {
    await db.insert(activities).values({
      type: "approval",
      title: `${mb.title} — ${MOODBOARD_STATUS[status].label}`,
      description: mb.room ?? undefined,
      projectId: mb.projectId,
      actorId: session.id,
      isSample: false,
    });
  }

  // Notify the project team on share (approval requested) and on any outcome.
  if (
    ["shared", "approved", "changes_requested", "rejected"].includes(status) &&
    mb.approvalStatus !== status
  ) {
    const title =
      status === "shared"
        ? `Approval requested — ${mb.title}`
        : `Moodboard ${MOODBOARD_STATUS[status].label.toLowerCase()} — ${mb.title}`;
    await notifyMany(
      await projectRecipients(mb.projectId, ["project_manager", "designer"]),
      {
        type: "approval",
        title,
        body: mb.room ?? undefined,
        href: "/moodboards",
        actorId: session.id,
        skipUserId: session.id,
      },
    );
  }

  revalidatePath("/moodboards");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteMoodboard(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(moodboards).where(eq(moodboards.id, id));
  revalidatePath("/moodboards");
  return { ok: true };
}
