"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ShoppingCart, ChevronRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/sonner";
import { PROCUREMENT_STAGES, PROCUREMENT_STAGE_LABELS, PAYMENT_STATUS } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/format";
import {
  createPurchaseOrder,
  updatePOStage,
  updatePOPayment,
} from "@/app/(app)/procurement/actions";
import type { PurchaseOrder } from "@/db/schema";

type Row = PurchaseOrder & { projectName: string | null; vendorName: string | null };

const STAGE_PROGRESS: Record<string, number> = Object.fromEntries(
  PROCUREMENT_STAGES.map((s, i) => [s.value, Math.round(((i + 1) / PROCUREMENT_STAGES.length) * 100)]),
);

export function ProcurementClient({
  orders,
  projects,
  vendors,
}: {
  orders: Row[];
  projects: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function changeStage(id: string, stage: string) {
    startTransition(async () => {
      const res = await updatePOStage(id, stage);
      if (res.ok) toast.success(`Moved to ${PROCUREMENT_STAGE_LABELS[stage]}`);
      else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }
  function changePayment(id: string, p: string) {
    startTransition(async () => {
      await updatePOPayment(id, p);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <NewPODialog projects={projects} vendors={vendors} />
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No purchase orders" description="Create a purchase request to kick off procurement." />
      ) : (
        <div className="space-y-3">
          {orders.map((po) => (
            <Card key={po.id} glass className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{po.poNumber}</span>
                    {po.isSample && <SampleBadge />}
                  </div>
                  <p className="font-display font-semibold text-charcoal-text">{po.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {po.projectName ?? "—"} · <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" />{po.vendorName ?? "No vendor"}</span>
                    {po.expectedDelivery ? ` · ETA ${formatDate(po.expectedDelivery)}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-charcoal-text">{formatINR(po.amount)}</p>
                    <button onClick={() => {
                      const next = po.paymentStatus === "unpaid" ? "partial" : po.paymentStatus === "partial" ? "paid" : "unpaid";
                      changePayment(po.id, next);
                    }}>
                      <StatusBadge map={PAYMENT_STATUS} value={po.paymentStatus} />
                    </button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" disabled={pending}>
                        {PROCUREMENT_STAGE_LABELS[po.stage]}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto scroll-slim">
                      <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {PROCUREMENT_STAGES.map((s) => (
                        <DropdownMenuItem key={s.value} onClick={() => changeStage(po.id, s.value)}>
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Stage progress */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sand/50">
                <div className="h-full rounded-full bg-lime transition-all" style={{ width: `${STAGE_PROGRESS[po.stage]}%` }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function NewPODialog({
  projects,
  vendors,
}: {
  projects: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const sel = "flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createPurchaseOrder(fd);
      if (res.ok) {
        toast.success("Purchase request created");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="lime"><Plus className="h-4 w-4" /> New Purchase Request</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>New Purchase Request</DialogTitle>
          <DialogDescription>Start a procurement item and track it through to delivery.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Title</Label><Input name="title" required placeholder="e.g. Italian marble — living room" /></div>
          <div className="space-y-1.5"><Label>Project</Label>
            <select name="projectId" className={sel} defaultValue=""><option value="">—</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div className="space-y-1.5"><Label>Vendor</Label>
            <select name="vendorId" className={sel} defaultValue=""><option value="">—</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          </div>
          <div className="space-y-1.5"><Label>Quantity</Label><Input name="quantity" type="number" defaultValue={1} /></div>
          <div className="space-y-1.5"><Label>Unit</Label><Input name="unit" placeholder="sq ft / unit" /></div>
          <div className="space-y-1.5"><Label>Amount (₹)</Label><Input name="amount" type="number" /></div>
          <div className="space-y-1.5"><Label>Expected Delivery</Label><Input name="expectedDelivery" type="date" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea name="description" /></div>
          <DialogFooter className="mt-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="lime" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
