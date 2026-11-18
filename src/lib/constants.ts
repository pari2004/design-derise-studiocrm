/* Domain labels, options & status styling shared across the app. */

export type BadgeVariant =
  | "default"
  | "lime"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

/* ----------------------------- Leads ----------------------------- */
export const LEAD_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  new: { label: "New", variant: "info" },
  contacted: { label: "Contacted", variant: "secondary" },
  consultation_scheduled: { label: "Consultation", variant: "warning" },
  proposal_sent: { label: "Proposal Sent", variant: "warning" },
  negotiation: { label: "Negotiation", variant: "default" },
  won: { label: "Won", variant: "lime" },
  lost: { label: "Lost", variant: "danger" },
  archived: { label: "Archived", variant: "muted" },
};

export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS).map(
  ([value, v]) => ({ value, label: v.label }),
);

export const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "Penthouse",
  "Independent House",
  "Row House",
  "Commercial Office",
  "Retail Store",
  "Restaurant / Cafe",
  "Hotel / Hospitality",
];

export const DESIGN_STYLES = [
  "Modern Minimalist",
  "Contemporary",
  "Luxury Classic",
  "Scandinavian",
  "Industrial",
  "Bohemian",
  "Mid-Century Modern",
  "Indian Traditional",
  "Art Deco",
  "Japandi",
];

export const SERVICES = [
  "Full Home Interior",
  "Modular Kitchen",
  "Living Room Design",
  "Bedroom Design",
  "Turnkey Project",
  "Consultation Only",
  "Commercial Fit-out",
  "Renovation",
];

export const LEAD_SOURCES = [
  "Online",
  "Website",
  "Organic Social",
  "Paid Ads",
  "Walk-in",
  "Phone Enquiry",
  "Manual Entry",
  "Referral",
  "Instagram",
  "Google Ads",
  "Exhibition",
  "Architect Referral",
  "Past Client",
];

/* ---------------------------- Clients ---------------------------- */
export const CLIENT_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  active: { label: "Active", variant: "lime" },
  prospect: { label: "Prospect", variant: "info" },
  past: { label: "Past", variant: "secondary" },
  archived: { label: "Archived", variant: "muted" },
};

/* ---------------------------- Projects --------------------------- */
export const PROJECT_STAGES = [
  { value: "initial_enquiry", label: "Initial Enquiry" },
  { value: "concept_design", label: "Concept & Design" },
  { value: "procurement", label: "Procurement" },
  { value: "execution", label: "Execution & Installation" },
] as const;

export const PROJECT_STAGE_LABELS: Record<string, string> = Object.fromEntries(
  PROJECT_STAGES.map((s) => [s.value, s.label]),
);

export const PROJECT_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  in_progress: { label: "In Progress", variant: "info" },
  completed: { label: "Completed", variant: "lime" },
  on_hold: { label: "On Hold", variant: "warning" },
  overdue: { label: "Overdue", variant: "danger" },
};

/* ----------------------------- Tasks ----------------------------- */
export const TASK_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  todo: { label: "To Do", variant: "muted" },
  in_progress: { label: "In Progress", variant: "info" },
  under_review: { label: "Under Review", variant: "warning" },
  completed: { label: "Completed", variant: "lime" },
  blocked: { label: "Blocked", variant: "danger" },
};

export const TASK_PRIORITY: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  low: { label: "Low", variant: "muted" },
  medium: { label: "Medium", variant: "secondary" },
  high: { label: "High", variant: "warning" },
  urgent: { label: "Urgent", variant: "danger" },
};

/* -------------------------- Moodboards --------------------------- */
export const MOODBOARD_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Draft", variant: "muted" },
  shared: { label: "Shared with Client", variant: "info" },
  approved: { label: "Approved", variant: "lime" },
  changes_requested: { label: "Changes Requested", variant: "warning" },
  rejected: { label: "Rejected", variant: "danger" },
};

/* -------------------------- Materials ---------------------------- */
export const MATERIAL_CATEGORIES = [
  "Flooring",
  "Tiles",
  "Marble & Granite",
  "Wallpaper",
  "Paint",
  "Wood & Veneers",
  "Furniture",
  "Lighting",
  "Fabrics",
  "Curtains",
  "Hardware",
  "Bathroom Fittings",
  "Kitchen Accessories",
  "Decorative Items",
];

