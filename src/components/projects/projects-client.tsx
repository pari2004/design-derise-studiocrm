"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  CalendarClock,
  FolderKanban,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProjectFormDialog } from "./project-form-dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS, PROJECT_STAGE_LABELS } from "@/lib/constants";
import { formatINRCompact, formatDateShort, initials, percent } from "@/lib/format";
import { deleteProject } from "@/app/(app)/projects/actions";
import type { Project } from "@/db/schema";

type Row = Project & { clientName: string | null; pmName: string | null; pmAvatar: string | null };

const STATUS_FILTERS = [
  { value: "all", label: "All Projects" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "overdue", label: "Overdue" },
];

export function ProjectsClient({
  projects,
  clients,
  managers,
}: {
  projects: Row[];
  clients: { id: string; name: string }[];
  managers: { id: string; name: string }[];
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        const ms = status === "all" || p.status === status;
        const hay = `${p.name} ${p.clientName ?? ""} ${p.location ?? ""} ${p.projectType ?? ""}`.toLowerCase();
        return ms && hay.includes(q.toLowerCase());
      }),
    [projects, q, status],
  );

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteProject(id);
      if (res.ok) toast.success("Project deleted");
      else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                status === f.value
                  ? "border-transparent bg-lime text-charcoal shadow-lime"
                  : "border-border/60 bg-white/50 text-charcoal-text/70 hover:bg-white",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Start a new project or adjust your filters."
          action={<ProjectFormDialog clients={clients} managers={managers} />}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} glass className="glass-hover group overflow-hidden p-0">
              <Link href={`/projects/${p.id}`} className="block">
                <div className="relative h-40 w-full overflow-hidden">
                  {p.coverImage && (
                    <Image src={p.coverImage} alt={p.name} fill sizes="400px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <StatusBadge map={PROJECT_STATUS} value={p.status} />
                    {p.isSample && <SampleBadge />}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="font-display text-lg font-semibold text-cream">{p.name}</p>
                    <p className="text-xs text-cream/80">{p.clientName ?? "—"} · {p.projectType ?? ""}</p>
                  </div>
                </div>
              </Link>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location ?? "—"}</span>
                  <span className="rounded-full bg-sand/50 px-2 py-0.5 font-medium text-charcoal-text">{PROJECT_STAGE_LABELS[p.stage]}</span>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-charcoal-text">{formatINRCompact(p.budgetConsumed)} of {formatINRCompact(p.budget)}</span>
                    <span className="font-semibold text-charcoal-text">{percent(p.completion)}</span>
                  </div>
                  <Progress value={p.completion} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 ring-2 ring-white">
                      {p.pmAvatar && <AvatarImage src={p.pmAvatar} alt={p.pmName ?? ""} />}
                      <AvatarFallback className="text-[10px]">{initials(p.pmName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{p.pmName ?? "Unassigned"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.nextDeadline && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sand/50 px-2 py-0.5 text-[10px] font-medium text-charcoal-text">
                        <CalendarClock className="h-3 w-3" />{formatDateShort(p.nextDeadline)}
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ProjectFormDialog
                          clients={clients}
                          managers={managers}
                          project={p}
                          trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>}
                        />
                        <ConfirmDialog
                          title="Delete this project?"
                          description={`"${p.name}" and its board position will be removed.`}
                          onConfirm={() => onDelete(p.id)}
                          trigger={<DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
