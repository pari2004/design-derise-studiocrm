"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, Send, CheckCircle2, Loader2, IndianRupee, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import {
  updateQuotationStatus,
  recordPayment,
  deleteQuotation,
} from "@/app/(app)/quotations/actions";
import {
  QuotationFormDialog,
  type QuotationFormInitial,
} from "./quotation-form-dialog";

export function QuotationActions({
  id,
  type,
  status,
  due,
  clients,
  projects,
  editInitial,
}: {
  id: string;
  type: string;
  status: string;
  due: number;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  editInitial: QuotationFormInitial;
}) {
  const [pending, startTransition] = useTransition();
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [amount, setAmount] = useState(due);
  const router = useRouter();
  const docLabel = type === "invoice" ? "Invoice" : "Quotation";

  function setStatus(s: string) {
    startTransition(async () => {
      await updateQuotationStatus(id, s);
      toast.success("Status updated");
      router.refresh();
    });
  }
  function pay() {
    startTransition(async () => {
      const res = await recordPayment(id, amount);
      if (res.ok) { toast.success("Payment recorded"); setPayOpen(false); router.refresh(); }
      else toast.error(res.error ?? "Failed");
    });
  }
  function onDelete() {
    startTransition(async () => {
      const res = await deleteQuotation(id);
      if (res.ok) { toast.success(`${docLabel} deleted`); router.push("/quotations"); }
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Download PDF
      </Button>

      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit
      </Button>

      {status === "draft" && (
        <Button variant="default" onClick={() => setStatus("sent")} disabled={pending}>
          <Send className="h-4 w-4" /> Mark Sent
        </Button>
      )}
      {type === "quotation" && status !== "accepted" && (
        <Button variant="lime" onClick={() => setStatus("accepted")} disabled={pending}>
          <CheckCircle2 className="h-4 w-4" /> Mark Accepted
        </Button>
      )}
      {type === "invoice" && status !== "paid" && (
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogTrigger asChild>
            <Button variant="lime"><IndianRupee className="h-4 w-4" /> Record Payment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Amount received (₹)</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Outstanding: ₹{due.toLocaleString("en-IN")}</p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPayOpen(false)}>Cancel</Button>
              <Button variant="lime" onClick={pay} disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        title={`Delete this ${docLabel.toLowerCase()}?`}
        description="This permanently removes the document and its line items. This cannot be undone."
        onConfirm={onDelete}
        trigger={
          <Button variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        }
      />

      <QuotationFormDialog
        clients={clients}
        projects={projects}
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editInitial}
        editId={id}
      />
    </div>
  );
}
