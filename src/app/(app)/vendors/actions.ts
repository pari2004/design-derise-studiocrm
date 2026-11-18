"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  gstin: z.string().optional(),
  categories: z.string().optional(),
  paymentTerms: z.string().optional(),
  rating: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(0).max(5).optional()),
});

export type ActionResult = { ok: boolean; error?: string; id?: string };

export async function createVendor(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const id = createId();
  await db.insert(vendors).values({
    id,
    name: d.name,
    company: d.company,
    contactPerson: d.contactPerson,
    phone: d.phone,
    email: d.email || null,
    address: d.address,
    gstin: d.gstin,
    categories: d.categories,
    paymentTerms: d.paymentTerms,
    rating: d.rating ?? 0,
    isSample: false,
  });
  revalidatePath("/vendors");
  return { ok: true, id };
}

export async function deleteVendor(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(vendors).where(eq(vendors.id, id));
  revalidatePath("/vendors");
  return { ok: true };
}
