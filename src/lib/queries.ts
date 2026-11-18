import "server-only";
import { db } from "@/db";
import {
  projects,
  leads,
  clients,
  quotations,
  purchaseOrders,
  tasks,
  activities,
  users,
} from "@/db/schema";
import { desc, eq, ne } from "drizzle-orm";

export async function getDashboardStats() {
  const allProjects = await db.select().from(projects);
  const allLeads = await db.select().from(leads);
  const allQuotes = await db.select().from(quotations);
  const allPOs = await db.select().from(purchaseOrders);

  const activeProjects = allProjects.filter((p) => p.status === "in_progress");
  const newEnquiries = allLeads.filter((l) =>
    ["new", "contacted"].includes(l.status),
  );
  const awaitingApproval = allProjects.filter(
    (p) => p.stage === "concept_design",
  );
  const pendingProcurement = allPOs.filter(
    (po) => !["delivered", "completed"].includes(po.stage),
  );

  const invoices = allQuotes.filter((q) => q.type === "invoice");
  const totalRevenue = invoices
    .filter((q) => q.status === "paid" || q.status === "partially_paid")
    .reduce((s, q) => s + q.amountPaid, 0);
  const outstanding = invoices
    .filter((q) => q.status !== "paid" && q.status !== "draft")
    .reduce((s, q) => s + (q.total - q.amountPaid), 0);

  const convertedLeads = allLeads.filter((l) => l.status === "won").length;
  const conversionRate =
    allLeads.length > 0 ? Math.round((convertedLeads / allLeads.length) * 100) : 0;

  return {
    activeProjects: activeProjects.length,
    totalProjects: allProjects.length,
    newEnquiries: newEnquiries.length,
    awaitingApproval: awaitingApproval.length,
    pendingProcurement: pendingProcurement.length,
    totalRevenue,
    outstanding,
    conversionRate,
    totalContractValue: allProjects.reduce((s, p) => s + p.contractValue, 0),
  };
}

export async function getPipelineProjects() {
  const rows = await db
    .select({
      project: projects,
      clientName: clients.name,
      pmName: users.name,
      pmAvatar: users.avatarUrl,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .leftJoin(users, eq(projects.projectManagerId, users.id))
    .orderBy(projects.sortOrder, desc(projects.updatedAt));
  return rows;
}

export async function getRecentActivity(limit = 8) {
  return db
    .select({
      activity: activities,
      actorName: users.name,
      actorAvatar: users.avatarUrl,
    })
    .from(activities)
    .leftJoin(users, eq(activities.actorId, users.id))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export async function getUpcomingSchedule(limit = 6) {
  return db
    .select({
      task: tasks,
      projectName: projects.name,
      assigneeName: users.name,
      assigneeAvatar: users.avatarUrl,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(ne(tasks.status, "completed"))
    .orderBy(tasks.dueDate)
    .limit(limit);
}

export async function getTeam() {
  return db.select().from(users).orderBy(users.name);
}
