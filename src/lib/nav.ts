import {
  LayoutDashboard,
  LayoutGrid,
  UserPlus,
  Users,
  FolderKanban,
  KanbanSquare,
  Images,
  Library,
  ShoppingCart,
  Truck,
  CheckSquare,
  Wallet,
  FileText,
  FolderArchive,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  group: "workspace" | "sales" | "delivery" | "finance" | "system";
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutGrid, group: "workspace" },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "workspace" },
  { label: "Leads & Enquiries", href: "/leads", icon: UserPlus, group: "sales" },
  { label: "Clients", href: "/clients", icon: Users, group: "sales" },
  { label: "Projects", href: "/projects", icon: FolderKanban, group: "delivery" },
  { label: "Project Pipeline", href: "/pipeline", icon: KanbanSquare, group: "delivery" },
  { label: "Moodboards", href: "/moodboards", icon: Images, group: "delivery" },
  { label: "Materials Library", href: "/materials", icon: Library, group: "delivery" },
  { label: "Procurement", href: "/procurement", icon: ShoppingCart, group: "delivery" },
  { label: "Vendors", href: "/vendors", icon: Truck, group: "delivery" },
  { label: "Tasks & Schedule", href: "/tasks", icon: CheckSquare, group: "delivery" },
  { label: "Finance & Budgets", href: "/finance", icon: Wallet, group: "finance" },
  { label: "Quotations & Invoices", href: "/quotations", icon: FileText, group: "finance" },
  { label: "Documents & Contracts", href: "/documents", icon: FolderArchive, group: "finance" },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3, group: "finance" },
  { label: "Settings", href: "/settings", icon: Settings, group: "system" },
];

export const NAV_GROUPS: { id: NavItem["group"]; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "sales", label: "Sales" },
  { id: "delivery", label: "Delivery" },
  { id: "finance", label: "Finance" },
  { id: "system", label: "System" },
];
