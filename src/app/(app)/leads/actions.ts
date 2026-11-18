"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, clients, projects, activities } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";
import { notify } from "@/lib/notifications";

const num = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().optional(),
);

const leadSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  propertyType: z.string().optional(),
  propertySize: num,
  estimatedBudget: num,
  designStyle: z.string().optional(),
  serviceRequired: z.string().optional(),
  source: z.string().optional(),
  assignedDesignerId: z.string().optional(),
  enquiryDate: z.string().optional(),
  followUpDate: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export type ActionResult = { ok: boolean; error?: string; id?: string };

function parse(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return leadSchema.safeParse(raw);
}

export async function createLead(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = parse(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message };

  const d = parsed.data;
  const id = createId();
  await db.insert(leads).values({
    id,
    fullName: d.fullName,
    phone: d.phone,
    email: d.email || null,
    location: d.location,
    propertyType: d.propertyType,
    propertySize: d.propertySize ?? null,
    estimatedBudget: d.estimatedBudget ?? null,
    designStyle: d.designStyle,
    serviceRequired: d.serviceRequired,
    source: d.source,
    assignedDesignerId: d.assignedDesignerId || null,
    enquiryDate: d.enquiryDate || new Date().toISOString(),
    followUpDate: d.followUpDate || null,
    status: (d.status as any) || "new",
    notes: d.notes,
    isSample: false,
  });

  await db.insert(activities).values({
    type: "enquiry",
    title: `New enquiry — ${d.fullName}`,
    description: `${d.propertyType ?? "Project"} in ${d.location ?? "—"}.`,
    actorId: session.id,
    isSample: false,
  });

  // Notify the assigned designer (unless they created the lead themselves).
  if (d.assignedDesignerId && d.assignedDesignerId !== session.id) {
    await notify({
      userId: d.assignedDesignerId,
      type: "lead",
      title: `New lead assigned: ${d.fullName}`,
      body: `${d.propertyType ?? "Project"} in ${d.location ?? "—"}.`,
      href: `/leads/${id}`,
      actorId: session.id,
    });
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function updateLead(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = parse(formData);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message };

  const d = parsed.data;
  await db
    .update(leads)
    .set({
      fullName: d.fullName,
      phone: d.phone,
      email: d.email || null,
      location: d.location,
      propertyType: d.propertyType,
      propertySize: d.propertySize ?? null,
      estimatedBudget: d.estimatedBudget ?? null,
      designStyle: d.designStyle,
      serviceRequired: d.serviceRequired,
      source: d.source,
      assignedDesignerId: d.assignedDesignerId || null,
      enquiryDate: d.enquiryDate || null,
      followUpDate: d.followUpDate || null,
      status: (d.status as any) || "new",
      notes: d.notes,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(leads.id, id));

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true, id };
}

export async function updateLeadStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db
    .update(leads)
    .set({ status: status as any, updatedAt: new Date().toISOString() })
    .where(eq(leads.id, id));
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(leads).where(eq(leads.id, id));
  revalidatePath("/leads");
  return { ok: true };
}

/** Convert a lead into a client + initial project. */
export async function convertLead(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };

  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  if (!lead) return { ok: false, error: "Lead not found" };
  if (lead.convertedClientId)
    return { ok: false, error: "Lead already converted" };

  const clientId = createId();
  await db.insert(clients).values({
    id: clientId,
    name: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    address: lead.location,
    city: lead.location,
    propertyType: lead.propertyType,
    budgetPreference: lead.estimatedBudget,
    designPreferences: lead.designStyle,
    status: "active",
    isSample: false,
  });

  const projectId = createId();
  await db.insert(projects).values({
    id: projectId,
    name: `${lead.fullName} Residence`,
    clientId,
    projectType: lead.propertyType,
    location: lead.location,
    propertyArea: lead.propertySize,
    budget: lead.estimatedBudget ?? 0,
    contractValue: lead.estimatedBudget ?? 0,
    projectManagerId: lead.assignedDesignerId,
    stage: "initial_enquiry",
    status: "in_progress",
    isSample: false,
  });

  await db
    .update(leads)
    .set({ status: "won", convertedClientId: clientId, updatedAt: new Date().toISOString() })
    .where(eq(leads.id, id));

  await db.insert(activities).values({
    type: "general",
    title: `Lead converted — ${lead.fullName}`,
    description: `Created client & project from enquiry.`,
    projectId,
    actorId: session.id,
    isSample: false,
  });

  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/projects");
  return { ok: true, id: projectId };
}
