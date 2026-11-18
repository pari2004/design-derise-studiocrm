"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, createSession } from "@/lib/auth";

export type ActionResult = { ok: boolean; error?: string };

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  title: z.string().optional(),
  phone: z.string().optional(),
});

export async function updateProfile(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  await db
    .update(users)
    .set({ name: d.name, title: d.title, phone: d.phone, updatedAt: new Date().toISOString() })
    .where(eq(users.id, session.id));

  // Refresh the session cookie so the new name shows immediately.
  await createSession({ ...session, name: d.name, title: d.title ?? null });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
