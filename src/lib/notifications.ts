import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users, projects, type Notification } from "@/db/schema";

type Role = (typeof users.$inferSelect)["role"];

export type NotificationType = Notification["type"];

export type NotifyInput = {
  /** Recipient user id. */
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  actorId?: string | null;
};

/**
 * Create a notification for a single recipient. Safe to call from any server
 * action — it never throws into the caller (a failed notification should not
 * roll back the underlying business action).
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: input.userId,
      type: input.type ?? "system",
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      actorId: input.actorId ?? null,
      isSample: false,
    });
  } catch (err) {
    console.error("[notify] failed to create notification", err);
  }
}

/** Fan a notification out to several recipients, skipping an optional actor. */
export async function notifyMany(
  userIds: string[],
  input: Omit<NotifyInput, "userId"> & { skipUserId?: string },
): Promise<void> {
  const { skipUserId, ...rest } = input;
  const recipients = Array.from(new Set(userIds)).filter(
    (uid) => uid && uid !== skipUserId,
  );
  await Promise.all(recipients.map((userId) => notify({ ...rest, userId })));
}

/** User ids holding any of the given roles. */
export async function getUserIdsByRole(roles: Role[]): Promise<string[]> {
  if (roles.length === 0) return [];
  const rows = await db.query.users.findMany({
    where: inArray(users.role, roles),
    columns: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * Recipients for a project-scoped event: admins + the given roles, plus the
 * project's own manager. De-duplicated. Pass the actor's id to `notifyMany`'s
 * `skipUserId` so they aren't notified of their own action.
 */
export async function projectRecipients(
  projectId: string | null,
  roles: Role[] = [],
): Promise<string[]> {
  const ids = await getUserIdsByRole(
    Array.from(new Set<Role>(["admin", ...roles])),
  );
  if (projectId) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { projectManagerId: true },
    });
    if (project?.projectManagerId) ids.push(project.projectManagerId);
  }
  return ids;
}

/** Most recent notifications for a user (default 10). */
export async function getNotifications(
  userId: string,
  limit = 10,
): Promise<Notification[]> {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit,
  });
}

/** Count of unread notifications for a user. */
export async function getUnreadCount(userId: string): Promise<number> {
  const rows = await db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
    ),
    columns: { id: true },
  });
  return rows.length;
}
