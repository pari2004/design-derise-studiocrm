"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";

const num = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().optional(),
);

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  vendorId: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  costPrice: num,
  sellingPrice: num,
  availability: z.string().optional(),
  color: z.string().optional(),
  finish: z.string().optional(),
  dimensions: z.string().optional(),
  specifications: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type ActionResult = { ok: boolean; error?: string; id?: string };

export async function createMaterial(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const id = createId();
  await db.insert(materials).values({
    id,
    name: d.name,
    category: d.category,
    brand: d.brand,
    vendorId: d.vendorId || null,
    sku: d.sku,
    unit: d.unit || "unit",
    costPrice: d.costPrice ?? 0,
    sellingPrice: d.sellingPrice ?? 0,
    availability: (d.availability as any) || "in_stock",
    color: d.color,
    finish: d.finish,
    dimensions: d.dimensions,
    specifications: d.specifications,
    imageUrl: d.imageUrl || null,
    isSample: false,
  });
  revalidatePath("/materials");
  return { ok: true, id };
}

export async function deleteMaterial(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(materials).where(eq(materials.id, id));
  revalidatePath("/materials");
  return { ok: true };
}
