"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/components/ui/sonner";
import { formatINR } from "@/lib/format";
import {
  ESTIMATION_UNITS,
  ESTIMATION_SPECIFICATIONS,
  ESTIMATION_ROOMS,
  ESTIMATION_DEFAULTS,
} from "@/lib/constants";
import { createQuotation, updateQuotation } from "@/app/(app)/quotations/actions";

type Template = "standard" | "estimation";

type LineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  // Estimation-only.
  section?: string;
  room?: string;
  subCategory?: string;
  specification?: string;
  nos?: number | null;
  length?: number | null;
  width?: number | null;
  manualQty?: boolean;
};

export type QuotationFormInitial = {
  type?: "quotation" | "invoice";
  template?: Template;
  clientId?: string;
  projectId?: string;
  discount?: number;
  additionalCharges?: number;
  gstRate?: number;
  terms?: string;
  notes?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  materialSpecs?: string;
  designTimelines?: string;
  items?: LineItem[];
};

const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** Effective quantity for a line (derived for estimation, entered otherwise). */
function lineQty(it: LineItem, template: Template) {
  if (
    template === "estimation" &&
    !it.manualQty &&
    it.nos != null &&
    it.length != null &&
    it.width != null
  ) {
    return round4(it.nos * it.length * it.width);
  }
  return it.quantity ?? 0;
}

function emptyItem(template: Template): LineItem {
  return template === "estimation"
    ? {
        description: "",
        quantity: 0,
        unit: "rft",
        unitPrice: 0,
        section: "",
        room: "",
        subCategory: "Wardrobe",
        specification: "Ferro Cement",
        nos: 1,
        length: 0,
        width: 0,
      }
    : { description: "", quantity: 1, unit: "unit", unitPrice: 0 };
}

