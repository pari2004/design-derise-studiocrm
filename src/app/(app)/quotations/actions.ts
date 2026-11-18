"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations, quotationItems, activities, projects } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";
import { notifyMany, getUserIdsByRole } from "@/lib/notifications";
import { formatINR } from "@/lib/format";

/** Collect finance team + admins, plus the related project's manager. */
async function financeRecipients(projectId: string | null): Promise<string[]> {
  const ids = await getUserIdsByRole(["admin", "finance_manager"]);
  if (projectId) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { projectManagerId: true },
    });
    if (project?.projectManagerId) ids.push(project.projectManagerId);
  }
  return ids;
}

export type ActionResult = { ok: boolean; error?: string; id?: string };

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unitPrice: z.number(),
  // Estimation-only fields.
  section: z.string().optional(),
  room: z.string().optional(),
  subCategory: z.string().optional(),
  specification: z.string().optional(),
  nos: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  // When true, use the entered quantity instead of NOS × L × W.
  manualQty: z.boolean().optional(),
});

const schema = z.object({
  type: z.enum(["quotation", "invoice"]),
  template: z.enum(["standard", "estimation"]).default("standard"),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  discount: z.number().default(0),
  additionalCharges: z.number().default(0),
  gstRate: z.number().default(18),
  terms: z.string().optional(),
  notes: z.string().optional(),
  // Estimation boilerplate.
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  materialSpecs: z.string().optional(),
  designTimelines: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one line item"),
  // When set, this document is saved as a revision of the referenced quotation.
  revisionOf: z.string().optional(),
});

type ParsedItem = z.infer<typeof itemSchema>;

/**
 * Resolve each line's effective quantity and amount. For estimation lines the
 * quantity is derived from NOS × Length × Width; otherwise the entered quantity
 * is used. Amount is always quantity × unit rate.
 */
