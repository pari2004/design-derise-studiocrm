"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  UserPlus,
  ListChecks,
  FolderKanban,
  CheckCircle2,
  IndianRupee,
  Truck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";
import type { Notification } from "@/db/schema";
import {
  markNotificationRead,
  markAllNotificationsRead,
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

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const hasUnread = unreadCount > 0;

  function handleOpen(n: Notification) {
    setOpen(false);
    if (!n.isRead) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        router.refresh();
      });
    }
    if (n.href) router.push(n.href);
  }

  function handleMarkAll() {
    if (!hasUnread) return;
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hidden sm:inline-flex"
          aria-label={
            hasUnread
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="text-taupe" />
          {hasUnread && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[10px] font-bold leading-none text-charcoal-text ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/70 px-3 py-2.5">
          <p className="text-sm font-semibold text-charcoal-text">
            Notifications
            {hasUnread && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {unreadCount} new
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={!hasUnread || pending}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-taupe transition-colors hover:bg-sand/50 disabled:pointer-events-none disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        </div>

        <div className="max-h-[22rem] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {notifications.map((n) => {
                const Icon = ICONS[n.type] ?? Info;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-sand/40",
                        !n.isRead && "bg-lime/10",
                      )}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand/60 text-taupe">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-charcoal-text">
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                          )}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
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

        <div className="border-t border-border/70 p-1">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-taupe transition-colors hover:bg-sand/50"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
