"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { purchaseOrders, activities } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";
import { notifyMany, projectRecipients } from "@/lib/notifications";
import { PROCUREMENT_STAGE_LABELS } from "@/lib/constants";

/** Stages worth notifying the project team about (milestones, not every step). */
const NOTIFY_STAGES = new Set([
  "order_placed",
  "in_transit",
  "delivered",
  "quality_inspection",
  "completed",
]);

export type ActionResult = { ok: boolean; error?: string; id?: string };

const num = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().optional());

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  projectId: z.string().optional(),
  vendorId: z.string().optional(),
  description: z.string().optional(),
  quantity: num,
  unit: z.string().optional(),
  amount: num,
  expectedDelivery: z.string().optional(),
});

export async function createPurchaseOrder(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const id = createId();
  const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  await db.insert(purchaseOrders).values({
    id,
    poNumber,
    title: d.title,
    projectId: d.projectId || null,
    vendorId: d.vendorId || null,
    description: d.description,
    quantity: d.quantity ?? 1,
    unit: d.unit || "unit",
    amount: d.amount ?? 0,
    expectedDelivery: d.expectedDelivery || null,
    stage: "requirement",
    paymentStatus: "unpaid",
    isSample: false,
  });
  revalidatePath("/procurement");
  return { ok: true, id };
}

export async function updatePOStage(id: string, stage: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const po = await db.query.purchaseOrders.findFirst({ where: eq(purchaseOrders.id, id) });
  if (!po) return { ok: false, error: "Not found" };
  await db
    .update(purchaseOrders)
    .set({ stage: stage as any, updatedAt: new Date().toISOString() })
    .where(eq(purchaseOrders.id, id));
  await db.insert(activities).values({
    type: "procurement",
    title: `${po.poNumber} → ${PROCUREMENT_STAGE_LABELS[stage]}`,
    description: po.title,
    projectId: po.projectId,
    actorId: session.id,
    isSample: false,
  });

  // Notify the project team on milestone stage changes.
  if (NOTIFY_STAGES.has(stage) && po.stage !== stage) {
    await notifyMany(
      await projectRecipients(po.projectId, ["procurement_manager"]),
      {
        type: "procurement",
        title: `${po.poNumber} — ${PROCUREMENT_STAGE_LABELS[stage]}`,
        body: po.title,
        href: "/procurement",
        actorId: session.id,
        skipUserId: session.id,
      },
    );
  }

  revalidatePath("/procurement");
  return { ok: true };
}

export async function updatePOPayment(id: string, paymentStatus: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db
    .update(purchaseOrders)
    .set({ paymentStatus: paymentStatus as any, updatedAt: new Date().toISOString() })
    .where(eq(purchaseOrders.id, id));
  revalidatePath("/procurement");
  return { ok: true };
}
