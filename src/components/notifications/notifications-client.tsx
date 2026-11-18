"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Trash2,
  UserPlus,
  ListChecks,
  FolderKanban,
  CheckCircle2,
  IndianRupee,
  Truck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";
import type { Notification } from "@/db/schema";
import {
  markNotificationRead,
  markAllNotificationsRead,
  clearReadNotifications,
} from "@/app/(app)/notifications/actions";

const ICONS: Record<Notification["type"], typeof Bell> = {
  lead: UserPlus,
  task: ListChecks,
  project: FolderKanban,
  approval: CheckCircle2,
  payment: IndianRupee,
  procurement: Truck,
  system: Info,
};

export function NotificationsClient({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const hasUnread = unreadCount > 0;
  const hasRead = notifications.some((n) => n.isRead);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  function handleOpen(n: Notification) {
    if (!n.isRead) run(() => markNotificationRead(n.id));
    if (n.href) router.push(n.href);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => run(markAllNotificationsRead)}
          disabled={!hasUnread || pending}
        >
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => run(clearReadNotifications)}
          disabled={!hasRead || pending}
        >
          <Trash2 className="h-4 w-4" /> Clear read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/40 bg-white/55 px-6 py-16 text-center backdrop-blur-xl">
          <Bell className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No notifications yet. Updates will appear here as leads, tasks and
            approvals are assigned to you.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl">
          {notifications.map((n, i) => {
            const Icon = ICONS[n.type] ?? Info;
            return (
              <li
                key={n.id}
                className={cn(
                  i > 0 && "border-t border-border/40",
                  !n.isRead && "bg-lime/10",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleOpen(n)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sand/30"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand/60 text-taupe">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-charcoal-text">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-lime" />
                      )}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-muted-foreground/80">
                      {relativeTime(n.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
