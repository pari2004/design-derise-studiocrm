import {
  Stamp,
  UserPlus,
  Wallet,
  Truck,
  ShoppingCart,
  MapPin,
  CheckSquare,
  Activity as ActivityIcon,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { relativeTime } from "@/lib/format";
import type { Activity } from "@/db/schema";

const ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  enquiry: { icon: UserPlus, color: "bg-sky-100 text-sky-700" },
  approval: { icon: Stamp, color: "bg-lime/30 text-charcoal-text" },
  vendor: { icon: Truck, color: "bg-amber-100 text-amber-700" },
  payment: { icon: Wallet, color: "bg-emerald-100 text-emerald-700" },
  procurement: { icon: ShoppingCart, color: "bg-purple-100 text-purple-700" },
  site_visit: { icon: MapPin, color: "bg-rose-100 text-rose-700" },
  task: { icon: CheckSquare, color: "bg-sand/70 text-charcoal-text" },
  general: { icon: ActivityIcon, color: "bg-sand/70 text-charcoal-text" },
};

export function ActivityFeed({
  items,
}: {
  items: { activity: Activity; actorName: string | null }[];
}) {
  return (
    <Card glass>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {items.map(({ activity, actorName }) => {
            const conf = ICONS[activity.type] ?? ICONS.general;
            const Icon = conf.icon;
            return (
              <li
                key={activity.id}
                className="flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/50"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${conf.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight text-charcoal-text">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                  {actorName && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      by {actorName}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {relativeTime(activity.createdAt)}
                </span>
              </li>
            );
          })}
          {items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
