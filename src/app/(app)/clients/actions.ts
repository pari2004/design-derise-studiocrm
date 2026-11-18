"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";

const num = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().optional(),
);

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  propertyType: z.string().optional(),
  propertyDetails: z.string().optional(),
  budgetPreference: num,
  designPreferences: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export type ActionResult = { ok: boolean; error?: string; id?: string };

function parse(fd: FormData) {
  return schema.safeParse(Object.fromEntries(fd.entries()));
}

export async function createClient(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = parse(fd);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const id = createId();
  await db.insert(clients).values({
    id,
    name: d.name,
    email: d.email || null,
    phone: d.phone,
    company: d.company,
    address: d.address,
    city: d.city,
    propertyType: d.propertyType,
    propertyDetails: d.propertyDetails,
    budgetPreference: d.budgetPreference ?? null,
    designPreferences: d.designPreferences,
    status: (d.status as any) || "active",
    notes: d.notes,
    isSample: false,
  });
  revalidatePath("/clients");
  return { ok: true, id };
}

export async function updateClient(id: string, fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = parse(fd);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  await db
    .update(clients)
    .set({
      name: d.name,
      email: d.email || null,
      phone: d.phone,
      company: d.company,
      address: d.address,
      city: d.city,
      propertyType: d.propertyType,
      propertyDetails: d.propertyDetails,
      budgetPreference: d.budgetPreference ?? null,
      designPreferences: d.designPreferences,
      status: (d.status as any) || "active",
      notes: d.notes,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(clients.id, id));
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true, id };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
  return { ok: true };
}
