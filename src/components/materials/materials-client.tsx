"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Plus, Loader2, Package, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { AVAILABILITY, MATERIAL_CATEGORIES } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { createMaterial, deleteMaterial } from "@/app/(app)/materials/actions";
import type { Material } from "@/db/schema";

type Row = Material & { vendorName: string | null };

export function MaterialsClient({
  materials,
  vendors,
}: {
  materials: Row[];
  vendors: { id: string; name: string }[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(
    () =>
      materials.filter((m) => {
        const mc = cat === "all" || m.category === cat;
        const hay = `${m.name} ${m.brand ?? ""} ${m.category} ${m.color ?? ""}`.toLowerCase();
        return mc && hay.includes(q.toLowerCase());
      }),
    [materials, q, cat],
  );

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteMaterial(id);
      if (res.ok) toast.success("Material removed");
      else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search materials…" className="pl-9" />
        </div>
        <AddMaterialDialog vendors={vendors} />
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
        {MATERIAL_CATEGORIES.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No materials found" description="Adjust filters or add a new material to your library." />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <Card key={m.id} glass className="glass-hover group overflow-hidden p-0">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand/40">
                {m.imageUrl && <Image src={m.imageUrl} alt={m.name} fill sizes="300px" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                <div className="absolute left-2 top-2 flex items-center gap-1">
                  <StatusBadge map={AVAILABILITY} value={m.availability} />
                  {m.isSample && <SampleBadge />}
                </div>
                <ConfirmDialog
                  title="Remove material?"
                  description={`"${m.name}" will be removed from the library.`}
                  onConfirm={() => onDelete(m.id)}
                  trigger={
                    <button className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  }
                />
              </div>
              <div className="p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-taupe">{m.category}</p>
                <p className="line-clamp-1 text-sm font-semibold text-charcoal-text">{m.name}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{m.brand ?? ""} {m.color ? `· ${m.color}` : ""}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-charcoal-text">{formatINR(m.sellingPrice)}</span>
                  <span className="text-[11px] text-muted-foreground">/ {m.unit}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-transparent bg-lime text-charcoal shadow-lime" : "border-border/60 bg-white/50 text-charcoal-text/70 hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}

function AddMaterialDialog({ vendors }: { vendors: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createMaterial(fd);
      if (res.ok) {
        toast.success("Material added");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });
  }

  const sel = "flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="lime"><Plus className="h-4 w-4" /> Add Material</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
          <DialogDescription>Add an item to your materials library.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name</Label>
            <Input name="name" required placeholder="e.g. Statuario Italian Marble" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select name="category" className={sel} required defaultValue="">
              <option value="" disabled>Select…</option>
              {MATERIAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Brand</Label>
            <Input name="brand" />
          </div>
          <div className="space-y-1.5">
            <Label>Vendor</Label>
            <select name="vendorId" className={sel} defaultValue="">
              <option value="">—</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>SKU</Label>
            <Input name="sku" />
          </div>
          <div className="space-y-1.5">
            <Label>Cost Price (₹)</Label>
            <Input name="costPrice" type="number" />
          </div>
          <div className="space-y-1.5">
            <Label>Selling Price (₹)</Label>
            <Input name="sellingPrice" type="number" />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Input name="unit" placeholder="sq ft / unit / meter" />
          </div>
          <div className="space-y-1.5">
            <Label>Availability</Label>
            <select name="availability" className={sel} defaultValue="in_stock">
              {Object.entries(AVAILABILITY).map(([v, o]) => <option key={v} value={v}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Input name="color" />
          </div>
          <div className="space-y-1.5">
            <Label>Finish</Label>
            <Input name="finish" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Image URL (optional)</Label>
            <Input name="imageUrl" placeholder="https://…" />
          </div>
          <DialogFooter className="mt-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="lime" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}Add material
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
