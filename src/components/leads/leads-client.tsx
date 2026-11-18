"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Phone,
  Mail,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { LeadFormDialog } from "./lead-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { LEAD_STATUS, LEAD_STATUS_OPTIONS } from "@/lib/constants";
import { formatINRCompact, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteLead, convertLead, updateLeadStatus } from "@/app/(app)/leads/actions";
import type { Lead } from "@/db/schema";

type Row = Lead & { designerName: string | null };

export function LeadsClient({
  leads,
  designers,
  openNew,
}: {
  leads: Row[];
  designers: { id: string; name: string }[];
  openNew?: boolean;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesStatus = status === "all" || l.status === status;
      const hay = `${l.fullName} ${l.email ?? ""} ${l.location ?? ""} ${l.propertyType ?? ""} ${l.source ?? ""}`.toLowerCase();
      return matchesStatus && hay.includes(q.toLowerCase());
    });
  }, [leads, q, status]);

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteLead(id);
      if (res.ok) toast.success("Lead deleted");
      else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }

  function onConvert(id: string) {
    startTransition(async () => {
      const res = await convertLead(id);
      if (res.ok) {
        toast.success("Lead converted to client & project");
        if (res.id) router.push(`/projects/${res.id}`);
      } else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }

  function onQuickStatus(id: string, s: string) {
    startTransition(async () => {
      const res = await updateLeadStatus(id, s);
      if (res.ok) toast.success(`Status updated to "${LEAD_STATUS[s]?.label ?? s}"`);
      else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
            All
          </FilterChip>
          {LEAD_STATUS_OPTIONS.map((o) => (
            <FilterChip
              key={o.value}
              active={status === o.value}
              onClick={() => setStatus(o.value)}
            >
              {o.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-1.5">
        {filtered.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No leads found"
            description="Try adjusting filters, or capture a new enquiry."
            action={<LeadFormDialog designers={designers} defaultOpen={openNew} />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead className="hidden md:table-cell">Property</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="hidden lg:table-cell">Budget</TableHead>
                <TableHead className="hidden lg:table-cell">Designer</TableHead>
                <TableHead className="hidden sm:table-cell">Follow-up</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/leads/${l.id}`}
                        className="font-medium text-charcoal-text hover:underline"
                      >
                        {l.fullName}
                      </Link>
                      {l.isSample && <SampleBadge />}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {l.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {l.phone}
                        </span>
                      )}
                      {l.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {l.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm text-charcoal-text">{l.propertyType ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{l.location ?? ""}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {l.source ? (
                      <span className="inline-flex items-center rounded-full border border-border/60 bg-white/50 px-2.5 py-0.5 text-xs font-medium text-charcoal-text/80">
                        {l.source}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {l.estimatedBudget ? formatINRCompact(l.estimatedBudget) : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {l.designerName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {formatDate(l.followUpDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge map={LEAD_STATUS} value={l.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <LeadFormDialog
                          designers={designers}
                          lead={l}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          }
                        />
                        {l.status !== "won" && (
                          <DropdownMenuItem onClick={() => onConvert(l.id)}>
                            <ArrowRightLeft className="h-4 w-4" /> Convert to project
                          </DropdownMenuItem>
                        )}
                        {l.status !== "won" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Set status</DropdownMenuLabel>
                            {LEAD_STATUS_OPTIONS.filter(
                              (o) => o.value !== "won" && o.value !== l.status,
                            ).map((o) => (
                              <DropdownMenuItem
                                key={o.value}
                                disabled={pending}
                                onClick={() => onQuickStatus(l.id, o.value)}
                              >
                                <StatusBadge map={LEAD_STATUS} value={o.value} />
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                        <ConfirmDialog
                          title="Delete this lead?"
                          description={`"${l.fullName}" will be permanently removed.`}
                          onConfirm={() => onDelete(l.id)}
                          trigger={
                            <DropdownMenuItem
                              destructive
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-transparent bg-lime text-charcoal shadow-lime"
          : "border-border/60 bg-white/50 text-charcoal-text/70 hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
