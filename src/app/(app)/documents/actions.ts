"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createId } from "@/lib/id";

export type ActionResult = { ok: boolean; error?: string; id?: string };

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

function fileKind(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return "file";
}

/**
 * Upload a real file as an attachment and register it as a document.
 * The file is stored under /public/uploads and served from /uploads/<name>.
 */
export async function uploadAttachment(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Please choose a file to upload" };
  if (file.size > MAX_UPLOAD_BYTES)
    return { ok: false, error: "File is too large (max 10 MB)" };

  const category = (fd.get("category") as string) || null;
  const clientId = (fd.get("clientId") as string) || null;
  const projectId = (fd.get("projectId") as string) || null;
  const customName = (fd.get("name") as string)?.trim();

  // Sanitise the filename and write the bytes to /public/uploads.
  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
  const storedName = `${createId()}-${safeBase}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, storedName), bytes);

  await db.insert(documents).values({
    id: createId(),
    name: customName || file.name,
    category,
    projectId,
    clientId,
    fileUrl: `/uploads/${storedName}`,
    fileType: fileKind(file.type),
    fileSize: file.size,
    version: 1,
    uploadedById: session.id,
    isSample: false,
  });

  revalidatePath("/documents");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  fileUrl: z.string().optional(),
});

export async function createDocument(fd: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  await db.insert(documents).values({
    id: createId(),
    name: d.name,
    category: d.category,
    projectId: d.projectId || null,
    clientId: d.clientId || null,
    fileUrl: d.fileUrl || "#",
    fileType: "link",
    version: 1,
    uploadedById: session.id,
    isSample: false,
  });
  revalidatePath("/documents");
  return { ok: true };
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };
  await db.delete(documents).where(eq(documents.id, id));
  revalidatePath("/documents");
  return { ok: true };
}
