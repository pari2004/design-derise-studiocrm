"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { uploadAttachment } from "@/app/(app)/documents/actions";

export function ClientAttachmentDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const sel =
    "flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("clientId", clientId);
    startTransition(async () => {
      const res = await uploadAttachment(fd);
      if (res.ok) {
        toast.success("Attachment uploaded");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Upload failed");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="lime" size="sm">
          <Upload className="h-4 w-4" /> Upload attachment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload attachment</DialogTitle>
          <DialogDescription>
            Attach a file to this client. Max 10 MB — images, PDFs and documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input name="file" type="file" required className="file:mr-3 file:rounded-md file:border-0 file:bg-sand/60 file:px-3 file:py-1 file:text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label>Display name (optional)</Label>
            <Input name="name" placeholder="Defaults to the file name" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select name="category" className={sel} defaultValue="">
              <option value="">Select…</option>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="lime" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
