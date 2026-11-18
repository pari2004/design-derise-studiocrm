import type { Quotation, QuotationItem, Client, Project } from "@/db/schema";
import { formatINR, formatDate } from "@/lib/format";

/** Trim a measurement to at most 4 decimals without trailing zeros. */
function num(n: number | null | undefined) {
  if (n == null) return "";
  const r = Math.round(n * 10000) / 10000;
  return String(r);
}

type Grouped = {
  section: string;
  rooms: { room: string; items: QuotationItem[] }[];
}[];

/** Group items by section → room, preserving first-seen order. */
function groupItems(items: QuotationItem[]): Grouped {
  const out: Grouped = [];
  for (const it of items) {
    const section = it.section?.trim() || "";
    const room = it.room?.trim() || "";
    let sec = out.find((s) => s.section === section);
    if (!sec) {
      sec = { section, rooms: [] };
      out.push(sec);
    }
    let rm = sec.rooms.find((r) => r.room === room);
    if (!rm) {
      rm = { room, items: [] };
      sec.rooms.push(rm);
    }
    rm.items.push(it);
  }
  return out;
}

const COMPANY = {
  name: "DESIGN & DESIRE STUDIO INTERIORS",
  legal: "DESIGN & DESIRE STUDIO",
  phone: "+91 7795888235, 8884283848",
  email: "designanddesirestudio@gmail.com",
  website: "www.designanddesirestudio.com",
  location: "Bangalore, Karnataka",
};