export function QuotationFormDialog({
  clients,
  projects,
  trigger,
  open: controlledOpen,
  onOpenChange,
  initial,
  reviseOfId,
  reviseOfNumber,
  editId,
}: {
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  initial?: QuotationFormInitial;
  reviseOfId?: string;
  reviseOfNumber?: string;
  editId?: string;
}) {
  const controlled = controlledOpen !== undefined;
  const isRevision = !!reviseOfId;
  const isEdit = !!editId;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (o: boolean) => (controlled ? onOpenChange?.(o) : setUncontrolledOpen(o));

  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [type, setType] = useState<"quotation" | "invoice">(initial?.type ?? "quotation");
  const [template, setTemplate] = useState<Template>(initial?.template ?? "standard");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [discount, setDiscount] = useState(initial?.discount ?? 0);
  const [additionalCharges, setAdditionalCharges] = useState(initial?.additionalCharges ?? 0);
  const [gstRate, setGstRate] = useState(initial?.gstRate ?? (initial?.template === "estimation" ? 0 : 18));
  const [terms, setTerms] = useState(initial?.terms ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [bankAccountName, setBankAccountName] = useState(initial?.bankAccountName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(initial?.bankAccountNumber ?? "");
  const [bankIfsc, setBankIfsc] = useState(initial?.bankIfsc ?? "");
  const [materialSpecs, setMaterialSpecs] = useState(initial?.materialSpecs ?? "");
  const [designTimelines, setDesignTimelines] = useState(initial?.designTimelines ?? "");
  const [items, setItems] = useState<LineItem[]>(
    initial?.items?.length ? initial.items : [emptyItem(initial?.template ?? "standard")],
  );

  const isEstimation = template === "estimation";
  const subtotal = round4(
    items.reduce((s, it) => s + lineQty(it, template) * it.unitPrice, 0),
  );
  const taxable = Math.max(0, subtotal - discount) + additionalCharges;
  const gst = Math.round(taxable * (gstRate / 100));
  const total = taxable + gst;

  const sel =
    "flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const docLabel = isEstimation ? "Estimation" : type === "invoice" ? "Invoice" : "Quotation";

  function update(i: number, patch: Partial<LineItem>) {
    setItems((its) => its.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeItem(i: number) {
    setItems((its) => its.filter((_, idx) => idx !== i));
  }
  function duplicateItem(i: number) {
    setItems((its) => [...its.slice(0, i + 1), { ...its[i] }, ...its.slice(i + 1)]);
  }
  function moveItem(i: number, dir: -1 | 1) {
    setItems((its) => {
      const j = i + dir;
      if (j < 0 || j >= its.length) return its;
      const next = [...its];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  /** Switch template; prefill estimation boilerplate the first time. */
  function changeTemplate(next: Template) {
    setTemplate(next);
    if (next === "estimation") {
      if (!materialSpecs) setMaterialSpecs(ESTIMATION_DEFAULTS.materialSpecs);
      if (!designTimelines) setDesignTimelines(ESTIMATION_DEFAULTS.designTimelines);
      if (!bankAccountName) setBankAccountName(ESTIMATION_DEFAULTS.bankAccountName);
      if (!bankAccountNumber) setBankAccountNumber(ESTIMATION_DEFAULTS.bankAccountNumber);
      if (!bankIfsc) setBankIfsc(ESTIMATION_DEFAULTS.bankIfsc);
      if (!isEdit && gstRate === 18) setGstRate(0);
      // Convert the starter row if it's still the untouched standard default.
      setItems((its) =>
        its.length === 1 && !its[0].description && its[0].section === undefined
          ? [emptyItem("estimation")]
          : its,
      );
    }
  }

  function submit() {
    const valid = items.filter((i) => i.description.trim());
    if (!valid.length) {
      toast.error("Add at least one line item");
      return;
    }
    const payload = {
      type: isRevision ? "quotation" : type,
      template,
      clientId,
      projectId,
      discount,
      additionalCharges,
      gstRate,
      terms: terms.trim() || undefined,
      notes: notes.trim() || undefined,
      bankAccountName: isEstimation ? bankAccountName.trim() || undefined : undefined,
      bankAccountNumber: isEstimation ? bankAccountNumber.trim() || undefined : undefined,
      bankIfsc: isEstimation ? bankIfsc.trim() || undefined : undefined,
      materialSpecs: isEstimation ? materialSpecs.trim() || undefined : undefined,
      designTimelines: isEstimation ? designTimelines.trim() || undefined : undefined,
      items: valid,
      ...(isRevision ? { revisionOf: reviseOfId } : {}),
    };
    startTransition(async () => {
      const res = isEdit
        ? await updateQuotation(editId!, payload)
        : await createQuotation(payload);
      if (res.ok) {
        toast.success(
          isEdit ? `${docLabel} updated` : isRevision ? "Revision created" : `${docLabel} created`,
        );
        setOpen(false);
        if (isEdit) router.refresh();
        else if (res.id)
          router.push(isRevision ? `/quotations/${res.id}/compare` : `/quotations/${res.id}`);
      } else toast.error(res.error ?? "Failed");
    });
  }

  const title = isEdit
    ? `Edit ${docLabel}`
    : isRevision
      ? "Revise Quotation"
      : "New Quotation / Invoice";
  const description = isEstimation
    ? "Detailed estimation — quantity is calculated as NOS × Length × Width for each line."
    : isEdit
      ? "Update the line items and details — GST and totals recalculate automatically."
      : isRevision
        ? `Creates a new revision of ${reviseOfNumber ?? "the quotation"}. Adjust the line items — the original stays unchanged so you can compare them.`
        : "Add line items — GST and totals calculate automatically.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined && !controlled && (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      )}
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Format</Label>
            <select
              className={sel}
              value={template}
              onChange={(e) => changeTemplate(e.target.value as Template)}
            >
              <option value="standard">Tax Invoice</option>
              <option value="estimation">Estimation</option>
            </select>
          </div>
          {!isRevision && !isEstimation && (
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select className={sel} value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="quotation">Quotation</option>
                <option value="invoice">Invoice</option>
              </select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Client</Label>
            <select className={sel} value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            <select className={sel} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line items */}
        {isEstimation ? (
          <div className="mt-2 max-h-[46vh] space-y-3 overflow-y-auto pr-1">
            {items.map((it, i) => {
              const qty = lineQty(it, template);
              return (
                <div key={i} className="rounded-xl border border-border/60 bg-white/50 p-3">
                  <div className="grid grid-cols-12 gap-2">
                    <Field className="col-span-4" label="Section">
                      <Input list="est-sections" placeholder="3BHK" value={it.section ?? ""} onChange={(e) => update(i, { section: e.target.value })} />
                    </Field>
                    <Field className="col-span-4" label="Room / Area">
                      <Input list="est-rooms" placeholder="Master Bedroom" value={it.room ?? ""} onChange={(e) => update(i, { room: e.target.value })} />
                    </Field>
                    <Field className="col-span-4" label="Sub Category">
                      <Input placeholder="Wardrobe" value={it.subCategory ?? ""} onChange={(e) => update(i, { subCategory: e.target.value })} />
                    </Field>
                    <Field className="col-span-7" label="Description (element)">
                      <Input placeholder="Dividers / Skirting / Base…" value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
                    </Field>
                    <Field className="col-span-5" label="Specification">
                      <Input list="est-specs" placeholder="Ferro Cement" value={it.specification ?? ""} onChange={(e) => update(i, { specification: e.target.value })} />
                    </Field>
                    <Field className="col-span-2" label="NOS">
                      <Input type="number" value={it.nos ?? 0} onChange={(e) => update(i, { nos: Number(e.target.value) })} />
                    </Field>
                    <Field className="col-span-2" label="Length (ft)">
                      <Input type="number" value={it.length ?? 0} onChange={(e) => update(i, { length: Number(e.target.value) })} />
                    </Field>
                    <Field className="col-span-2" label="Width (ft)">
                      <Input type="number" value={it.width ?? 0} onChange={(e) => update(i, { width: Number(e.target.value) })} />
                    </Field>
                    <Field className="col-span-2" label="Unit">
                      <select className={sel} value={it.unit} onChange={(e) => update(i, { unit: e.target.value })}>
                        {ESTIMATION_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </Field>
                    <Field className="col-span-2" label={it.manualQty ? "Qty (manual)" : "Qty (auto)"}>
                      <Input
                        type="number"
                        value={round4(qty)}
                        onChange={(e) => update(i, { quantity: Number(e.target.value), manualQty: true })}
                        className={it.manualQty ? "border-lime" : ""}
                      />
                    </Field>
                    <Field className="col-span-2" label="Rate (₹)">
                      <Input type="number" value={it.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} />
                    </Field>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                      Line {i + 1}
                      {it.manualQty && (
                        <button onClick={() => update(i, { manualQty: false })} className="rounded bg-sand/60 px-1.5 py-0.5 text-[10px] hover:bg-sand">
                          ↺ Auto-calc
                        </button>
                      )}
                      <span className="text-charcoal-text">Amount {formatINR(qty * it.unitPrice)}</span>
                    </span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <button title="Move up" onClick={() => moveItem(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-sand/50 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                      <button title="Move down" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="rounded p-1 hover:bg-sand/50 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                      <button title="Duplicate" onClick={() => duplicateItem(i)} className="rounded p-1 hover:bg-sand/50"><Copy className="h-3.5 w-3.5" /></button>
                      <button title="Remove" onClick={() => removeItem(i)} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setItems((its) => [...its, emptyItem("estimation")])}>
              <Plus className="h-4 w-4" /> Add line
            </Button>

            <datalist id="est-rooms">
              {ESTIMATION_ROOMS.map((r) => <option key={r} value={r} />)}
            </datalist>
            <datalist id="est-specs">
              {ESTIMATION_SPECIFICATIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
            <datalist id="est-sections">
              <option value="3BHK" />
              <option value="2BHK" />
              <option value="1BHK" />
            </datalist>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-semibold uppercase text-muted-foreground sm:grid">
              <span className="col-span-6">Description</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-2">Rate (₹)</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <Input className="col-span-12 sm:col-span-6" placeholder="Service or material" value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
                <Input className="col-span-4 sm:col-span-2" type="number" value={it.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                <Input className="col-span-5 sm:col-span-2" type="number" value={it.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} />
                <div className="col-span-3 flex items-center justify-end gap-1 sm:col-span-2">
                  <span className="text-sm font-medium text-charcoal-text">{formatINR(it.quantity * it.unitPrice)}</span>
                  <button onClick={() => setItems((its) => its.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setItems((its) => [...its, emptyItem("standard")])}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>
        )}

        {/* Totals */}
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Discount (₹)</Label><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Add. Charges (₹)</Label><Input type="number" value={additionalCharges} onChange={(e) => setAdditionalCharges(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>GST Rate (%)</Label><Input type="number" value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))} /></div>
          </div>
          <div className="space-y-1 rounded-xl bg-white/60 p-3 text-sm">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`- ${formatINR(discount)}`} />}
            {additionalCharges > 0 && <Row label="Additional Charges" value={formatINR(additionalCharges)} />}
            {gstRate > 0 && <Row label={`GST (${gstRate}%)`} value={formatINR(gst)} />}
            <div className="my-1 h-px bg-border" />
            <Row label="Total" value={formatINR(total)} bold />
          </div>
        </div>

        {/* Estimation boilerplate */}
        {isEstimation && (
          <div className="mt-2 space-y-4 rounded-xl border border-border/60 bg-cream/40 p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Account Name</Label><Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Account Number</Label><Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>IFSC</Label><Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Material Specifications (one per line)</Label>
              <Textarea value={materialSpecs} onChange={(e) => setMaterialSpecs(e.target.value)} className="min-h-[120px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Design Timelines (one per line)</Label>
              <Textarea value={designTimelines} onChange={(e) => setDesignTimelines(e.target.value)} className="min-h-[90px]" />
            </div>
          </div>
        )}

        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Terms &amp; Conditions</Label>
            <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, validity, delivery timeline…" className="min-h-[70px]" />
          </div>
          <div className="space-y-1.5"><Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal or client-facing notes…" className="min-h-[70px]" />
          </div>
        </div>

        <DialogFooter className="mt-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="lime" onClick={submit} disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{isEdit ? "Save changes" : isRevision ? "Create revision" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-display text-base font-bold text-charcoal-text" : "font-medium text-charcoal-text"}>{value}</span>
    </div>
  );
}
