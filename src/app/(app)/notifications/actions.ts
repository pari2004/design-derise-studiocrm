"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth";

export type ActionResult = { ok: boolean; error?: string };

/** Mark a single notification read — scoped to the current user. */
export async function markNotificationRead(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date().toISOString() })
    .where(
      and(eq(notifications.id, id), eq(notifications.userId, session.id)),
    );
  revalidatePath("/notifications");
  return { ok: true };
}

/** Mark every unread notification for the current user as read. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date().toISOString() })
    .where(
      and(
        eq(notifications.userId, session.id),
        eq(notifications.isRead, false),
      ),
    );
  revalidatePath("/notifications");
  return { ok: true };
}

/** Delete all read notifications for the current user (clears history). */
export async function clearReadNotifications(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.userId, session.id),
        eq(notifications.isRead, true),
      ),
    );
  revalidatePath("/notifications");
  return { ok: true };
}
