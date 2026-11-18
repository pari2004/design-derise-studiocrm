"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Loader2,
  Truck,
  Phone,
  Mail,
  MapPin,
  Star,
  MoreHorizontal,
  Trash2,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { createVendor, deleteVendor } from "@/app/(app)/vendors/actions";
import type { Vendor } from "@/db/schema";

type Row = Vendor & { orderCount: number; totalSpend: number };

export function VendorsClient({ vendors }: { vendors: Row[] }) {
  const [q, setQ] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(
    () =>
      vendors.filter((v) =>
        `${v.name} ${v.company ?? ""} ${v.categories ?? ""}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [vendors, q],
  );

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteVendor(id);
      if (res.ok) toast.success("Vendor removed");
      else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors…" className="pl-9" />
        </div>
        <AddVendorDialog />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Truck} title="No vendors" description="Add suppliers to manage procurement and orders." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <Card key={v.id} glass className="glass-hover p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal text-cream">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-display font-semibold text-charcoal-text">{v.name}</p>
                      {v.isSample && <SampleBadge />}
                    </div>
                    <p className="text-xs text-muted-foreground">{v.company ?? ""}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ConfirmDialog
                      title="Remove vendor?"
                      description={`"${v.name}" will be removed.`}
                      onConfirm={() => onDelete(v.id)}
                      trigger={<DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(v.rating ?? 0) ? "fill-lime text-lime" : "text-sand"}`} />
                ))}
                <span className="ml-1 text-xs font-medium text-charcoal-text">{(v.rating ?? 0).toFixed(1)}</span>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {v.contactPerson && <p>{v.contactPerson}</p>}
                {v.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{v.phone}</p>}
                {v.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{v.email}</p>}
                {v.address && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{v.address}</p>}
              </div>

              {v.categories && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {v.categories.split(",").slice(0, 3).map((c) => (
                    <Badge key={c} variant="secondary" className="text-[10px]">{c.trim()}</Badge>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Package className="h-3.5 w-3.5" />{v.orderCount} orders</span>
                {v.gstin && <span className="font-mono text-[10px] text-muted-foreground">{v.gstin}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function AddVendorDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createVendor(fd);
      if (res.ok) {
        toast.success("Vendor added");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="lime"><Plus className="h-4 w-4" /> Add Vendor</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add Vendor</DialogTitle>
          <DialogDescription>Register a supplier for procurement.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor Name" full><Input name="name" required /></Field>
          <Field label="Company"><Input name="company" /></Field>
          <Field label="Contact Person"><Input name="contactPerson" /></Field>
          <Field label="Phone"><Input name="phone" /></Field>
          <Field label="Email"><Input name="email" type="email" /></Field>
          <Field label="GSTIN"><Input name="gstin" /></Field>
          <Field label="Rating (0-5)"><Input name="rating" type="number" min={0} max={5} step={0.1} /></Field>
          <Field label="Address" full><Input name="address" /></Field>
          <Field label="Categories (comma separated)" full><Input name="categories" placeholder="Marble & Granite, Tiles" /></Field>
          <Field label="Payment Terms" full><Input name="paymentTerms" placeholder="Net 30" /></Field>
          <DialogFooter className="mt-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="lime" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Add vendor</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
