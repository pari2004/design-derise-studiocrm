import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { quotations, quotationItems, clients, projects } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LogoMark } from "@/components/brand/logo";
import { QuotationActions } from "@/components/quotations/quotation-actions";
import { EstimationDocument } from "@/components/quotations/estimation-document";
import { DOC_STATUS } from "@/lib/constants";
import { formatINR, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await db.query.quotations.findFirst({ where: eq(quotations.id, id) });
  if (!doc) notFound();

  const [items, client, project, clientList, projectList] = await Promise.all([
    db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)).orderBy(quotationItems.sortOrder),
    doc.clientId ? db.query.clients.findFirst({ where: eq(clients.id, doc.clientId) }) : null,
    doc.projectId ? db.query.projects.findFirst({ where: eq(projects.id, doc.projectId) }) : null,
    db.select({ id: clients.id, name: clients.name }).from(clients),
    db.select({ id: projects.id, name: projects.name }).from(projects),
  ]);

  const due = doc.total - doc.amountPaid;
  const isInvoice = doc.type === "invoice";

  const editInitial = {
    type: doc.type,
    template: doc.template,
    clientId: doc.clientId ?? "",
    projectId: doc.projectId ?? "",
    discount: doc.discount,
    additionalCharges: doc.additionalCharges,
    gstRate: doc.gstRate,
    terms: doc.terms ?? "",
    notes: doc.notes ?? "",
    bankAccountName: doc.bankAccountName ?? "",
    bankAccountNumber: doc.bankAccountNumber ?? "",
    bankIfsc: doc.bankIfsc ?? "",
    materialSpecs: doc.materialSpecs ?? "",
    designTimelines: doc.designTimelines ?? "",
    items: items.map((it) => {
      const derived =
        it.nos != null && it.length != null && it.width != null
          ? Math.round(it.nos * it.length * it.width * 10000) / 10000
          : null;
      return {
        description: it.description,
        quantity: it.quantity,
        unit: it.unit ?? "unit",
        unitPrice: it.unitPrice,
        section: it.section ?? "",
        room: it.room ?? "",
        subCategory: it.subCategory ?? "",
        specification: it.specification ?? "",
        nos: it.nos ?? null,
        length: it.length ?? null,
        width: it.width ?? null,
        manualQty: derived == null || derived !== it.quantity,
      };
    }),
  };

  const isEstimation = doc.template === "estimation";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/quotations" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-charcoal-text">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <QuotationActions id={doc.id} type={doc.type} status={doc.status} due={due} clients={clientList} projects={projectList} editInitial={editInitial} />
      </div>

      {isEstimation ? (
        <EstimationDocument doc={doc} items={items} client={client ?? null} project={project ?? null} />
      ) : (
      <Card className="print-document overflow-hidden border-border/70 bg-white p-0 shadow-glass print:shadow-none">
        {/* Letterhead */}
        <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-cream/60 p-8">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="font-display text-lg font-bold text-charcoal-text">
                Design<span className="text-taupe">and</span>Desire<span className="text-taupe">Studio</span>
              </p>
              <p className="text-xs text-muted-foreground">Interior Design & Architecture · Bengaluru</p>
              <p className="text-xs text-muted-foreground">designanddesirestudio@gmail.com · GSTIN 29AADDS1234D1Z0</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-charcoal-text">
              {isInvoice ? "Invoice" : "Quotation"}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">{doc.number}</p>
            <div className="mt-1 flex justify-end"><StatusBadge map={DOC_STATUS} value={doc.status} /></div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid gap-6 p-8 sm:grid-cols-2">
          <div>
            <p className="kicker mb-1">Billed To</p>
            <p className="font-semibold text-charcoal-text">{client?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{client?.address ?? ""}</p>
            <p className="text-sm text-muted-foreground">{client?.city ?? ""}</p>
            <p className="text-sm text-muted-foreground">{client?.phone ?? ""}</p>
          </div>
          <div className="sm:text-right">
            <Meta label="Issue Date" value={formatDate(doc.issueDate)} />
            <Meta label="Due Date" value={formatDate(doc.dueDate)} />
            {project && <Meta label="Project" value={project.name} />}
          </div>
        </div>

        {/* Items */}
        <div className="px-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-charcoal/10 text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Rate</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-border/50">
                  <td className="py-3 text-charcoal-text">{it.description}</td>
                  <td className="py-3 text-right text-muted-foreground">{it.quantity} {it.unit}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatINR(it.unitPrice)}</td>
                  <td className="py-3 text-right font-medium text-charcoal-text">{formatINR(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end p-8 pt-6">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <Line label="Subtotal" value={formatINR(doc.subtotal)} />
            {doc.discount > 0 && <Line label="Discount" value={`- ${formatINR(doc.discount)}`} />}
            <Line label={`GST (${doc.gstRate}%)`} value={formatINR(doc.gstAmount)} />
            <div className="my-2 h-px bg-charcoal/15" />
            <div className="flex items-center justify-between rounded-lg bg-lime/25 px-3 py-2">
              <span className="font-semibold text-charcoal-text">Total</span>
              <span className="font-display text-xl font-bold text-charcoal-text">{formatINR(doc.total)}</span>
            </div>
            {doc.amountPaid > 0 && (
              <>
                <Line label="Paid" value={formatINR(doc.amountPaid)} />
                <Line label="Balance Due" value={formatINR(due)} bold />
              </>
            )}
          </div>
        </div>

        {/* Terms */}
        {(doc.terms || doc.notes) && (
          <div className="border-t border-border/60 bg-cream/40 p-8">
            {doc.terms && <><p className="kicker mb-1">Terms & Conditions</p><p className="text-sm text-muted-foreground">{doc.terms}</p></>}
            {doc.notes && <p className="mt-3 text-sm text-muted-foreground">{doc.notes}</p>}
            <p className="mt-6 text-center text-xs text-muted-foreground">Thank you for choosing DesignandDesireStudio.</p>
          </div>
        )}
      </Card>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1">
      <span className="text-xs text-muted-foreground">{label}: </span>
      <span className="text-sm font-medium text-charcoal-text">{value}</span>
    </div>
  );
}
function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold text-charcoal-text" : "font-medium text-charcoal-text"}>{value}</span>
    </div>
  );
}
