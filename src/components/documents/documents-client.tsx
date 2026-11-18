"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Loader2,
  FileText,
  FileImage,
  File,
  Download,
  Trash2,
  FolderArchive,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { createDocument, deleteDocument } from "@/app/(app)/documents/actions";
import type { Document } from "@/db/schema";

type Row = Document & { projectName: string | null };

function fileIcon(type: string | null) {
  if (type === "image") return FileImage;
  if (type === "pdf") return FileText;
  return File;
}
function human(bytes: number | null) {
  if (!bytes) return "";
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function DocumentsClient({
  documents,
  projects,
}: {
  documents: Row[];
  projects: { id: string; name: string }[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(
    () =>
      documents.filter((d) => {
        const mc = cat === "all" || d.category === cat;
        return mc && `${d.name} ${d.category ?? ""} ${d.projectName ?? ""}`.toLowerCase().includes(q.toLowerCase());
      }),
    [documents, q, cat],
  );

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteDocument(id);
      toast.success("Document removed");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className="pl-9" />
        </div>
        <AddDocDialog projects={projects} />
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
        {DOCUMENT_CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderArchive} title="No documents" description="Upload agreements, plans, renders and invoices here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const Icon = fileIcon(d.fileType);
            return (
              <Card key={d.id} glass className="group flex items-start gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand/50"><Icon className="h-5 w-5 text-taupe" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="line-clamp-1 text-sm font-medium text-charcoal-text">{d.name}</p>
                    {d.isSample && <SampleBadge />}
                  </div>
                  <p className="text-xs text-muted-foreground">{d.projectName ?? "—"} · v{d.version} · {human(d.fileSize)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">{d.category ?? "Other"}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatDate(d.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {d.fileUrl && d.fileUrl !== "#" && (
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-charcoal-text"><Download className="h-4 w-4" /></a>
                  )}
                  <ConfirmDialog title="Remove document?" onConfirm={() => onDelete(d.id)} trigger={<button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", active ? "border-transparent bg-lime text-charcoal shadow-lime" : "border-border/60 bg-white/50 text-charcoal-text/70 hover:bg-white")}>{children}</button>
  );
}

function AddDocDialog({ projects }: { projects: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const sel = "flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createDocument(fd);
      if (res.ok) { toast.success("Document added"); setOpen(false); router.refresh(); }
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="lime"><Plus className="h-4 w-4" /> Add Document</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
          <DialogDescription>Register a document and link it to a project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Document Name</Label><Input name="name" required placeholder="Signed Agreement.pdf" /></div>
          <div className="space-y-1.5"><Label>Category</Label>
            <select name="category" className={sel} defaultValue="">
              <option value="">Select…</option>{DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label>Project</Label>
            <select name="projectId" className={sel} defaultValue=""><option value="">—</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div className="space-y-1.5"><Label>File URL (optional)</Label><Input name="fileUrl" placeholder="https://…" /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="lime" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
