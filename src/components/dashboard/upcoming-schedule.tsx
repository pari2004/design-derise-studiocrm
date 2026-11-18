import Link from "next/link";
import {
  MapPin,
  Users,
  Truck,
  Hammer,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { TASK_PRIORITY } from "@/lib/constants";
import type { Task } from "@/db/schema";

const KIND: Record<string, { icon: LucideIcon; label: string }> = {
  site_visit: { icon: MapPin, label: "Site Visit" },
  meeting: { icon: Users, label: "Meeting" },
  delivery: { icon: Truck, label: "Delivery" },
  installation: { icon: Hammer, label: "Installation" },
  task: { icon: CheckSquare, label: "Task" },
};

export function UpcomingSchedule({
  items,
}: {
  items: { task: Task; projectName: string | null }[];
}) {
  return (
    <Card glass>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Upcoming Schedule</CardTitle>
        <Link href="/tasks" className="text-xs font-medium text-charcoal-text hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {items.map(({ task, projectName }) => {
            const conf = KIND[task.kind] ?? KIND.task;
            const Icon = conf.icon;
            const prio = TASK_PRIORITY[task.priority];
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/50 px-3 py-2.5"
              >
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-charcoal text-cream">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-charcoal-text">
                    {task.name}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {conf.label} · {projectName ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs font-medium text-charcoal-text">
                    {formatDate(task.dueDate)}
                  </span>
                  <Badge variant={prio.variant} className="px-1.5 py-0 text-[10px]">
                    {prio.label}
                  </Badge>
                </div>
              </li>
            );
          })}
          {items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing scheduled. Enjoy the calm.
            </p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
