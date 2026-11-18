"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { PROJECT_STAGES, PROJECT_STATUS, PROPERTY_TYPES } from "@/lib/constants";
import { IMG } from "@/db/images";
import { createProject, updateProject } from "@/app/(app)/projects/actions";
import type { Project } from "@/db/schema";

const COVERS = [
  IMG.villa, IMG.livingModern, IMG.livingWarm, IMG.penthouse,
  IMG.bedroom1, IMG.kitchen1, IMG.diningRoom, IMG.livingLuxury,
];

export function ProjectFormDialog({
  clients,
  managers,
  project,
  trigger,
  defaultOpen,
}: {
  clients: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  project?: Project;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [cover, setCover] = useState(project?.coverImage ?? COVERS[0]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const editing = !!project;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("coverImage", cover);
    startTransition(async () => {
      const res = editing ? await updateProject(project!.id, fd) : await createProject(fd);
      if (res.ok) {
        toast.success(editing ? "Project updated" : "Project created");
        setOpen(false);
        router.refresh();
        if (!editing && res.id) router.push(`/projects/${res.id}`);
      } else toast.error(res.error ?? "Something went wrong");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="default">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle>
          <DialogDescription>Set up the project workspace and brief.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-2 block">Cover Image</Label>
            <div className="flex gap-2 overflow-x-auto pb-2 scroll-slim">
              {COVERS.map((src) => (
                <button
                  type="button"
                  key={src}
                  onClick={() => setCover(src)}
                  className={cn(
                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition",
                    cover === src ? "ring-lime" : "ring-transparent hover:ring-border",
                  )}
                >
                  <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          <F label="Project Name" full>
            <Input name="name" defaultValue={project?.name} required placeholder="The Cooper Residence" />
          </F>
          <F label="Client">
            <select name="clientId" defaultValue={project?.clientId ?? ""} className={selectCls}>
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </F>
          <F label="Project Manager">
            <select name="projectManagerId" defaultValue={project?.projectManagerId ?? ""} className={selectCls}>
              <option value="">Select manager…</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </F>
          <F label="Project Type">
            <select name="projectType" defaultValue={project?.projectType ?? ""} className={selectCls}>
              <option value="">Select…</option>
              {PROPERTY_TYPES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </F>
          <F label="Location">
            <Input name="location" defaultValue={project?.location ?? ""} placeholder="City" />
          </F>
          <F label="Property Address" full>
            <Input name="propertyAddress" defaultValue={project?.propertyAddress ?? ""} />
          </F>
          <F label="Property Area (sq ft)">
            <Input name="propertyArea" type="number" defaultValue={project?.propertyArea ?? ""} />
          </F>
          <F label="Completion (%)">
            <Input name="completion" type="number" min={0} max={100} defaultValue={project?.completion ?? 0} />
          </F>
          <F label="Budget (₹)">
            <Input name="budget" type="number" defaultValue={project?.budget ?? ""} />
          </F>
          <F label="Contract Value (₹)">
            <Input name="contractValue" type="number" defaultValue={project?.contractValue ?? ""} />
          </F>
          <F label="Pipeline Stage">
            <select name="stage" defaultValue={project?.stage ?? "initial_enquiry"} className={selectCls}>
              {PROJECT_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </F>
          <F label="Status">
            <select name="status" defaultValue={project?.status ?? "in_progress"} className={selectCls}>
              {Object.entries(PROJECT_STATUS).map(([v, o]) => <option key={v} value={v}>{o.label}</option>)}
            </select>
          </F>
          <F label="Start Date">
            <Input name="startDate" type="date" defaultValue={toDate(project?.startDate)} />
          </F>
          <F label="Expected Completion">
            <Input name="expectedCompletion" type="date" defaultValue={toDate(project?.expectedCompletion)} />
          </F>
          <F label="Next Deadline">
            <Input name="nextDeadline" type="date" defaultValue={toDate(project?.nextDeadline)} />
          </F>
          <F label="Description" full>
            <Textarea name="description" defaultValue={project?.description ?? ""} placeholder="Project brief and scope…" />
          </F>

          <DialogFooter className="mt-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="lime" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const selectCls =
  "flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm text-charcoal-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function F({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function toDate(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
