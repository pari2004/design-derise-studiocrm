"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FileText,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
  GitCompareArrows,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { DOC_STATUS } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/format";
import {
  deleteQuotation,
  loadQuotationForRevise,
  type ReviseData,
} from "@/app/(app)/quotations/actions";
import { QuotationFormDialog } from "./quotation-form-dialog";
import type { Quotation } from "@/db/schema";

type Row = Quotation & { clientName: string | null };
type Tab = "all" | "quotation" | "invoice" | "revised";

export function QuotationsClient({
  docs,
  clients,
  projects,
}: {
  docs: Row[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [, startTransition] = useTransition();
  const [revising, startRevise] = useTransition();
  const [reviseTarget, setReviseTarget] = useState<{
    id: string;
    data: ReviseData;
  } | null>(null);
  const router = useRouter();

  const byId = useMemo(() => new Map(docs.map((d) => [d.id, d])), [docs]);

  const filtered = useMemo(
    () =>
      docs.filter((d) => {
        if (tab === "all") return true;
        if (tab === "revised") return !!d.revisionOf;
        if (tab === "quotation") return d.type === "quotation" && !d.revisionOf;
        if (tab === "invoice") return d.type === "invoice";
        return true;
      }),
    [docs, tab],
  );

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteQuotation(id);
      toast.success("Deleted");
      router.refresh();
    });
  }

  function onRevise(id: string) {
    startRevise(async () => {
      const res = await loadQuotationForRevise(id);
      if (res.ok && res.data) setReviseTarget({ id, data: res.data });
      else toast.error(res.error ?? "Could not load quotation");
    });
  }

  const tabs: [Tab, string][] = [
    ["all", "All"],
    ["quotation", "Quotations"],
    ["invoice", "Invoices"],
    ["revised", "Revised"],
  ];

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div className="inline-flex rounded-full border border-border/60 bg-white/50 p-1">
          {tabs.map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium", tab === v ? "bg-charcoal text-cream" : "text-charcoal-text/70")}>{l}</button>
          ))}
        </div>
        <QuotationFormDialog
          clients={clients}
          projects={projects}
          trigger={<Button variant="lime"><Plus className="h-4 w-4" /> New Document</Button>}
        />
      </div>

      {tab === "revised" && filtered.length > 0 && (
        <p className="mb-3 text-sm text-muted-foreground">
          Revised quotations keep the original untouched. Open <span className="font-medium text-charcoal-text">Compare</span> to see what changed against the original.
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={tab === "revised" ? "No revised quotations" : "No documents"}
          description={
            tab === "revised"
              ? "Use the “Revise” action on any quotation to create a revised version you can compare."
              : "Create a GST-ready quotation or invoice to get started."
          }
        />
      ) : (
        <Card glass className="p-2">
          <div className="divide-y divide-border/50">
            {filtered.map((d) => {
              const root = d.revisionOf ? byId.get(d.revisionOf) : null;
              return (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/quotations/${d.id}`} className="font-mono text-sm font-semibold text-charcoal-text hover:underline">{d.number}</Link>
                      <span className="rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium uppercase text-charcoal-text">{d.type}</span>
                      {d.revisionOf && (
                        <span className="rounded-full bg-taupe/20 px-2 py-0.5 text-[10px] font-medium uppercase text-charcoal-text">
                          Rev {d.revisionNumber}
                          {root ? ` · of ${root.number}` : ""}
                        </span>
                      )}
                      {d.isSample && <SampleBadge />}
                    </div>
                    <p className="text-xs text-muted-foreground">{d.clientName ?? "—"} · Issued {formatDate(d.issueDate)}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="font-display text-base font-bold text-charcoal-text">{formatINR(d.total)}</p>
                    <p className="text-xs text-muted-foreground">Paid {formatINR(d.amountPaid)}</p>
                  </div>
                  <StatusBadge map={DOC_STATUS} value={d.status} />
                  {d.revisionOf && (
                    <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                      <Link href={`/quotations/${d.id}/compare`}>
                        <GitCompareArrows className="h-4 w-4" /> Compare
                      </Link>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link href={`/quotations/${d.id}`}><Eye className="h-4 w-4" /> View / Print</Link></DropdownMenuItem>
                      {d.type === "quotation" && (
                        <DropdownMenuItem disabled={revising} onSelect={(e) => { e.preventDefault(); onRevise(d.id); }}>
                          <Copy className="h-4 w-4" /> Revise
                        </DropdownMenuItem>
                      )}
                      {d.revisionOf && (
                        <DropdownMenuItem asChild><Link href={`/quotations/${d.id}/compare`}><GitCompareArrows className="h-4 w-4" /> Compare to original</Link></DropdownMenuItem>
                      )}
                      <ConfirmDialog title="Delete document?" onConfirm={() => onDelete(d.id)} trigger={<DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {reviseTarget && (
        <QuotationFormDialog
          key={reviseTarget.id}
          clients={clients}
          projects={projects}
          open
          onOpenChange={(o) => { if (!o) setReviseTarget(null); }}
          initial={reviseTarget.data}
          reviseOfId={reviseTarget.id}
          reviseOfNumber={reviseTarget.data.number}
        />
      )}
    </>
  );
}
