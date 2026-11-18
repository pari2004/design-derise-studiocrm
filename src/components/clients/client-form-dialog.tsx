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
import { toast } from "@/components/ui/sonner";
import { PROPERTY_TYPES, CLIENT_STATUS } from "@/lib/constants";
import { createClient, updateClient } from "@/app/(app)/clients/actions";
import type { Client } from "@/db/schema";

export function ClientFormDialog({
  client,
  trigger,
}: {
  client?: Client;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const editing = !!client;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editing ? await updateClient(client!.id, fd) : await createClient(fd);
      if (res.ok) {
        toast.success(editing ? "Client updated" : "Client added");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Something went wrong");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="lime">
            <Plus className="h-4 w-4" /> New Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Client" : "New Client"}</DialogTitle>
          <DialogDescription>Maintain a complete client profile.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <F label="Client Name" full>
            <Input name="name" defaultValue={client?.name} required />
          </F>
          <F label="Email">
            <Input name="email" type="email" defaultValue={client?.email ?? ""} />
          </F>
          <F label="Phone">
            <Input name="phone" defaultValue={client?.phone ?? ""} />
          </F>
          <F label="Company (optional)">
            <Input name="company" defaultValue={client?.company ?? ""} />
          </F>
          <F label="City">
            <Input name="city" defaultValue={client?.city ?? ""} />
          </F>
          <F label="Address" full>
            <Input name="address" defaultValue={client?.address ?? ""} />
          </F>
          <F label="Property Type">
            <select
              name="propertyType"
              defaultValue={client?.propertyType ?? ""}
              className="flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select…</option>
              {PROPERTY_TYPES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </F>
          <F label="Budget Preference (₹)">
            <Input name="budgetPreference" type="number" defaultValue={client?.budgetPreference ?? ""} />
          </F>
          <F label="Status">
            <select
              name="status"
              defaultValue={client?.status ?? "active"}
              className="flex h-10 w-full rounded-xl border border-input bg-white/70 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Object.entries(CLIENT_STATUS).map(([v, o]) => (
                <option key={v} value={v}>
                  {o.label}
                </option>
              ))}
            </select>
          </F>
          <F label="Property Details" full>
            <Input name="propertyDetails" defaultValue={client?.propertyDetails ?? ""} placeholder="e.g. 4BHK, 3400 sq ft" />
          </F>
          <F label="Design Preferences" full>
            <Textarea name="designPreferences" defaultValue={client?.designPreferences ?? ""} />
          </F>
          <F label="Notes" full>
            <Textarea name="notes" defaultValue={client?.notes ?? ""} />
          </F>
          <DialogFooter className="mt-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="lime" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function F({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
