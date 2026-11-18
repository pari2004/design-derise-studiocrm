import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { purchaseOrders, projects, vendors } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { ProcurementClient } from "@/components/procurement/procurement-client";
import { Card } from "@/components/ui/card";
import { formatINRCompact } from "@/lib/format";
import { ShoppingCart, Truck, PackageCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProcurementPage() {
  const [rows, projectList, vendorList] = await Promise.all([
    db
      .select({ po: purchaseOrders, projectName: projects.name, vendorName: vendors.name })
      .from(purchaseOrders)
      .leftJoin(projects, eq(purchaseOrders.projectId, projects.id))
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .orderBy(desc(purchaseOrders.createdAt)),
    db.select({ id: projects.id, name: projects.name }).from(projects),
    db.select({ id: vendors.id, name: vendors.name }).from(vendors),
  ]);

  const data = rows.map((r) => ({ ...r.po, projectName: r.projectName, vendorName: r.vendorName }));
  const totalValue = data.reduce((s, p) => s + p.amount, 0);
  const inTransit = data.filter((p) => ["order_placed", "in_transit"].includes(p.stage)).length;
  const delivered = data.filter((p) => ["delivered", "quality_inspection", "completed"].includes(p.stage)).length;
  const pending = data.filter((p) => ["requirement", "vendor_selection", "quotation_received", "approval_pending", "po_created"].includes(p.stage)).length;

  const stats = [
    { label: "Total Order Value", value: formatINRCompact(totalValue), icon: ShoppingCart },
    { label: "Pending", value: pending, icon: Clock },
    { label: "In Transit", value: inTransit, icon: Truck },
    { label: "Delivered", value: delivered, icon: PackageCheck },
  ];

  return (
    <div>
      <PageHeader
        kicker="Delivery"
        title="Procurement"
        subtitle="Track every purchase order from requirement through to delivery and payment."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} glass className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-charcoal text-cream"><Icon className="h-5 w-5" /></div>
              <div>
                <p className="font-display text-xl font-bold text-charcoal-text">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>
      <ProcurementClient orders={data} projects={projectList} vendors={vendorList} />
    </div>
  );
}
