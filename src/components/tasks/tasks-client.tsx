"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  LayoutGrid,
  List,
  Trash2,
  CalendarClock,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { TASK_STATUS, TASK_PRIORITY } from "@/lib/constants";
import { formatDate, initials } from "@/lib/format";
import { createTask, updateTaskStatus, deleteTask } from "@/app/(app)/tasks/actions";
import type { Task } from "@/db/schema";

type Row = Task & { projectName: string | null; assigneeName: string | null; assigneeAvatar: string | null };

const COLUMNS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

export function TasksClient({
  tasks,
  projects,
  members,
}: {
  tasks: Row[];
  projects: { id: string; name: string }[];
  members: { id: string; name: string }[];
}) {
  const [view, setView] = useState<"board" | "list">("board");
  const [items, setItems] = useState(tasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function move(id: string, status: string) {
    setOverCol(null);
    setDragId(null);
    const task = items.find((t) => t.id === id);
    if (!task || task.status === status) return;
    const prev = task.status;
    setItems((ts) => ts.map((t) => (t.id === id ? { ...t, status: status as any } : t)));
    startTransition(async () => {
      const res = await updateTaskStatus(id, status);
      if (!res.ok) {
        setItems((ts) => ts.map((t) => (t.id === id ? { ...t, status: prev } : t)));
        toast.error("Could not update task");
      }
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteTask(id);
      if (res.ok) {
        setItems((ts) => ts.filter((t) => t.id !== id));
        toast.success("Task deleted");
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="inline-flex rounded-full border border-border/60 bg-white/50 p-1">
          <button onClick={() => setView("board")} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium", view === "board" ? "bg-charcoal text-cream" : "text-charcoal-text/70")}>
            <LayoutGrid className="h-4 w-4" /> Board
          </button>
          <button onClick={() => setView("list")} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium", view === "list" ? "bg-charcoal text-cream" : "text-charcoal-text/70")}>
            <List className="h-4 w-4" /> List
          </button>
        </div>
        <NewTaskDialog projects={projects} members={members} />
      </div>

      {view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scroll-slim">
          {COLUMNS.map((col) => {
            const colTasks = items.filter((t) => t.status === col.value);
            return (
              <div
                key={col.value}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.value); }}
                onDragLeave={() => setOverCol((c) => (c === col.value ? null : c))}
                onDrop={() => dragId && move(dragId, col.value)}
                className={cn("flex w-[280px] shrink-0 flex-col rounded-2xl border bg-white/45 backdrop-blur-md", overCol === col.value ? "border-lime bg-lime/10" : "border-white/50")}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <h3 className="text-sm font-semibold text-charcoal-text">{col.label}</h3>
                  <span className="rounded-full bg-sand/60 px-2 py-0.5 text-xs font-semibold">{colTasks.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
                  {colTasks.length === 0 && <div className="rounded-xl border border-dashed border-border/70 py-6 text-center text-xs text-muted-foreground">Drop tasks here</div>}
                  {colTasks.map((t) => (
                    <motion.div
                      layout
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn("group cursor-grab rounded-xl border border-white/60 bg-cream/90 p-3 shadow-soft active:cursor-grabbing", dragId === t.id && "opacity-50")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-charcoal-text">{t.name}</p>
                        <GripVertical className="h-4 w-4 shrink-0 text-taupe opacity-0 group-hover:opacity-100" />
                      </div>
                      {t.projectName && <p className="mt-0.5 text-xs text-muted-foreground">{t.projectName}</p>}
                      <div className="mt-2.5 flex items-center justify-between">
                        <StatusBadge map={TASK_PRIORITY} value={t.priority} className="text-[10px]" />
                        <div className="flex items-center gap-2">
                          {t.dueDate && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarClock className="h-3 w-3" />{formatDate(t.dueDate)}</span>}
                          <Avatar className="h-5 w-5">
                            {t.assigneeAvatar && <AvatarImage src={t.assigneeAvatar} alt="" />}
                            <AvatarFallback className="text-[8px]">{initials(t.assigneeName)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card glass className="p-2">
          <ul className="divide-y divide-border/50">
            {items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-charcoal-text">{t.name}</p>
                    {t.isSample && <SampleBadge />}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.projectName ?? "—"} · Due {formatDate(t.dueDate)}</p>
                </div>
                <StatusBadge map={TASK_PRIORITY} value={t.priority} />
                <StatusBadge map={TASK_STATUS} value={t.status} />
                <ConfirmDialog
                  title="Delete task?"
                  onConfirm={() => onDelete(t.id)}
                  trigger={<Button variant="ghost" size="icon-sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function NewTaskDialog({ projects, members }: { projects: { id: string; name: string }[]; members: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const sel = "flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTask(fd);
      if (res.ok) {
        toast.success("Task created");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="lime"><Plus className="h-4 w-4" /> New Task</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Assign work and schedule site activity.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Task Name</Label><Input name="name" required /></div>
          <div className="space-y-1.5"><Label>Project</Label>
            <select name="projectId" className={sel} defaultValue=""><option value="">—</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div className="space-y-1.5"><Label>Assignee</Label>
            <select name="assigneeId" className={sel} defaultValue=""><option value="">—</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          </div>
          <div className="space-y-1.5"><Label>Priority</Label>
            <select name="priority" className={sel} defaultValue="medium">{Object.entries(TASK_PRIORITY).map(([v, o]) => <option key={v} value={v}>{o.label}</option>)}</select>
          </div>
          <div className="space-y-1.5"><Label>Type</Label>
            <select name="kind" className={sel} defaultValue="task">
              <option value="task">Task</option>
              <option value="site_visit">Site Visit</option>
              <option value="meeting">Meeting</option>
              <option value="delivery">Delivery</option>
              <option value="installation">Installation</option>
            </select>
          </div>
          <div className="space-y-1.5"><Label>Start Date</Label><Input name="startDate" type="date" /></div>
          <div className="space-y-1.5"><Label>Due Date</Label><Input name="dueDate" type="date" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea name="description" /></div>
          <DialogFooter className="mt-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="lime" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Create task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