function resolveItem(it: ParsedItem, template: string) {
  let quantity = it.quantity ?? 0;
  const canDerive =
    template === "estimation" &&
    !it.manualQty &&
    it.nos != null &&
    it.length != null &&
    it.width != null;
  if (canDerive) {
    quantity = round4(it.nos! * it.length! * it.width!);
  }
  const amount = round4(quantity * it.unitPrice);
  return { quantity, amount };
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

export async function createQuotation(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const resolved = d.items.map((it) => ({ it, ...resolveItem(it, d.template) }));
  const subtotal = round4(resolved.reduce((s, r) => s + r.amount, 0));
  const taxable = Math.max(0, subtotal - d.discount) + d.additionalCharges;
  const gstAmount = Math.round(taxable * (d.gstRate / 100));
  const total = taxable + gstAmount;

  const id = createId();

  // --- Resolve revision metadata (if revising an existing quotation) -------
  let revisionOf: string | null = null;
  let revisionNumber = 1;
  let number: string;

  if (d.revisionOf) {
    const source = await db.query.quotations.findFirst({
      where: eq(quotations.id, d.revisionOf),
    });
    if (!source) return { ok: false, error: "Original quotation not found" };
    // Root is the original at the head of the revision chain.
    const rootId = source.revisionOf ?? source.id;
    const root =
      rootId === source.id
        ? source
        : await db.query.quotations.findFirst({ where: eq(quotations.id, rootId) });
    const rootNumber = root?.number ?? source.number;
    const siblings = await db.query.quotations.findMany({
      where: eq(quotations.revisionOf, rootId),
    });
    revisionOf = rootId;
    revisionNumber = siblings.length + 2; // root is rev 1
    number = `${rootNumber}-R${revisionNumber}`;
  } else {
    const prefix = d.type === "invoice" ? "INV" : "QT";
    number = `${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  }

  await db.insert(quotations).values({
    id,
    number,
    // Revisions are always quotations.
    type: d.revisionOf ? "quotation" : d.type,
    template: d.template,
    revisionOf,
    revisionNumber,
    clientId: d.clientId || null,
    projectId: d.projectId || null,
    issueDate: d.issueDate || new Date().toISOString(),
    dueDate: d.dueDate || null,
    subtotal,
    discount: d.discount,
    additionalCharges: d.additionalCharges,
    gstRate: d.gstRate,
    gstAmount,
    total,
    amountPaid: 0,
    status: "draft",
    terms: d.terms,
    notes: d.notes,
    bankAccountName: d.bankAccountName || null,
    bankAccountNumber: d.bankAccountNumber || null,
    bankIfsc: d.bankIfsc || null,
    materialSpecs: d.materialSpecs || null,
    designTimelines: d.designTimelines || null,
    isSample: false,
  });

  await db.insert(quotationItems).values(
    resolved.map(({ it, quantity, amount }, i) => ({
      id: createId(),
      quotationId: id,
      description: it.description,
      quantity,
      unit: it.unit || "unit",
      unitPrice: it.unitPrice,
      amount,
      sortOrder: i,
      section: it.section || null,
      room: it.room || null,
      subCategory: it.subCategory || null,
      specification: it.specification || null,
      nos: it.nos ?? null,
      length: it.length ?? null,
      width: it.width ?? null,
    })),
  );

  revalidatePath("/quotations");
  return { ok: true, id };
}

/** Update an existing document's fields + line items (totals recomputed). */
export async function updateQuotation(id: string, input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const existing = await db.query.quotations.findFirst({ where: eq(quotations.id, id) });
  if (!existing) return { ok: false, error: "Not found" };

  const resolved = d.items.map((it) => ({ it, ...resolveItem(it, d.template) }));
  const subtotal = round4(resolved.reduce((s, r) => s + r.amount, 0));
  const taxable = Math.max(0, subtotal - d.discount) + d.additionalCharges;
  const gstAmount = Math.round(taxable * (d.gstRate / 100));
  const total = taxable + gstAmount;

  await db
    .update(quotations)
    .set({
      // Keep a revision locked to "quotation"; otherwise honour the chosen type.
      type: existing.revisionOf ? "quotation" : d.type,
      template: d.template,
      clientId: d.clientId || null,
      projectId: d.projectId || null,
      subtotal,
      discount: d.discount,
      additionalCharges: d.additionalCharges,
      gstRate: d.gstRate,
      gstAmount,
      total,
      terms: d.terms,
      notes: d.notes,
      bankAccountName: d.bankAccountName || null,
      bankAccountNumber: d.bankAccountNumber || null,
      bankIfsc: d.bankIfsc || null,
      materialSpecs: d.materialSpecs || null,
      designTimelines: d.designTimelines || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(quotations.id, id));

  // Replace line items.
  await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
  await db.insert(quotationItems).values(
    resolved.map(({ it, quantity, amount }, i) => ({
      id: createId(),
      quotationId: id,
      description: it.description,
      quantity,
      unit: it.unit || "unit",
      unitPrice: it.unitPrice,
      amount,
      sortOrder: i,
      section: it.section || null,
      room: it.room || null,
      subCategory: it.subCategory || null,
      specification: it.specification || null,
      nos: it.nos ?? null,
      length: it.length ?? null,
      width: it.width ?? null,
    })),
  );

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
  return { ok: true, id };
}

export async function updateQuotationStatus(id: string, status: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const q = await db.query.quotations.findFirst({ where: eq(quotations.id, id) });
  if (!q) return { ok: false, error: "Not found" };
  await db
    .update(quotations)
    .set({ status: status as any, updatedAt: new Date().toISOString() })
    .where(eq(quotations.id, id));

  // Notify finance/admins when a document is accepted or marked paid.
  if ((status === "accepted" || status === "paid") && q.status !== status) {
    const label = q.type === "invoice" ? "Invoice" : "Quotation";
    await notifyMany(await financeRecipients(q.projectId), {
      type: "payment",
      title:
        status === "accepted"
          ? `${label} accepted — ${q.number}`
          : `${label} fully paid — ${q.number}`,
      body: `${formatINR(q.total)} total.`,
      href: `/quotations/${id}`,
      actorId: session.id,
      skipUserId: session.id,
    });
  }

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
  return { ok: true };
}

export async function recordPayment(id: string, amount: number): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const q = await db.query.quotations.findFirst({ where: eq(quotations.id, id) });
  if (!q) return { ok: false, error: "Not found" };
  const paid = Math.min(q.total, q.amountPaid + amount);
  const status = paid >= q.total ? "paid" : paid > 0 ? "partially_paid" : q.status;
  await db
    .update(quotations)
    .set({ amountPaid: paid, status: status as any, updatedAt: new Date().toISOString() })
    .where(eq(quotations.id, id));
  await db.insert(activities).values({
    type: "payment",
    title: `Payment received — ₹${amount.toLocaleString("en-IN")}`,
    description: `Against ${q.number}.`,
    projectId: q.projectId,
    actorId: session.id,
    isSample: false,
  });

  // Notify finance/admins when this payment settles the document in full.
  if (status === "paid" && q.status !== "paid") {
    await notifyMany(await financeRecipients(q.projectId), {
      type: "payment",
      title: `Invoice fully paid — ${q.number}`,
      body: `${formatINR(q.total)} received in full.`,
      href: `/quotations/${id}`,
      actorId: session.id,
      skipUserId: session.id,
    });
  }

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export type ReviseEstimationFields = {
  section: string;
  room: string;
  subCategory: string;
  specification: string;
  nos: number | null;
  length: number | null;
  width: number | null;
  manualQty: boolean;
};

export type ReviseData = {
  template: "standard" | "estimation";
  clientId: string;
  projectId: string;
  discount: number;
  additionalCharges: number;
  gstRate: number;
  terms: string;
  notes: string;
  number: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  materialSpecs: string;
  designTimelines: string;
  items: ({
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  } & ReviseEstimationFields)[];
};

/** Load an existing quotation + its line items to pre-fill a revision. */
export async function loadQuotationForRevise(
  id: string,
): Promise<{ ok: boolean; error?: string; data?: ReviseData }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const doc = await db.query.quotations.findFirst({ where: eq(quotations.id, id) });
  if (!doc) return { ok: false, error: "Not found" };
  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, id))
    .orderBy(quotationItems.sortOrder);
  return {
    ok: true,
    data: {
      template: doc.template,
      clientId: doc.clientId ?? "",
      projectId: doc.projectId ?? "",
      discount: doc.discount,
      additionalCharges: doc.additionalCharges,
      gstRate: doc.gstRate,
      terms: doc.terms ?? "",
      notes: doc.notes ?? "",
      number: doc.number,
      bankAccountName: doc.bankAccountName ?? "",
      bankAccountNumber: doc.bankAccountNumber ?? "",
      bankIfsc: doc.bankIfsc ?? "",
      materialSpecs: doc.materialSpecs ?? "",
      designTimelines: doc.designTimelines ?? "",
      items: items.map((it) => {
        const derived =
          it.nos != null && it.length != null && it.width != null
            ? round4(it.nos * it.length * it.width)
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
    },
  };
}

export async function deleteQuotation(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
  await db.delete(quotations).where(eq(quotations.id, id));
  revalidatePath("/quotations");
  return { ok: true };
}
