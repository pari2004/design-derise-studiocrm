"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  PROPERTY_TYPES,
  DESIGN_STYLES,
  SERVICES,
  LEAD_SOURCES,
  LEAD_STATUS_OPTIONS,
} from "@/lib/constants";
import { createLead, updateLead } from "@/app/(app)/leads/actions";
import type { Lead } from "@/db/schema";

type Designer = { id: string; name: string };

export function LeadFormDialog({
  designers,
  lead,
  trigger,
  defaultOpen,
}: {
  designers: Designer[];
  lead?: Lead;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const editing = !!lead;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editing
        ? await updateLead(lead!.id, fd)
        : await createLead(fd);
      if (res.ok) {
        toast.success(editing ? "Lead updated" : "Lead added");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="lime">
            <Plus className="h-4 w-4" /> New Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Lead" : "New Lead / Enquiry"}</DialogTitle>
          <DialogDescription>
            Capture enquiry details and assign a designer to follow up.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" className="sm:col-span-2">
            <Input name="fullName" defaultValue={lead?.fullName} required placeholder="e.g. Sanjay Gupta" />
          </Field>
          <Field label="Phone">
            <Input name="phone" defaultValue={lead?.phone ?? ""} placeholder="+91 ..." />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={lead?.email ?? ""} placeholder="name@email.com" />
          </Field>
          <Field label="Project Location" className="sm:col-span-2">
            <Input name="location" defaultValue={lead?.location ?? ""} placeholder="Area, City" />
          </Field>
          <Field label="Property Type">
            <NativeSelect name="propertyType" defaultValue={lead?.propertyType ?? ""} options={PROPERTY_TYPES} />
          </Field>
          <Field label="Property Size (sq ft)">
            <Input name="propertySize" type="number" defaultValue={lead?.propertySize ?? ""} placeholder="1800" />
          </Field>
          <Field label="Estimated Budget (₹)">
            <Input name="estimatedBudget" type="number" defaultValue={lead?.estimatedBudget ?? ""} placeholder="3200000" />
          </Field>
          <Field label="Preferred Style">
            <NativeSelect name="designStyle" defaultValue={lead?.designStyle ?? ""} options={DESIGN_STYLES} />
          </Field>
          <Field label="Service Required">
            <NativeSelect name="serviceRequired" defaultValue={lead?.serviceRequired ?? ""} options={SERVICES} />
          </Field>
          <Field label="Lead Source">
            <NativeSelect name="source" defaultValue={lead?.source ?? ""} options={LEAD_SOURCES} />
          </Field>
          <Field label="Assigned Designer">
            <Select name="assignedDesignerId" defaultValue={lead?.assignedDesignerId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select designer" />
              </SelectTrigger>
              <SelectContent>
                {designers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={lead?.status ?? "new"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Enquiry Date">
            <Input name="enquiryDate" type="date" defaultValue={toDateInput(lead?.enquiryDate)} />
          </Field>
          <Field label="Follow-up Date">
            <Input name="followUpDate" type="date" defaultValue={toDateInput(lead?.followUpDate)} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea name="notes" defaultValue={lead?.notes ?? ""} placeholder="Context, preferences, next steps…" />
          </Field>

          <DialogFooter className="sm:col-span-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="lime" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function NativeSelect({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue?: string;
  options: string[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm text-charcoal-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function toDateInput(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
