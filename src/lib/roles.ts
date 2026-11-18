/* Client-safe role helpers & types (no server-only imports). */

export type Role =
  | "admin"
  | "project_manager"
  | "designer"
  | "procurement_manager"
  | "finance_manager";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  title: string | null;
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  designer: "Designer",
  procurement_manager: "Procurement Manager",
  finance_manager: "Finance Manager",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function can(role: Role | undefined, action: string): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  const matrix: Record<Role, string[]> = {
    admin: ["*"],
    project_manager: [
      "project.manage",
      "task.manage",
      "procurement.view",
      "client.view",
      "lead.view",
      "finance.view",
    ],
    designer: [
      "moodboard.manage",
      "project.view",
      "client.view",
      "material.view",
      "approval.manage",
    ],
    procurement_manager: [
      "vendor.manage",
      "material.manage",
      "procurement.manage",
      "project.view",
    ],
    finance_manager: [
      "finance.manage",
      "quotation.manage",
      "invoice.manage",
      "project.view",
      "client.view",
    ],
  };
  return matrix[role]?.includes(action) ?? false;
}
