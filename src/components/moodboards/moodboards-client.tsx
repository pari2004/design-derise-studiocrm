"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Loader2,
  Images,
  Check,
  RefreshCw,
  X,
  Share2,
  Trash2,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { MOODBOARD_STATUS } from "@/lib/constants";
import {
  createMoodboard,
  setMoodboardStatus,
  deleteMoodboard,
} from "@/app/(app)/moodboards/actions";
import type { Moodboard, MoodboardItem } from "@/db/schema";

type Board = Moodboard & { projectName: string | null; items: MoodboardItem[] };

export function MoodboardsClient({
  boards,
  projects,
}: {
  boards: Board[];
  projects: { id: string; name: string }[];
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const res = await setMoodboardStatus(id, status);
      if (res.ok) toast.success(`Marked ${MOODBOARD_STATUS[status].label}`);
      else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }
  function onDelete(id: string) {
    startTransition(async () => {
      await deleteMoodboard(id);
      toast.success("Moodboard deleted");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <NewMoodboardDialog projects={projects} />
      </div>

      {boards.length === 0 ? (
        <EmptyState icon={Images} title="No moodboards yet" description="Create a moodboard to capture design direction and share with clients." />
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {boards.map((b) => (
            <Card key={b.id} glass className="group break-inside-avoid overflow-hidden p-0">
              {/* Image mosaic */}
              <div className="grid grid-cols-3 gap-0.5">
                {(b.items.length ? b.items : []).slice(0, 6).map((it, i) => (
                  <div key={it.id} className={`relative ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                    <Image src={it.imageUrl} alt={it.label ?? ""} fill sizes="300px" className="object-cover" />
                  </div>
                ))}
                {b.items.length === 0 && b.coverImage && (
                  <div className="relative col-span-3 aspect-video">
                    <Image src={b.coverImage} alt={b.title} fill sizes="400px" className="object-cover" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-display font-semibold text-charcoal-text">{b.title}</p>
                      {b.isSample && <SampleBadge />}
                    </div>
                    <p className="text-xs text-muted-foreground">{b.projectName ?? "Unassigned"} · {b.room ?? ""}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatus(b.id, "shared")}><Share2 className="h-4 w-4" /> Share with client</DropdownMenuItem>
                      <ConfirmDialog title="Delete moodboard?" onConfirm={() => onDelete(b.id)} trigger={<DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {b.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{b.description}</p>}

                {/* Color palette */}
                {b.items.some((i) => i.colorHex) && (
                  <div className="mt-3 flex gap-1">
                    {b.items.filter((i) => i.colorHex).slice(0, 6).map((i) => (
                      <span key={i.id} className="h-5 w-5 rounded-full ring-1 ring-black/5" style={{ background: i.colorHex! }} />
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge map={MOODBOARD_STATUS} value={b.approvalStatus} />
                </div>

                {/* Approval actions */}
                <div className="mt-3 flex gap-1.5">
                  <Button variant="lime" size="sm" className="flex-1" onClick={() => setStatus(b.id, "approved")}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setStatus(b.id, "changes_requested")}>
                    <RefreshCw className="h-3.5 w-3.5" /> Changes
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setStatus(b.id, "rejected")}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function NewMoodboardDialog({ projects }: { projects: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const sel = "flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createMoodboard(fd);
      if (res.ok) {
        toast.success("Moodboard created");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="lime"><Plus className="h-4 w-4" /> New Moodboard</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Moodboard</DialogTitle>
          <DialogDescription>Start a concept board for a room or project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Title</Label><Input name="title" required placeholder="e.g. Living Room Concept" /></div>
          <div className="space-y-1.5"><Label>Project</Label>
            <select name="projectId" className={sel} defaultValue=""><option value="">—</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div className="space-y-1.5"><Label>Room</Label><Input name="room" placeholder="Master Bedroom" /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea name="description" /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="lime" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
