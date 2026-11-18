import { NextResponse } from "next/server";
import { like, or } from "drizzle-orm";
import { db } from "@/db";
import {
  projects,
  clients,
  leads,
  vendors,
  materials,
} from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });
  const term = `%${q}%`;

  const [proj, cli, lea, ven, mat] = await Promise.all([
    db.select().from(projects).where(or(like(projects.name, term), like(projects.location, term))).limit(5),
    db.select().from(clients).where(or(like(clients.name, term), like(clients.email, term))).limit(5),
    db.select().from(leads).where(or(like(leads.fullName, term), like(leads.email, term))).limit(5),
    db.select().from(vendors).where(or(like(vendors.name, term), like(vendors.company, term))).limit(4),
    db.select().from(materials).where(or(like(materials.name, term), like(materials.category, term))).limit(4),
  ]);

  const results = [
    ...proj.map((p) => ({ id: p.id, type: "project", title: p.name, subtitle: `${p.projectType ?? ""} · ${p.location ?? ""}`, href: `/projects/${p.id}` })),
    ...cli.map((c) => ({ id: c.id, type: "client", title: c.name, subtitle: c.email ?? c.city ?? "", href: `/clients/${c.id}` })),
    ...lea.map((l) => ({ id: l.id, type: "lead", title: l.fullName, subtitle: `${l.propertyType ?? ""} · ${l.location ?? ""}`, href: `/leads/${l.id}` })),
    ...ven.map((v) => ({ id: v.id, type: "vendor", title: v.name, subtitle: v.company ?? "", href: `/vendors` })),
    ...mat.map((m) => ({ id: m.id, type: "material", title: m.name, subtitle: `${m.category} · ${m.brand ?? ""}`, href: `/materials` })),
  ];

  return NextResponse.json({ results });
}
