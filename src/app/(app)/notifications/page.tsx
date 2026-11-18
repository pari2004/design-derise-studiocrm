import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await getNotifications(session.id, 100);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        kicker="Activity"
        title="Notifications"
        subtitle="Updates on leads, tasks, approvals and payments assigned to you."
      />
      <NotificationsClient
        notifications={notifications}
        unreadCount={unreadCount}
      />
    </div>
  );
}
