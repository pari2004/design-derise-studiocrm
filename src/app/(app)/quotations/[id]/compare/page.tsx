import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { db } from "@/db";
import { quotations, quotationItems, clients } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DOC_STATUS } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Doc = typeof quotations.$inferSelect;

export default async function CompareQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await db.query.quotations.findFirst({ where: eq(quotations.id, id) });
  if (!doc) notFound();

  // Resolve which two documents to compare: the original (base) and a revision.
  let base: Doc;
  let revised: Doc | undefined;

  if (doc.revisionOf) {
    const root = await db.query.quotations.findFirst({
      where: eq(quotations.id, doc.revisionOf),
    });
    base = root ?? doc;
    revised = doc;
  } else {
    base = doc;
    revised = await db.query.quotations.findFirst({
      where: eq(quotations.revisionOf, doc.id),
      orderBy: [desc(quotations.revisionNumber)],
    });
  }

  if (!revised) {
    return (
      <div className="mx-auto max-w-4xl">
        <BackLink id={id} />
        <EmptyState
          icon={Minus}
          title="Nothing to compare yet"
          description={`${doc.number} has no revisions. Use the “Revise” action on the Quotations list to create a revised version.`}
        />
      </div>
    );
  }

  const [baseItems, revisedItems, client] = await Promise.all([
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, base.id)).orderBy(quotationItems.sortOrder),
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, revised.id)).orderBy(quotationItems.sortOrder),
    base.clientId ? db.query.clients.findFirst({ where: eq(clients.id, base.clientId) }) : null,
  ]);

  // Union of line items matched by normalised description.
  const key = (s: string) => s.trim().toLowerCase();
  const baseMap = new Map(baseItems.map((it) => [key(it.description), it]));
  const revMap = new Map(revisedItems.map((it) => [key(it.description), it]));
  const order: string[] = [];
  const seen = new Set<string>();
  for (const it of baseItems) { const k = key(it.description); if (!seen.has(k)) { seen.add(k); order.push(k); } }
  for (const it of revisedItems) { const k = key(it.description); if (!seen.has(k)) { seen.add(k); order.push(k); } }

  const rows = order.map((k) => {
    const b = baseMap.get(k);
    const r = revMap.get(k);
    const label = b?.description ?? r?.description ?? "—";
    const bAmt = b?.amount ?? 0;
    const rAmt = r?.amount ?? 0;
    const state: "added" | "removed" | "changed" | "same" =
      !b ? "added" : !r ? "removed" : bAmt !== rAmt ? "changed" : "same";
    return { label, b, r, bAmt, rAmt, delta: rAmt - bAmt, state };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink id={id} />

      <div className="mb-5">
        <p className="kicker mb-1">Compare Revisions</p>
        <h1 className="font-display text-2xl font-bold text-charcoal-text">
          {base.number} <span className="text-muted-foreground">vs</span> {revised.number}
        </h1>
        <p className="text-sm text-muted-foreground">
          {client?.name ?? "—"} · comparing the original against revision {revised.revisionNumber}
        </p>
      </div>

      {/* Header cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <DocCard doc={base} label="Original" />
        <DocCard doc={revised} label={`Revision ${revised.revisionNumber}`} highlight />
      </div>

      {/* Line item comparison */}
      <Card glass className="mb-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                <th className="p-3">Line Item</th>
                <th className="p-3 text-right">Original</th>
                <th className="p-3 text-right">Revised</th>
                <th className="p-3 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="p-3">
                    <span className="text-charcoal-text">{row.label}</span>
                    {row.state === "added" && <Tag tone="lime">New</Tag>}
                    {row.state === "removed" && <Tag tone="danger">Removed</Tag>}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {row.b ? formatINR(row.bAmt) : "—"}
                    {row.b && <div className="text-[11px] text-muted-foreground/70">{row.b.quantity} {row.b.unit} × {formatINR(row.b.unitPrice)}</div>}
                  </td>
                  <td className="p-3 text-right text-charcoal-text">
                    {row.r ? formatINR(row.rAmt) : "—"}
                    {row.r && <div className="text-[11px] text-muted-foreground/70">{row.r.quantity} {row.r.unit} × {formatINR(row.r.unitPrice)}</div>}
                  </td>
                  <td className="p-3 text-right"><Delta value={row.delta} show={row.state !== "same"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Totals comparison */}
      <Card glass className="p-4">
        <p className="kicker mb-3">Totals</p>
        <div className="space-y-1.5 text-sm">
          <CompareLine label="Subtotal" a={base.subtotal} b={revised.subtotal} />
          <CompareLine label="Discount" a={base.discount} b={revised.discount} />
          <CompareLine label={`GST (${base.gstRate}% → ${revised.gstRate}%)`} a={base.gstAmount} b={revised.gstAmount} />
          <div className="my-2 h-px bg-border" />
          <CompareLine label="Total" a={base.total} b={revised.total} bold />
        </div>
      </Card>
    </div>
  );
}

function BackLink({ id }: { id: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <Link href="/quotations" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-charcoal-text">
        <ArrowLeft className="h-4 w-4" /> Back to documents
      </Link>
      <Link href={`/quotations/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-charcoal-text">
        Open document <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function DocCard({ doc, label, highlight }: { doc: Doc; label: string; highlight?: boolean }) {
  return (
    <Card className={cn("p-4", highlight ? "border-lime/60 bg-lime/10" : "bg-white/60")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="kicker">{label}</p>
          <Link href={`/quotations/${doc.id}`} className="font-mono text-sm font-semibold text-charcoal-text hover:underline">{doc.number}</Link>
        </div>
        <StatusBadge map={DOC_STATUS} value={doc.status} />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-xs text-muted-foreground">Issued {formatDate(doc.issueDate)}</span>
        <span className="font-display text-xl font-bold text-charcoal-text">{formatINR(doc.total)}</span>
      </div>
    </Card>
  );
}

function CompareLine({ label, a, b, bold }: { label: string; a: number; b: number; bold?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="w-28 text-right text-muted-foreground">{formatINR(a)}</span>
      <span className={cn("w-28 text-right", bold ? "font-display text-base font-bold text-charcoal-text" : "font-medium text-charcoal-text")}>{formatINR(b)}</span>
      <span className="w-28 text-right"><Delta value={b - a} show={a !== b} /></span>
    </div>
  );
}

function Delta({ value, show }: { value: number; show: boolean }) {
  if (!show || value === 0) return <span className="text-muted-foreground">—</span>;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center justify-end gap-1 font-medium", up ? "text-destructive" : "text-green-600")}>
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : "−"}{formatINR(Math.abs(value))}
    </span>
  );
}

function Tag({ tone, children }: { tone: "lime" | "danger"; children: React.ReactNode }) {
  return (
    <span className={cn("ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase", tone === "lime" ? "bg-lime/25 text-charcoal-text" : "bg-destructive/15 text-destructive")}>
      {children}
    </span>
  );
}