export const AVAILABILITY: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  in_stock: { label: "In Stock", variant: "lime" },
  made_to_order: { label: "Made to Order", variant: "warning" },
  out_of_stock: { label: "Out of Stock", variant: "danger" },
};

/* -------------------------- Procurement -------------------------- */
export const PROCUREMENT_STAGES = [
  { value: "requirement", label: "Material Requirement" },
  { value: "vendor_selection", label: "Vendor Selection" },
  { value: "quotation_received", label: "Quotation Received" },
  { value: "approval_pending", label: "Approval Pending" },
  { value: "po_created", label: "Purchase Order Created" },
  { value: "order_placed", label: "Order Placed" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "quality_inspection", label: "Quality Inspection" },
  { value: "completed", label: "Completed" },
] as const;

export const PROCUREMENT_STAGE_LABELS: Record<string, string> =
  Object.fromEntries(PROCUREMENT_STAGES.map((s) => [s.value, s.label]));

export const PAYMENT_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  unpaid: { label: "Unpaid", variant: "danger" },
  partial: { label: "Partially Paid", variant: "warning" },
  paid: { label: "Paid", variant: "lime" },
};

/* -------------------- Quotations & Invoices ---------------------- */
export const DOC_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Draft", variant: "muted" },
  sent: { label: "Sent", variant: "info" },
  accepted: { label: "Accepted", variant: "lime" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
  paid: { label: "Paid", variant: "lime" },
  overdue: { label: "Overdue", variant: "danger" },
  rejected: { label: "Rejected", variant: "danger" },
};

/* -------------------- Estimation template ------------------------ */
/** Measurement unit for an estimation line (running feet vs square feet). */
export const ESTIMATION_UNITS = ["rft", "sqft", "nos", "lot"] as const;

/** Common construction/finish specifications shown per line. */
export const ESTIMATION_SPECIFICATIONS = [
  "Ferro Cement",
  "Brick and Cement",
  "Tiles (wall and Bottom)",
  "Plywood",
  "Laminate",
];

/** Suggested room / area names for grouping estimation lines. */
export const ESTIMATION_ROOMS = [
  "Master Bedroom",
  "Guest Bedroom",
  "Kids Bedroom",
  "Storage Room",
  "Walking Wardrobe",
  "Passage Area",
  "Foyer",
  "Living Area",
  "TV Unit",
  "Study Unit",
  "Crockery",
  "Balcony Storage",
  "Modular Kitchen",
];

/** Studio-wide defaults that pre-fill every new estimation; editable per doc. */
export const ESTIMATION_DEFAULTS = {
  bankAccountName: "Mohan R",
  bankAccountNumber: "55560103437585",
  bankIfsc: "FDRL0005556",
  materialSpecs: [
    "BWP 710 Grade Plywood for Kitchen, BlockBoard for shutters.",
    "MR IS:303 Grade plywood for Wardrobe, Study, Crockery, Pooja, Shoe Unit, etc. Carcass & Hdhmr/BlockBoard for Shutters.",
    "Edge Banding 2mm for Shutters.",
    "Ebco (or) equivalent Drawer Channels, Normal / Soft Closing Hinges for Wardrobes wherever mentioned along with the Product Description.",
    "Outer Laminate: 1mm Colour Laminates, any finish you choose (Matt / Hi-Glossy / Texture).",
    "Europa (or) equivalent Locks for Drawers & Wardrobes; Europa (or) equivalent for Sliding Wardrobe.",
    "Handles budget: 1.5% of the quoted value is paid by the company; anything above 1.5% is paid by the customer.",
    "Electrical work is not included; if required it will be charged additionally.",
    "Anything not mentioned in the quotation will be charged additionally.",
    "If the finish changes, the price will also change.",
    "Tiles are selected between ₹40 to ₹80.",
  ].join("\n"),
  designTimelines: [
    "Quotation may vary as per selection of materials and change in measurements at actuals.",
    "Requirements not mentioned in the quotation that are added in the designing phase will be revised at actuals.",
    "After design sign-off, designs cannot be changed. If needed, it will be charged extra.",
  ].join("\n"),
} as const;

export const DOCUMENT_CATEGORIES = [
  "Client Agreement",
  "Design Proposal",
  "Floor Plan",
  "3D Render",
  "Purchase Order",
  "Vendor Quotation",
  "Invoice",
  "Site Photograph",
  "Approval Document",
  "Other",
];