export function EstimationDocument({
  doc,
  items,
  client,
  project,
}: {
  doc: Quotation;
  items: QuotationItem[];
  client: Client | null;
  project: Project | null;
}) {
  const grouped = groupItems(items);
  const sections = Array.from(
    new Set(items.map((i) => i.section?.trim()).filter(Boolean)),
  ).join(" / ");
  const materialSpecs = (doc.materialSpecs ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const timelines = (doc.designTimelines ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const hasBank =
    doc.bankAccountName || doc.bankAccountNumber || doc.bankIfsc;

  const COLS = 9;

  return (
    <div className="print-document mx-auto max-w-[210mm] bg-white p-8 text-[12px] leading-snug text-charcoal-text shadow-glass print:p-0 print:shadow-none">
      {/* Company header */}
      <div className="border-b-2 border-charcoal/70 pb-3 text-center">
        <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-charcoal-text">
          {COMPANY.name}
        </h1>
      </div>
      <div className="mt-3 flex justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">From</p>
          <p className="font-bold">{COMPANY.legal}</p>
          <p>Phone: {COMPANY.phone}</p>
          <p>Email: {COMPANY.email}</p>
          <p>{COMPANY.website}</p>
          <p>{COMPANY.location}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">To</p>
          <p className="font-bold">{client?.name ?? "—"}</p>
          {client?.address && <p>{client.address}</p>}
          {client?.city && <p>{client.city}</p>}
          {client?.phone && <p>Phone: {client.phone}</p>}
          {client?.email && <p>Email: {client.email}</p>}
        </div>
      </div>

      {/* Estimation band */}
      <div className="mt-4 flex items-center justify-between border-y border-charcoal/30 bg-cream/70 px-3 py-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          No: {doc.number}
        </span>
        <h2 className="font-display text-lg font-bold uppercase tracking-wider">
          Estimation
        </h2>
        <span className="text-[11px] text-muted-foreground">
          Date: {formatDate(doc.issueDate)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Project Type: {sections || project?.projectType || "Custom"}
          {project ? ` · ${project.name}` : ""}
        </span>
      </div>

      <p className="mt-3">We are pleased to quote you the following:</p>

      {/* Line-item table */}
      <table className="mt-2 w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-charcoal/90 text-left text-white">
            <Th className="w-[4%]">Sl.</Th>
            <Th className="w-[26%]">Item Description</Th>
            <Th className="w-[16%]">Specification</Th>
            <Th className="w-[6%] text-center">NOS</Th>
            <Th className="w-[16%]">Dimensions</Th>
            <Th className="w-[7%] text-center">Unit</Th>
            <Th className="w-[9%] text-right">Qty</Th>
            <Th className="w-[7%] text-right">Rate</Th>
            <Th className="w-[9%] text-right">Amount</Th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((sec, si) => (
            <GroupBlock key={si} cols={COLS} section={sec} />
          ))}
          <tr className="avoid-break bg-lime/30 font-bold">
            <td colSpan={COLS - 1} className="border border-charcoal/30 px-2 py-2 text-right uppercase">
              Total
            </td>
            <td className="border border-charcoal/30 px-2 py-2 text-right">
              {formatINR(doc.total)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Financial summary (only when adjustments apply) */}
      {(doc.discount > 0 || doc.additionalCharges > 0 || doc.gstRate > 0) && (
        <div className="avoid-break mt-3 flex justify-end">
          <table className="text-[11px]">
            <tbody>
              <SummaryRow label="Subtotal" value={formatINR(doc.subtotal)} />
              {doc.discount > 0 && (
                <SummaryRow label="Discount" value={`- ${formatINR(doc.discount)}`} />
              )}
              {doc.additionalCharges > 0 && (
                <SummaryRow label="Additional Charges" value={formatINR(doc.additionalCharges)} />
              )}
              {doc.gstRate > 0 && (
                <SummaryRow label={`GST (${doc.gstRate}%)`} value={formatINR(doc.gstAmount)} />
              )}
              <SummaryRow label="Grand Total" value={formatINR(doc.total)} bold />
            </tbody>
          </table>
        </div>
      )}

      {/* Accounts */}
      {hasBank && (
        <section className="avoid-break mt-5">
          <h3 className="mb-1 font-bold uppercase">Accounts Details</h3>
          {doc.bankAccountName && <p>Account Name: {doc.bankAccountName}</p>}
          {doc.bankAccountNumber && <p>Account Number: {doc.bankAccountNumber}</p>}
          {doc.bankIfsc && <p>IFSC: {doc.bankIfsc}</p>}
        </section>
      )}

      {/* Material specifications */}
      {materialSpecs.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-1 font-bold uppercase">Material Specifications</h3>
          <ol className="list-decimal space-y-0.5 pl-5">
            {materialSpecs.map((s, i) => (
              <li key={i} className="avoid-break">{s}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Design timelines & terms */}
      {timelines.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-1 font-bold uppercase">Design Timelines &amp; Terms</h3>
          <ol className="list-decimal space-y-0.5 pl-5">
            {timelines.map((s, i) => (
              <li key={i} className="avoid-break">{s}</li>
            ))}
          </ol>
        </section>
      )}

      {(doc.terms || doc.notes) && (
        <section className="avoid-break mt-4 text-[11px] text-muted-foreground">
          {doc.terms && <p>{doc.terms}</p>}
          {doc.notes && <p className="mt-1">{doc.notes}</p>}
        </section>
      )}

      {/* Sign-off */}
      <div className="avoid-break mt-8 flex items-end justify-between">
        <p className="font-semibold">
          Thanking You,
          <br />
          {COMPANY.name}
        </p>
        <div className="text-center text-[11px] text-muted-foreground">
          <div className="mb-1 h-12 w-40 border-b border-charcoal/40" />
          Authorized Signature &amp; Stamp
        </div>
      </div>
    </div>
  );
}

function GroupBlock({
  section,
  cols,
}: {
  section: Grouped[number];
  cols: number;
}) {
  return (
    <>
      {section.section && (
        <tr className="break-after-avoid bg-sand/70">
          <td colSpan={cols} className="border border-charcoal/30 px-2 py-1.5 text-center font-display text-[12px] font-bold uppercase tracking-wider">
            {section.section}
          </td>
        </tr>
      )}
      {section.rooms.map((rm, ri) => (
        <RoomBlock key={ri} room={rm} cols={cols} />
      ))}
    </>
  );
}

function RoomBlock({
  room,
  cols,
}: {
  room: Grouped[number]["rooms"][number];
  cols: number;
}) {
  return (
    <>
      {room.room && (
        <tr className="break-after-avoid bg-cream/80">
          <td colSpan={cols} className="border border-charcoal/30 px-2 py-1 font-semibold uppercase">
            {room.room}
          </td>
        </tr>
      )}
      {room.items.map((it, i) => (
        <tr key={it.id} className="align-top">
          <Td className="text-center">{i + 1}</Td>
          <Td>
            <span className="font-medium">{it.description}</span>
            {it.subCategory && (
              <span className="block text-[10px] text-muted-foreground">
                Sub Category: {it.subCategory}
              </span>
            )}
          </Td>
          <Td>{it.specification ?? ""}</Td>
          <Td className="text-center">{num(it.nos)}</Td>
          <Td>
            {it.length != null && it.width != null
              ? `L: ${num(it.length)}ft  W: ${num(it.width)}ft`
              : ""}
          </Td>
          <Td className="text-center">{it.unit}</Td>
          <Td className="text-right">{num(it.quantity)}</Td>
          <Td className="text-right">{num(it.unitPrice)}</Td>
          <Td className="text-right">{formatINR(it.amount)}</Td>
        </tr>
      ))}
    </>
  );
}

function Th({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <th className={`border border-charcoal/30 px-2 py-1.5 text-[10px] font-semibold uppercase ${className}`}>
      {children}
    </th>
  );
}
function Td({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <td className={`border border-charcoal/20 px-2 py-1 ${className}`}>{children}</td>;
}
function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr className={bold ? "font-bold" : ""}>
      <td className="py-0.5 pr-6 text-muted-foreground">{label}</td>
      <td className="py-0.5 text-right">{value}</td>
    </tr>
  );
}
