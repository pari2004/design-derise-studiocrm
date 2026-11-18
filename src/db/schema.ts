import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createId } from "@/lib/id";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */
const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

const timestamps = {
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
};

/* ------------------------------------------------------------------ */
/*  Users & auth                                                       */
/* ------------------------------------------------------------------ */
export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", {
    enum: [
      "admin",
      "project_manager",
      "designer",
      "procurement_manager",
      "finance_manager",
    ],
  })
    .notNull()
    .default("designer"),
  title: text("title"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Leads & Enquiries                                                  */
/* ------------------------------------------------------------------ */
export const leads = sqliteTable("leads", {
  id: id(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  location: text("location"),
  propertyType: text("property_type"),
  propertySize: integer("property_size"), // sq ft
  estimatedBudget: real("estimated_budget"),
  designStyle: text("design_style"),
  serviceRequired: text("service_required"),
  source: text("source"),
  assignedDesignerId: text("assigned_designer_id").references(() => users.id),
  enquiryDate: text("enquiry_date"),
  followUpDate: text("follow_up_date"),
  status: text("status", {
    enum: [
      "new",
      "contacted",
      "consultation_scheduled",
      "proposal_sent",
      "negotiation",
      "won",
      "lost",
      "archived",
    ],
  })
    .notNull()
    .default("new"),
  notes: text("notes"),
  convertedClientId: text("converted_client_id"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Clients                                                            */
/* ------------------------------------------------------------------ */
export const clients = sqliteTable("clients", {
  id: id(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  city: text("city"),
  propertyType: text("property_type"),
  propertyDetails: text("property_details"),
  budgetPreference: real("budget_preference"),
  designPreferences: text("design_preferences"),
  notes: text("notes"),
  avatarUrl: text("avatar_url"),
  status: text("status", { enum: ["active", "prospect", "past", "archived"] })
    .notNull()
    .default("active"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Projects                                                           */
/* ------------------------------------------------------------------ */
export const projects = sqliteTable("projects", {
  id: id(),
  name: text("name").notNull(),
  clientId: text("client_id").references(() => clients.id),
  projectType: text("project_type"),
  propertyAddress: text("property_address"),
  location: text("location"),
  propertyArea: integer("property_area"), // sq ft
  coverImage: text("cover_image"),
  budget: real("budget").notNull().default(0),
  contractValue: real("contract_value").notNull().default(0),
  budgetConsumed: real("budget_consumed").notNull().default(0),
  completion: integer("completion").notNull().default(0), // 0-100
  startDate: text("start_date"),
  expectedCompletion: text("expected_completion"),
  nextDeadline: text("next_deadline"),
  projectManagerId: text("project_manager_id").references(() => users.id),
  // Kanban pipeline stage
  stage: text("stage", {
    enum: ["initial_enquiry", "concept_design", "procurement", "execution"],
  })
    .notNull()
    .default("initial_enquiry"),
  status: text("status", {
    enum: ["in_progress", "completed", "on_hold", "overdue"],
  })
    .notNull()
    .default("in_progress"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Tasks                                                              */
/* ------------------------------------------------------------------ */
export const tasks = sqliteTable("tasks", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  projectId: text("project_id").references(() => projects.id),
  assigneeId: text("assignee_id").references(() => users.id),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] })
    .notNull()
    .default("medium"),
  startDate: text("start_date"),
  dueDate: text("due_date"),
  status: text("status", {
    enum: ["todo", "in_progress", "under_review", "completed", "blocked"],
  })
    .notNull()
    .default("todo"),
  kind: text("kind", {
    enum: ["task", "site_visit", "meeting", "delivery", "installation"],
  })
    .notNull()
    .default("task"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Moodboards & items                                                 */
/* ------------------------------------------------------------------ */
export const moodboards = sqliteTable("moodboards", {
  id: id(),
  title: text("title").notNull(),
  projectId: text("project_id").references(() => projects.id),
  description: text("description"),
  coverImage: text("cover_image"),
  room: text("room"),
  approvalStatus: text("approval_status", {
    enum: ["draft", "shared", "approved", "changes_requested", "rejected"],
  })
    .notNull()
    .default("draft"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const moodboardItems = sqliteTable("moodboard_items", {
  id: id(),
  moodboardId: text("moodboard_id")
    .references(() => moodboards.id)
    .notNull(),
  imageUrl: text("image_url").notNull(),
  label: text("label"),
  category: text("category"),
  note: text("note"),
  colorHex: text("color_hex"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Materials Library                                                  */
/* ------------------------------------------------------------------ */
export const materials = sqliteTable("materials", {
  id: id(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  brand: text("brand"),
  vendorId: text("vendor_id").references(() => vendors.id),
  imageUrl: text("image_url"),
  sku: text("sku"),
  unit: text("unit").default("unit"),
  costPrice: real("cost_price").notNull().default(0),
  sellingPrice: real("selling_price").notNull().default(0),
  availability: text("availability", {
    enum: ["in_stock", "made_to_order", "out_of_stock"],
  })
    .notNull()
    .default("in_stock"),
  specifications: text("specifications"),
  color: text("color"),
  finish: text("finish"),
  dimensions: text("dimensions"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Vendors                                                            */
/* ------------------------------------------------------------------ */
export const vendors = sqliteTable("vendors", {
  id: id(),
  name: text("name").notNull(),
  company: text("company"),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  gstin: text("gstin"),
  categories: text("categories"), // comma-separated
  paymentTerms: text("payment_terms"),
  rating: real("rating").default(0),
  logoUrl: text("logo_url"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Procurement — Purchase Orders                                      */
/* ------------------------------------------------------------------ */
export const purchaseOrders = sqliteTable("purchase_orders", {
  id: id(),
  poNumber: text("po_number").notNull(),
  projectId: text("project_id").references(() => projects.id),
  vendorId: text("vendor_id").references(() => vendors.id),
  title: text("title").notNull(),
  description: text("description"),
  quantity: real("quantity").default(1),
  unit: text("unit").default("unit"),
  amount: real("amount").notNull().default(0),
  expectedDelivery: text("expected_delivery"),
  receivedQuantity: real("received_quantity").default(0),
  stage: text("stage", {
    enum: [
      "requirement",
      "vendor_selection",
      "quotation_received",
      "approval_pending",
      "po_created",
      "order_placed",
      "in_transit",
      "delivered",
      "quality_inspection",
      "completed",
    ],
  })
    .notNull()
    .default("requirement"),
  paymentStatus: text("payment_status", {
    enum: ["unpaid", "partial", "paid"],
  })
    .notNull()
    .default("unpaid"),
  notes: text("notes"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Quotations & Invoices                                              */
/* ------------------------------------------------------------------ */
export const quotations = sqliteTable("quotations", {
  id: id(),
  number: text("number").notNull(),
  type: text("type", { enum: ["quotation", "invoice"] })
    .notNull()
    .default("quotation"),
  // Which PDF layout this document renders as.
  template: text("template", { enum: ["standard", "estimation"] })
    .notNull()
    .default("standard"),
  // Revisions: revisionOf points to the ROOT original quotation this revises
  // (null for originals). revisionNumber is 1 for originals, 2+ for revisions.
  revisionOf: text("revision_of"),
  revisionNumber: integer("revision_number").notNull().default(1),
  clientId: text("client_id").references(() => clients.id),
  projectId: text("project_id").references(() => projects.id),
  issueDate: text("issue_date"),
  dueDate: text("due_date"),
  subtotal: real("subtotal").notNull().default(0),
  discount: real("discount").notNull().default(0),
  additionalCharges: real("additional_charges").notNull().default(0),
  gstRate: real("gst_rate").notNull().default(18),
  gstAmount: real("gst_amount").notNull().default(0),
  total: real("total").notNull().default(0),
  amountPaid: real("amount_paid").notNull().default(0),
  status: text("status", {
    enum: [
      "draft",
      "sent",
      "accepted",
      "partially_paid",
      "paid",
      "overdue",
      "rejected",
    ],
  })
    .notNull()
    .default("draft"),
  terms: text("terms"),
  notes: text("notes"),
  // Estimation-template boilerplate (editable per document; prefilled from
  // studio defaults in lib/constants.ts → ESTIMATION_DEFAULTS).
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIfsc: text("bank_ifsc"),
  materialSpecs: text("material_specs"), // one point per line
  designTimelines: text("design_timelines"), // one point per line
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const quotationItems = sqliteTable("quotation_items", {
  id: id(),
  quotationId: text("quotation_id")
    .references(() => quotations.id)
    .notNull(),
  description: text("description").notNull(),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit").default("unit"),
  unitPrice: real("unit_price").notNull().default(0),
  amount: real("amount").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  // Estimation-template fields (null for standard documents).
  section: text("section"), // e.g. "3BHK" / "2BHK"
  room: text("room"), // e.g. "Master Bedroom" / "Modular Kitchen"
  subCategory: text("sub_category"), // e.g. "Wardrobe"
  specification: text("specification"), // e.g. "Ferro Cement"
  nos: real("nos"), // count of units
  length: real("length"), // feet
  width: real("width"), // feet
});

/* ------------------------------------------------------------------ */
/*  Documents                                                          */
/* ------------------------------------------------------------------ */
export const documents = sqliteTable("documents", {
  id: id(),
  name: text("name").notNull(),
  category: text("category"),
  projectId: text("project_id").references(() => projects.id),
  clientId: text("client_id").references(() => clients.id),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  version: integer("version").notNull().default(1),
  uploadedById: text("uploaded_by_id").references(() => users.id),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Activity feed                                                      */
/* ------------------------------------------------------------------ */
export const activities = sqliteTable("activities", {
  id: id(),
  type: text("type", {
    enum: [
      "enquiry",
      "approval",
      "vendor",
      "payment",
      "procurement",
      "site_visit",
      "task",
      "general",
    ],
  })
    .notNull()
    .default("general"),
  title: text("title").notNull(),
  description: text("description"),
  projectId: text("project_id"),
  actorId: text("actor_id"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Notifications (per-user)                                           */
/* ------------------------------------------------------------------ */
export const notifications = sqliteTable("notifications", {
  id: id(),
  // Recipient — who should see this notification.
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type", {
    enum: [
      "lead",
      "task",
      "project",
      "approval",
      "payment",
      "procurement",
      "system",
    ],
  })
    .notNull()
    .default("system"),
  title: text("title").notNull(),
  body: text("body"),
  // In-app link to open when the notification is clicked.
  href: text("href"),
  // Who triggered it (optional).
  actorId: text("actor_id").references(() => users.id),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  readAt: text("read_at"),
  isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/*  Type exports                                                       */
/* ------------------------------------------------------------------ */
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Moodboard = typeof moodboards.$inferSelect;
export type MoodboardItem = typeof moodboardItems.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type Quotation = typeof quotations.$inferSelect;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
